import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment, setDoc, onSnapshot, orderBy } from "firebase/firestore";
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
    const container = document.getElementById("themeSelect");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userItems = userDoc.data().items;
    const userChosenTheme = userDoc.data().theme;

    // Build the default theme card first
    const themes = [{ id: "defaultTheme", title: "Default" }];

    // Add unlocked themes from the items collection
    const queryItems = await getDocs(query(collection(db, "items")));
    queryItems.forEach((d) => {
        if (userItems.includes(d.id)) {
            themes.push({ id: d.id, title: d.data().title || d.id });
        }
    });

    // Render theme cards with flag images
    container.innerHTML = "";
    themes.forEach(({ id, title }) => {
        const card = document.createElement("div");
        card.className = "theme-card" + (id === userChosenTheme ? " active" : "");
        card.dataset.themeId = id;
        card.innerHTML = `
            <img src="/images/${id}.png" alt="${title}">
            <span>${title}</span>
        `;
        card.addEventListener("click", () => {
            // Update active state
            container.querySelectorAll(".theme-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            // Apply and persist the theme
            switchTheme(id);
            updateDoc(doc(db, "users", user.uid), { theme: id });
        });
        container.appendChild(card);
    });
}


async function showSavedLocations(user) {

    const savedLocationsElement = document.getElementById("savedLocationsElement");
    let savedLocationsList = document.getElementById("savedLocationsList");

    try {

        // User's saved locations subcollection
        const savedLocationsRef = collection(db, "users", user.uid, "savedLocations");
        // Query and sort by last updated in ascending order
        const q = query(savedLocationsRef, orderBy("last_updated", "asc"))
        const queryItems = await getDocs(q);

        // Iterate through each document
        queryItems.forEach((doc) => {
            const data = doc.data();

            const locationName = data.name || "Error: no name";
            const locationDesc = data.description || "Error: no description";
            const locationLat = data.lat || "Error: no lat";
            const locationLng = data.lng || "Error: no lng";

            let locationItem = `<a href="/index.html?coord=${locationLng}&coord=${locationLat}" class="list-group-item list-group-item-action"><b>${locationName}</b><p>${locationDesc}</p></a>`

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




