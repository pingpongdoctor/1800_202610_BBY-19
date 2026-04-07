import { db } from '../firebaseConfig.js';
import { collection, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { getLocationsByPlaceNameAndCountry, getLocationsByPlaceName, addMarker, getLocationsInVacouverByType } from "../mapFunctions.js";
import { map } from "./map.js"
import { addNewLocation } from "../locations.js"
import { onAuthReady } from '/src/authentication.js';

// Queries data that corresponds to the location type
export const queryMap = {
    restaurant: ["restaurant", "food", "dining", "eatery", "diner", "bistro", "grill", "kitchen"],
    hotel: ["hotel", "motel", "inn", "hostel", "resort", "lodge", "suites", "accommodation"],
    cafe: ["coffee", "cafe", "espresso", "coffeehouse", "coffee shop", "tea house", "bakery", "roastery"],
    transit: ["transit", "bus stop", "skytrain", "subway", "train station", "bus station", "ferry", "bus terminal"],
    attraction: ["attraction", "museum", "park", "gallery", "landmark", "theatre", "aquarium", "zoo", "stadium", "monument"]
};

// Defines a custom HTML element (for search bar)
class SiteSearchbar extends HTMLElement {
    // This runs automatically when the element is added to the page
    connectedCallback() {
        // This is the actual HTML being injected into the component
        this.innerHTML = `
            <div class="container mt-3">
                <div class="input-group">
                    <input type="text" id="searchInput" class="form-control" placeholder="Search..." autocomplete="off">
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle btn-filter-list" type="button" id="filterBtn" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                            Filters
                        </button>
                        <div class="dropdown-menu p-3" id="filterMenu" style="min-width: 220px;">
                            <p class="text-muted small mb-2">Loading filters...</p>
                        </div>
                    </div>
                </div>
                <div id="suggestion-item" class="searchbar-suggestions hidden-suggestion"></div>
                <ul class="filter-list">
                    <li class="filter-item">Restaurant</li>
                    <li class="filter-item">Hotel</li>
                    <li class="filter-item">Cafe</li>
                    <li class="filter-item">Transit</li>
                    <li class="filter-item">Attraction</li>
                </ul>
                <div class="card" id="mapStats" style="display: none;">
                    <h6 id="pointsDisplay"></h6>
                    <h6 id="stepsDisplay"></h6>
                </div>
            </div>
        `;

        // References to the elements, querySelector instead of getElementById so it only searches inside this component
        const searchInput = this.querySelector('#searchInput');
        const suggestions = this.querySelector('#suggestion-item');
        const filterMenu = this.querySelector('#filterMenu');

        const mapStats = this.querySelector('#mapStats');
        const pointsDisplay = this.querySelector('#pointsDisplay');
        const stepsDisplay = this.querySelector('#stepsDisplay');

        // Wait until Firebase Auth finishes checking the user's auth state
        onAuthReady(async (user) => {

            if (!user) {
                return; // Stop execution
            }

            // Setup a listener on the user's doc that automatically updates when the data is changed
            const userSnapshot = onSnapshot(doc(db, "users", user.uid), (doc) => {
                const points = doc.data().points;
                const steps = doc.data().steps;

                mapStats.style = "";
                if (pointsDisplay) pointsDisplay.textContent = `Points: ${points}`;
                if (stepsDisplay) stepsDisplay.textContent = `Steps: ${steps}`;
            });

        });





        // Load autocomplete suggestions from Firestore - REPLACE WITH ACTUAL LOCATIONS LATER!
        // let autocompleteSuggestions = [];
        // // fetch docs from specific collection, .then() runs ONLY after the fetch 
        // getDocs(collection(db, 'autocomplete')).then(snapshot => {
        //     // Loops through each document, read specific field, adds to the array
        //     snapshot.forEach(doc => {
        //         const { suggestion } = doc.data();
        //         if (suggestion) autocompleteSuggestions.push(suggestion);
        //     });
        // });

        // Keeps track of markers placed by search so we can remove them between searches
        let searchMarkers = [];

        // Removes all markers from the previous search before placing new ones
        function clearSearchMarkers() {
            searchMarkers.forEach(marker => marker.remove());
            searchMarkers = [];
        }

        // Close the route panel when the user focuses the search bar
        searchInput.addEventListener('focus', () => {
            if (window.closeRoutePanel) window.closeRoutePanel();
        });

        // Autocomplete, fires everytime user types a character in search box
        searchInput.addEventListener('input', async function () {
            const query = searchInput.value.toLowerCase();
            // Clears any previously shown suggestions
            suggestions.innerHTML = '';
            if (query) {
                // Fetch Vancouver coordinates for bounding the search
                const vancouverCoordinates = await getLocationsByPlaceName("Vancouver, BC, Canada");
                // Fetch locations from MapTiler using the input value
                const data = await getLocationsByPlaceNameAndCountry(query, ["ca"], 10, vancouverCoordinates[0].center, vancouverCoordinates[0].bbox);

                // Use a Set to track unique results and avoid duplicate suggestion items
                const set = new Set();
                // Filter to only show results whose text matches the query
                data.filter(location => location.text.toLowerCase().includes(query)).forEach(result => {
                    // Skip if we already have a suggestion with this text
                    if (set.has(result.text)) {
                        return;
                    }
                    console.log(result)
                    set.add(result.text)

                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = result.text;

                    // When a suggestion is clicked, place markers for all matching locations
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = result.text;
                        suggestions.innerHTML = '';

                        // Remove markers from the previous search
                        clearSearchMarkers();

                        // Place a marker for each result using the new popup system
                        // Each marker gets locationData so it shows the styled popup + detail panel
                        data.forEach(async location => {
                            const { id, text, place_name, properties, center } = location;

                            // Pass locationData including a saveCallback so the panel's
                            // Save button works for these unsaved search results
                            const marker = await addMarker(center, map, {
                                name: text,
                                description: place_name,
                                type: properties?.categories?.[0] || '',
                                saveCallback: () => {
                                    addNewLocation(id, text, place_name, properties?.categories?.[0] || '', center[0], center[1]);
                                }
                            });

                            searchMarkers.push(marker);
                        });
                    });

                    suggestions.appendChild(suggestionItem);
                });

                // Show a text indicating that there are not found matching search result
                if (set.size == 0 && suggestions.innerHTML == "") {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = "No found results";
                    suggestions.appendChild(suggestionItem);
                }
            }
            // Hide the suggestion bar when the input is empty
            if (searchInput.value.trim() == "") {
                if (!suggestions.classList.contains("hidden-suggestion")) {
                    suggestions.classList.add("hidden-suggestion")
                }
            } else {
                if (suggestions.classList.contains("hidden-suggestion")) {
                    suggestions.classList.remove("hidden-suggestion")
                }
            }
        });

        // Listens for any click outside of the search bar, if that happens, it closes the suggestions
        document.addEventListener('click', function (event) {
            if (event.target !== searchInput) {
                if (!suggestions.classList.contains("hidden-suggestion")) {
                    suggestions.classList.add("hidden-suggestion")
                }
                searchInput.value = "";
            }
        });

        // Load filters from Firestore
        getDocs(collection(db, 'filters')).then(snapshot => {
            filterMenu.innerHTML = '';

            // Validation to check if the collection is empty
            if (snapshot.empty) {
                filterMenu.innerHTML = '<p class="text-muted small mb-0">No filters available.</p>';
                return;
            }

            // Loops through each document, reads label and value, then create a unique id that matches firestore's doc ID
            snapshot.forEach(doc => {
                const { label, value } = doc.data();
                const id = `filter-${doc.id}`;

                // Creates a check box for each filter and appends that to filter dropdown menu
                const item = document.createElement('div');
                item.classList.add('form-check');
                item.innerHTML = `
                    <input class="form-check-input filter-checkbox" type="checkbox" value="${value}" id="${id}">
                    <label class="form-check-label" for="${id}">${label}</label>
                `;
                filterMenu.appendChild(item);
            });

            // Apply filter button creation
            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn btn-primary btn-sm mt-2 w-100';
            applyBtn.textContent = 'Apply';

            // On click, stores the filter values in an array - we will need this later to  filter out the actual map
            applyBtn.addEventListener('click', () => {
                const selected = [...filterMenu.querySelectorAll('.filter-checkbox:checked')]
                    .map(cb => cb.value);

                // fires off an event that carries all the filters selected. bubbles: true allows the entire page to access this data
                this.dispatchEvent(new CustomEvent('filtersApplied', {
                    detail: { filters: selected },
                    bubbles: true
                }));
            });
            filterMenu.appendChild(applyBtn);
        });

        // Add evenlisteners to the filter button to highlight options when hovering
        function highlightFilterItemWhenHover() {
            const filterItems = document.querySelectorAll(".filter-item");
            filterItems.forEach(filterItem => {
                filterItem.addEventListener("mouseover", (event) => {
                    filterItem.classList.add("filter-item-hover");
                })
                filterItem.addEventListener("mouseleave", (event) => {
                    filterItem.classList.remove("filter-item-hover");
                })
            })
        }

        // Make the filter list appear and disappear by clicking the filter button
        function toggleFilterList() {
            const filterMenu = document.querySelector(".filter-list");
            const filterButton = document.querySelector(".btn-filter-list");

            filterButton.addEventListener("click", (event) => {
                filterMenu.classList.toggle("filter-list-appear");
            })
        }

        // Clear all filter markers
        function clearFilterMarkers() {
            window._allMarkers.forEach(marker => marker.remove());
            window._allMarkers = [];
        }

        // Show locations based on types when clicking options in filter menu
        async function showLocationBasedOnType(types) {
            // clear all marker before adding new ones
            clearFilterMarkers()

            types.forEach(async (type) => {
                const locations = await getLocationsInVacouverByType(type);

                locations.forEach(location => {
                    addMarker(
                        [location.center[0], location.center[1]],
                        map,
                        { name: location.text, description: location.text, type, id: location.id }
                    );
                })
            })
        }

        // Add the evenlistener to the filter items to add locations when clicking them
        function clickFilterItemsToShowLocationsByType() {
            const filterItems = document.querySelectorAll(".filter-item");
            const filterList = document.querySelector(".filter-list");

            filterItems.forEach(filterItem => {
                const type = filterItem.textContent.toLocaleLowerCase();

                filterItem.addEventListener("click", (event) => {
                    showLocationBasedOnType(queryMap[type]);
                
                    // Hide the filter list when user clicks a filter option
                    if (filterList.classList.contains("filter-list-appear")) {
                        filterList.classList.remove("filter-list-appear");
                    }
                })
            })
        }

        // Function that allows closing the filter list when clicking somewhere else
        function closeFilterListWhenClickingOtherComponents() {
            const filterListContainer = document.querySelector(".container");
            const filterList = document.querySelector(".filter-list");
            window.addEventListener('click', (e) => {
                console.log(filterList.contains(e.target));
                if (!filterListContainer.contains(e.target)) {
                    filterList.classList.remove("filter-list-appear");
                }
            })
        }

        function clearFilterMarkerWhenClickTheClearBtn() {

        }

        toggleFilterList();
        highlightFilterItemWhenHover();
        clickFilterItemsToShowLocationsByType();
        closeFilterListWhenClickingOtherComponents();
    }
}

customElements.define('site-searchbar', SiteSearchbar);