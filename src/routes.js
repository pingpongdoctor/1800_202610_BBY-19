import { db } from './firebaseConfig.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// holds route documents
let routesData = [];

// takes in a mode of transportation
function updateTimes(mode) {
    // loops through all elements from 'route-time' class
    document.querySelectorAll('.route-time').forEach((cell, i) => {
        // 2 conditions, first checks if there is data for given index, if not -> N/A
        // Second condition checks if there is a field in the doc that matches the mode, if not -> N/A
        cell.textContent = routesData[i] ? routesData[i][mode] ?? 'N/A' : 'N/A';
    });
}

// Selects all 3 mode buttons (walking, cycling, transit) and loops through them
document.querySelectorAll('.mode-btn').forEach(btn => {
    // click listener added to each button
    btn.addEventListener('click', () => {
        // when a new button is selected, removes the 'active' (highlight effect)
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        // adds the 'active' effect to newly clicked button
        btn.classList.add('active');
        // calls the function that updates the ETA for the new method of transportation
        updateTimes(btn.dataset.mode);
    });
});

// fetches all documents from firestore collection, sorted by order field, ,then() only runs after fetch is done (async)
getDocs(query(collection(db, 'routes'), orderBy('order'))).then(snapshot => {
    // loops through the doc and pushes data into the routesData array
    snapshot.forEach(doc => {
        routesData.push(doc.data());
    });
    // displays the walking ETA as default view
    updateTimes('walking');
});
