import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment, setDoc } from "firebase/firestore";
import { logoutUser, onAuthReady } from '/src/authentication.js';
import { switchTheme } from '/src/main.js';



function profilePage() {

    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, redirect to the login page
        if (!user) {
            if (window.location.pathname.endsWith('profile.html')) {
                location.href = 'index.html';
            }
            return; // Stop execution
        }

        await switchThemeSelect(user)
        await showInfo(user);
        // await showSavedLocations(user);     to be reworked to show saved locations

        // logout button functionality
        const logout = document.getElementById('logoutGoesHere').querySelector('#logoutBtn');
        logout?.addEventListener('click', logoutUser);

    });
}


// Function to fetch the signed-in user's name and display it in the UI
async function showInfo(user) {

    // Get the DOM element where the user's name will be displayed
    // Example: <h1 id="name-goes-here"></h1>
    const nameElement = document.getElementById("name-goes-here");
    const pointsElement = document.getElementById("pointsGoHere");

    // Get the user's Firestore document from the "users" collection
    // Document ID is the user's unique UID
    const userDoc = await getDoc(doc(db, "users", user.uid));

    // Determine which name to display:
    const name = userDoc.exists()            // 1️⃣ Use Firestore name if document exists
        ? userDoc.data().name                // 2️⃣ Otherwise fallback to Firebase displayName
        : user.displayName || user.email;    // 3️⃣ Otherwise fallback to email

    const points = userDoc.data().points;

    // display the name and points
    if (nameElement) nameElement.textContent = `${name}`;
    if (pointsElement) pointsElement.textContent = points;
}


async function switchThemeSelect(user) {
    try {

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userRef = doc(db, "users", user.uid);
        // User's currently owned items
        const userItems = userDoc.data().items;
        console.log("User's purchased items:", userItems);

        const userChosenTheme = userDoc.data().theme;

        // Shop items collection
        const q = query(collection(db, "items"));
        const queryItems = await getDocs(q);

        // Iterate through each document in the "items" collection
        queryItems.forEach((doc) => {

            // Only display items that the user doesn't already own
            if (userItems.includes(doc.id)) {
                const data = doc.data();

                // Grab the values of each item's fields to be added to the template
                const itemTitle = data.title || "Error: no title";
                const itemID = doc.id || "Error: no id";

                let html = `<option value="${itemID}" id="${itemID}">${itemTitle}</option>`


                // Append the updated cloned item and add it to the list of items to be displayed
                document.getElementById("themeSelect").innerHTML += (html);


            }

        })
        document.getElementById("themeSelect").value = userChosenTheme;

    } catch (error) {
        console.error("Error loading theme select: ", error);
    }

    // Listener on the dropdown select
    document.getElementById("themeSelect").addEventListener("change", function (e) {
        let selectedTheme = e.target.value;

        switchTheme(selectedTheme);

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = doc(db, "users", user.uid);

        // Update the theme field for the user
        updateDoc(userDoc, { // await ???
            theme: selectedTheme
        });
        console.log("Theme changed to: " + selectedTheme);

    })

}


async function showSavedLocations(user) {

    const LocationsListElement = document.getElementById("savedLocationsList");
    const userDoc = await getDoc(doc(db, "users", user.uid));

    const items = userDoc.data().savedLocations;

    // If the DOM element exists, display
    if (LocationsListElement) {
        LocationsListElement.textContent = `${items}`;
    }
}

profilePage();




