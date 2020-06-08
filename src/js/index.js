import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements , renderLoader, clearLoader } from './views/base';

const state ={};

const controlSearch = async () => {

    const query = searchView.getInput();

    if (query) {
        
        state.search = new Search(query);

        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        await state.search.getResults();
        
        clearLoader();
        
        searchView.renderResults(state.search.result);
    }
}

elements.searchForm.addEventListener('submit', e => {
    
    e.preventDefault();
    controlSearch();

});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn){

        const goToPage = parseInt(btn.dataset.goto,10);
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);
        
    }
});



// Recipe Contoller


const controlRecipe = async () => {

    const id = window.location.hash.replace('#', '');
   // console.log(id);

    if (id) {

        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) searchView.highlightSelected(id);

        state.recipe = new Recipe(id);

        try {
            
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            state.recipe.calcTime();
            state.recipe.calcServings();

            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (error) {
            console.log(err);
            alert('something went wrong');
        }
    }
};

window.addEventListener('hashchange', controlRecipe);
window.addEventListener('load', controlRecipe);

// [ 'haschange', 'load'].forEach (event => window.addevlis(event, controlrecpe));

//list Controller
const controlList = () =>{
    if (!state.list) state.list = new List();

    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//handle delete and update list item events
elements.shopping.addEventListener('click', e => {

    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')){
         state.list.deleteItem(id);
         listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }

});

//like controller
/*testing
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());
*/
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // add likes to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // toogle  the like buttons
        likesView.toggleLikeBtn(true);

        //add likes to UI
        likesView.renderLike(newLike);
       // console.log(state.likes);
    
    }else {
        //remove like from state
        state.likes.deleteLike(currentID);

        //toogle the like button
        likesView.toggleLikeBtn(false);

        //remove like from UI list
        likesView.deleteLike(currentID);
        //console.log(state.likes);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());

};


//restoreliked recipe on page load
window.addEventListener('load', () =>{
    state.likes = new Likes();
    
    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));

});


//Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {

        //decrease button clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if (e.target.matches('.btn-increase, .btn-increase *')) {
        
        // increase button clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // add ingredients to shopping list
        controlList();
    
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //like controller
        controlLike();
    }
});

