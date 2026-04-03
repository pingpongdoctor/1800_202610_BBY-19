import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment, setDoc, onSnapshot } from "firebase/firestore";
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
        await showSavedLocations(user);

        // logout button functionality
        const logout = document.getElementById('logoutGoesHere').querySelector('#logoutBtn');
        logout?.addEventListener('click', logoutUser);

    });
}


// Function to fetch the signed-in user's name and display it in the UI
async function showInfo(user) {

    const nameElement = document.getElementById("name-goes-here");
    const pointsElement = document.getElementById("pointsGoHere");
    const distanceElement = document.getElementById("distanceTravelled");
    const stepsElement = document.getElementById("stepsTravelled");
    const itemsUnlockedElement = document.getElementById("itemsUnlocked");


    // Get the user's Firestore document from the "users" collection
    // Document ID is the user's unique UID
    const userDoc = await getDoc(doc(db, "users", user.uid));

    // Determine which name to display:
    const name = userDoc.exists()            // 1️⃣ Use Firestore name if document exists
        ? userDoc.data().name                // 2️⃣ Otherwise fallback to Firebase displayName
        : user.displayName || user.email;    // 3️⃣ Otherwise fallback to email

    // Setup a listener on the user's doc that automatically updates when the data is changed
    const userSnapshot = onSnapshot(doc(db, "users", user.uid), (doc) => {
        const points = doc.data().points;
        const distance = doc.data().distance;
        const steps = doc.data().steps;
        const itemsUnlocked = doc.data().items.length;

        // display the name and points
        if (nameElement) nameElement.textContent = `${name}`;
        if (pointsElement) pointsElement.textContent = `You have ${points} points!`;
        if (distanceElement) distanceElement.textContent = distance;
        if (stepsElement) stepsElement.textContent = steps;
        if (itemsUnlockedElement) itemsUnlockedElement.textContent = itemsUnlocked;
    });

}


async function switchThemeSelect(user) {
    try {

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userRef = doc(db, "users", user.uid);
        // User's currently owned items
        const userItems = userDoc.data().items;
        // console.log("User's purchased items:", userItems);

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

    const savedLocationsElement = document.getElementById("savedLocationsElement");
    let savedLocationsList = document.getElementById("savedLocationsList");

    try {

        // User's saved locations subcollection
        const queryItems = await getDocs(collection(db, "users", user.uid, "savedLocations"));

        // Iterate through each document
        queryItems.forEach((doc) => {
            const data = doc.data();

            const locationName = data.name || "Error: no name";
            const locationLat = data.lat || "Error: no lat";
            const locationLon = data.lon || "Error: no lon";

            let locationItem = `<a href="/index.html" class="list-group-item list-group-item-action"><b>${locationName}</b></a>`

            // If the DOM element exists, display
            if (savedLocationsElement) {
                savedLocationsList.innerHTML += locationItem;
            }

        })

        if (!queryItems.empty) { savedLocationsElement.style = "" }


    } catch (error) {
        console.error("Error loading saved locations: ", error);
    }



}

profilePage();




