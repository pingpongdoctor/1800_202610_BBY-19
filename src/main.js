import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

import '/css/default.css?url';

export function switchTheme(theme) {
    // Obtain the name of stylesheet 
    // as a parameter and set it 
    // using href attribute.
    const sheets = document.getElementsByTagName('link');
    sheets[0].href = `/css/${theme}.css`;
}

function chosenTheme() {
    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, stop execution
        if (!user) {
            return; // Stop execution
        }

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // grab what theme is set for the user
        const userTheme = userDoc.data().theme;

        console.log("Loaded user theme: " + userTheme);
        switchTheme(userTheme);

    });
}

chosenTheme();


// Function to fetch the signed-in user's name and display it in the UI
function showName() {

    // Get the DOM element where the user's name will be displayed
    // Example: <h1 id="name-goes-here"></h1>
    const nameElement = document.getElementById("name-goes-here");

    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, redirect to the login page
        if (!user) {
            if (window.location.pathname.endsWith('profile.html')) {
                location.href = 'index.html';
            }

            return; // Stop execution
        }

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // Determine which name to display:
        const name = userDoc.exists()            // 1️⃣ Use Firestore name if document exists
            ? userDoc.data().name                // 2️⃣ Otherwise fallback to Firebase displayName
            : user.displayName || user.email;    // 3️⃣ Otherwise fallback to email

        // If the DOM element exists, update its text using a template literal to add "!"
        if (nameElement) {
            nameElement.textContent = `${name}`;
        }
    });
}

showName();

