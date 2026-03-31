console.log("Script loaded");
import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';
export { queryMap } from "./components/site-searchbar.js"



const challengeItem = document.getElementById("challengeItem");
const itemList = document.getElementById("challengeList");

async function populateItems() {

    onAuthReady(async (user) => {
        // If no user is logged in, redirect to the login page
        if (!user) {
            if (!window.location.pathname.endsWith('index.html')) {
                location.href = 'index.html';
            }

            return; // Stop execution
        }

        const userDoc = await getDoc(doc(db, "users", user.uid)); // current user's collection
        const userRef = doc(db, "users", user.uid);


        const q = query(collection(db, "challenges"));
        const challengeItems = await getDocs(q);

        challengeItems.forEach((doc) => {
            // Grab the values of each item's fields to be added to the template
            const data = doc.data();
            const id = doc.id;

            const chalTitle = data.title || "Error: no title";
            const chalGoal = data.goal || "Error: no goal";
            const chalValue = userDoc.data()[id] || 0; // must grab the value stored in the user db for the current challenge ----------------------------------
            const chalPercent = 100 * (chalValue / chalGoal);
            console.log(chalValue);

            // Clone the template and update the content
            const itemCard = challengeItem.content.cloneNode(true);
            console.log(itemCard);
            itemCard.querySelector(".challenge-title").textContent = chalTitle;
            itemCard.querySelector(".progress").setAttribute("aria-valuemax", chalGoal);
            itemCard.querySelector(".progress-bar").setAttribute("style", ("width: " + chalPercent + "%"))
            console.log(typeof itemCard);
            itemList.appendChild(itemCard);
            console.log("iteration of loop")
        })
    })
}

// Function that is used to recognize if users move close to a certain type of location
// Types must be either cafe or restaurant for now
async function moveCloseTo(type) {
    if (Object.keys(queryMap).indexOf(type) == -1) {
        console.log("Types are not supported")
    }
    const userLng = window._userPosition?.lng;
    const userLat = window._userPosition?.lat;

    if (!userLng || !userLat) {
        return;
    };

    // Convert 50m radius to degrees
    const offset = 0.00045;

    // Calculate the bounding box to search for a location type in 50m radius
    const bbox = [
        userLng - offset,
        userLat - offset,
        userLng + offset,
        userLat + offset
    ];

    // Get the queries data for the location type input
    const typeList = queryMap[type];

    let moveClose = false;

    for (const type of typeList) {
        const result = await geocoding.forward("cafe", {
            proximity: [userLng, userLat], // Set current user location to proximity to look for locations around the user
            bbox,
            types: ["poi"],
            limit: 10
        });

        const locations = result?.features || [];

        if (locations.length > 0) {
            console.log(`user just move close to a ${type}`)
            moveClose = true;
            break;
        }
    }

    return moveClose;
}

// Function to check types of challenges that the current user to start tracking user location as well as their progresses
async function trackUserChallengeProgresses() {
    
}

populateItems();



// Proposed fix -- NON FUNCTIONAL

