import { db } from '../firebaseConfig.js';
import { collection, doc, getDocs } from 'firebase/firestore';
import * as maptilersdk from '@maptiler/sdk';
import { getLocationsByPlaceNameAndCountry, getLocationsByPlaceName, addMarker } from "../mapFunctions.js";
import { map } from "./map.js"
import { Popup } from 'maplibre-gl';

// Defines a custom HTML element (for search bar)
class SiteSearchbar extends HTMLElement {
    // This runs automatically when the element is added to the page
    connectedCallback() {
        // This is the actual HTML being injected into the component
        this.innerHTML = `
            <div class="container mt-3">
                <div class="input-group">
                    <input type="text" id="searchInput" class="form-control" placeholder="Search...">
                    <a href="/app/html/route.html"><button id="searchBtn" class="btn btn-primary" type="button">Search</button></a>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="filterBtn" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                            Filters
                        </button>
                        <div class="dropdown-menu p-3" id="filterMenu" style="min-width: 220px;">
                            <p class="text-muted small mb-2">Loading filters...</p>
                        </div>
                    </div>
                </div>
                <div id="suggestion-item" class="searchbar-suggestions"></div>
            </div>
        `;

        // References to the elements, querySelector instead of getElementById so it only searches inside this component
        const searchInput = this.querySelector('#searchInput');
        const suggestions = this.querySelector('#suggestion-item');
        const filterMenu = this.querySelector('#filterMenu');

        // Load autocomplete suggestions from Firestore - REPLACE WITH ACTUAL LOCATIONS LATER!
        let autocompleteSuggestions = [];
        // fetch docs from specific collection, .then() runs ONLY after the fetch 
        getDocs(collection(db, 'autocomplete')).then(snapshot => {
            // Loops through each document, read specific field, adds to the array
            snapshot.forEach(doc => {
                const { suggestion } = doc.data();
                if (suggestion) autocompleteSuggestions.push(suggestion);
            });
        });

        // We need to save a list of marker instances in case we want to remove them 
        const markerList = [];
        const popupList = [];

        // Autocomplete, fires everytime user types a character in search box (Carly's implementation)
        searchInput.addEventListener('input', async function () {
            const query = searchInput.value.toLowerCase();
            // clears any previously shown suggestion
            suggestions.innerHTML = '';
            if (query) {
                //Fetch Vancouver coordinates
                const vacouverCoordinates = await getLocationsByPlaceName("Vancouver, BC, Canada");
                //Fetch the locations using the input value
                const data = await getLocationsByPlaceNameAndCountry(query, ["ca"], 10, vacouverCoordinates[0].center, vacouverCoordinates[0].bbox)
                // Filters auto complete based on what the user typed
                // We now use the data that is pulled from the Map API
                // const filteredResults = autocompleteSuggestions.filter(item =>
                //     item.toLowerCase().includes(query)
                // );

                // For each match from the auto complete, creates suggestion item div.
                // Use set to save unique search result
                const set = new Set();
                // Filter to get only the documents that have matching text field
                data.filter(location => location.text.toLowerCase().includes(query)).forEach(result => {
                    // Skip the current iteration if the text field's value is duplicate
                    if (set.has(result.text)) {
                        return;
                    }

                    // Add new text field's value to the set
                    set.add(result.text)

                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = result.text;
                    // Closing suggestions logic, whenever a suggestion is clicked, it fills the input with the same value as div, then appends div to container
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = result.text;
                        suggestions.innerHTML = '';
                        // Remove old markers and popups before adding the new ones
                        markerList.forEach(marker => {
                            marker.remove();
                        })

                        popupList.forEach(popup => {
                            popup.remove();
                        })
                        // When user choose the address, it will set at all markers on the map that match with the search result
                        data.map(async location => {
                            // Add marker
                            const marker = await addMarker(location.center, map);
                            // Add popup element
                            const newPopup = document.createElement("div");
                            newPopup.classList.add("popup-container")

                            const popUpcContent = document.createElement("p");
                            popUpcContent.textContent = location.address;

                            const popUpSavedLocationButton = document.createElement("button");
                            popUpSavedLocationButton.classList.add("popup-button--save-location");
                            popUpSavedLocationButton.textContent = "Save location";
                            
                            newPopup.append(popUpcContent);
                            newPopup.append(popUpSavedLocationButton);

                            const popup = new maptilersdk.Popup({closeButton:true, closeOnClick:false}).setLngLat(location.center).setDOMContent(newPopup)

                            // Make marker information div element pop up when it is hovered
                            const markerElement = marker.getElement();

                            markerElement.addEventListener("click", () => {
                                popup.addTo(map);
                            })

                            //add marker to marker list
                            markerList.push(marker);
                            //ad popup to popup list
                            popupList.push(popup);
                        })
                    });

                    suggestions.appendChild(suggestionItem);
                });
            }
        });

        // Listens for any click outside of the search bar, if that happens, it closes the suggestions
        document.addEventListener('click', function (event) {
            if (event.target !== searchInput) {
                suggestions.innerHTML = '';
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
    }
}
customElements.define('site-searchbar', SiteSearchbar);