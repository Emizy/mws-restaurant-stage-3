let restaurants,
    neighborhoods,
    cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
// document.addEventListener('DOMContentLoaded', (event) => {
document.addEventListener('DOMContentLoaded', () => {
    initMap(); // added 
    fetchNeighborhoods();
    fetchCuisines();
});


window.addEventListener('load', function() {
    DBHelper.processQueue();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */

initMap = () => {

    self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiZXVuaWNlbW9kdXBlIiwiYSI6ImNqcDkzamZ5ZjA1emozcHA2dGtxejFzeDAifQ.4Y6zIevh5iQIzrU3KvyD3A',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newMap);

    updateRestaurants();

}






/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    const fav = document.createElement('button');
    fav.className = 'fav-control';
    fav.setAttribute('aria-label', 'favorite');

    // RegEx method tests if is_favorite is true or "true" and returns true
    // https://codippa.com/how-to-convert-string-to-boolean-javascript/
    if ((/true/i).test(restaurant.is_favorite)) {
        fav.classList.add('active');
        fav.setAttribute('aria-pressed', 'true');
        fav.innerHTML = `Remove ${restaurant.name} as a favorite`;
        fav.title = `Remove ${restaurant.name} as a favorite`;
    } else {
        fav.setAttribute('aria-pressed', 'false');
        fav.innerHTML = `Add ${restaurant.name} as a favorite`;
        fav.title = `Add ${restaurant.name} as a favorite`;
    }

    fav.addEventListener('click', (evt) => {
        favoriteClickHandler(evt, fav, restaurant);
    }, false);

    li.append(fav);

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = DBHelper.imageSrcsetForIndex(restaurant);
    image.sizes = '300px';
    const altText = restaurant.name + ' restaurant in ' + restaurant.neighborhood;
    image.title = altText;
    image.alt = altText;
    li.append(image);

    const div = document.createElement('div');
    div.className = 'restaurant-info';

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    div.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    div.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    div.append(address);

    li.append(div);

    const more = document.createElement('button');
    more.innerHTML = 'View Details';
    more.addEventListener('click', () => { window.location.href = DBHelper.urlForRestaurant(restaurant); });
    li.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);

        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
    });

}