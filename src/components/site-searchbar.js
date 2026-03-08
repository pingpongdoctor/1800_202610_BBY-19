import { db } from '../firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

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

        // Autocomplete, fires everytime user types a character in search box (Carly's implementation)
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            // clears any previously shown suggestion
            suggestions.innerHTML = '';
            if (query) {
                // Filters auto complete based on what the user typed
                const filteredResults = autocompleteSuggestions.filter(item =>
                    item.toLowerCase().includes(query)
                );
                
                // For each match from the auto complete, creates suggestion item div.
                filteredResults.forEach(result => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = result;
                    // Closing suggestions logic, whenever a suggestion is clicked, it fills the input with the same value as div, then appends div to container
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = result;
                        suggestions.innerHTML = '';
                    });

                    suggestions.appendChild(suggestionItem);
                });
            }
        });

        // Listens for any click outside of the search bar, if that happens, it closes the suggestions
        document.addEventListener('click', function(event) {
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