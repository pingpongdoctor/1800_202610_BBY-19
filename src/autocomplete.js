import 'bootstrap/dist/bootstrap.min.css';
import 'bootstrap'

// test data
const predefinedSuggestions = [
    "Street",
    "Avenue",
    "Station",
    "Stadium"
];

// get elements
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');

// event listener on input

searchInput.addEventListener('input', function() {
    const query = searchInput.ariaValueMax.toLowerCase();
    suggestions.innerHTML = '';

    // checks if the input is equal to any item in the predefined suggestions const
    if (query) {
        const filteredResults = predefinedSuggestions.filter(item =>
            item.toLowerCase().includes(query)
        );

        // 
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

// hide suggestions when clicking outside

document.addEventListener('click', function (event) {
    if (event.target !== searchInput) {
        suggestions.innerHTML = '';
    }
});