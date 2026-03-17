import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { logoutUser, onAuthReady } from '/src/authentication.js';

import '/css/default.css?url';

// Function to fetch the signed-in user's name and display it in the UI
function showItems() {

    // Get the DOM element where the items will be displayed
    const itemShowcase1 = document.getElementById("item-showcase-1");

    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // grab the values from "items" field 
        const items = userDoc.data().items;

        // ***will add a delimiter and shit later to break up the array into separate pieces to display***

        // If the DOM element exists, display the items
        if (itemShowcase1) {
            itemShowcase1.textContent = `${items}`;
        }
    });
}

showItems();

// logout button functionality
const logout = document.getElementById('logoutGoesHere').querySelector('#logoutBtn');
logout?.addEventListener('click', logoutUser);



