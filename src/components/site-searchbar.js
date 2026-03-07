// class SiteSearchbar extends HTMLElement {
//     connectedCallback() {
//         this.innerHTML = `
//             <form class="form-inline my-2 my-lg-0">
//                 <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
//                 <a class="btn btn-outline-success my-2 my-sm-0" type="submit" href="/app/html/route.html">Search</a>
//                 <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Filter</button>
//             </form>
//         `;
//     }
    
// }

const predefinedSuggestions = [
    "Street",
    "Avenue",
    "Station",
    "Stadium"
];

class SiteSearchbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="container mt-5">
                <input type="text" id="searchInput" class="form-control" placeholder="Search...">
                <div id="suggestion-item" class="searchbar-suggestions"></div>
            </div>
        `;

        const searchInput = this.querySelector('#searchInput');
        const suggestions = this.querySelector('#suggestion-item');

        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            suggestions.innerHTML = '';

            if (query) {
                const filteredResults = predefinedSuggestions.filter(item =>
                    item.toLowerCase().includes(query)
                );

                filteredResults.forEach(result => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = result;
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = result;
                        suggestions.innerHTML = '';
                    });

                    suggestions.appendChild(suggestionItem);
                });
            }
        });

        document.addEventListener('click', function(event) {
            if (event.target !== searchInput) {
                suggestions.innerHTML = '';
            }
        });
    }
}
customElements.define('site-searchbar', SiteSearchbar);