import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, updateDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';
import { geocoding, config } from "@maptiler/client";

config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

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
            if (chalValue < chalGoal) {
                // Clone the template and update the content
                const itemCard = challengeItem.content.cloneNode(true);
                console.log(itemCard);
                itemCard.querySelector(".challenge-title").textContent = chalTitle;
                itemCard.querySelector(".progress").setAttribute("aria-valuemax", chalGoal);
                itemCard.querySelector(".progress-bar").setAttribute("style", ("width: " + chalPercent + "%"))
                console.log(typeof itemCard);
                itemList.appendChild(itemCard);
                console.log("iteration of loop")
            }
        })
    })
}

const restaurantTypes = ["restaurant", "food", "dining", "eatery", "diner", "bistro", "grill", "kitchen"];
const cafeTypes = ["coffee", "cafe", "espresso", "coffeehouse", "coffee shop", "tea house", "bakery", "roastery"];

// Function that is used to recognize if users move close to a cafe or a restaurant
// Update the user database if the users move close these places
async function moveCloseToCafe(userRef, userCafeChallenges, cafeGoal) {
    const userLng = window._userPosition?.lng;
    const userLat = window._userPosition?.lat;

    if (!userLng || !userLat) {
        console.log("can not track user");
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

    let moveCloseCafe = false;


    for (const cafeType of cafeTypes) {
        const result = await geocoding.forward(cafeType, {
            proximity: [userLng, userLat], // Set current user location to proximity to look for locations around the user
            bbox,
            types: ["poi"],
            limit: 10
        });

        const locations = result?.features || [];

        if (locations.length > 0) {
            console.log(`user just move close to a ${cafeType}`)
            moveCloseCafe = true;
            break;
        }
    }

    if(!moveCloseCafe){
        console.log("user do not move to any close cafe")
    }


    if (moveCloseCafe && (userCafeChallenges < cafeGoal)) {
        // Increment user cafe challenge field if user moves close to a cafe and the goal has not been achieved
        await updateDoc(userRef, {
            challengeCafes: userCafeChallenges + 1
        });
        console.log("user userCafeChallenges is updated")
    }
}

async function moveCloseToRestaurant(userRef, userRestaurantChallenges, restaurantGoal) {
    const userLng = window._userPosition?.lng;
    const userLat = window._userPosition?.lat;

    if (!userLng || !userLat) {
        console.log("can not track user");
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

    let moveCloseRestaurant = false;

    for (const restaurantType of restaurantTypes) {
        const result = await geocoding.forward(restaurantType, {
            proximity: [userLng, userLat],
            bbox,
            types: ["poi"],
            limit: 10
        });

        const locations = result?.features || [];

        if (locations.length > 0) {
            console.log(`user just move close to a ${restaurantType}`)
            moveCloseRestaurant = true;
            break;
        }
    }

    if(!moveCloseRestaurant){
        console.log("user does not move close to any restaurant")
    }

    if (moveCloseRestaurant && (userRestaurantChallenges < restaurantGoal)) {
        // Increment user cafe challenge field if user moves close to a cafe and the goal has not been achieved
        await updateDoc(userRef, {
            challengeRestaurants: userRestaurantChallenges + 1
        });
        console.log("user challengeRestaurants is updated")
    }
}


let trackUserChallengesInterval;

async function trackUserMoveCloseToChallengePlaces(user) {
   
        // If no user is logged in, redirect to the login page
        if (!user) {
            if (!window.location.pathname.endsWith('index.html')) {
                location.href = 'index.html';
            }
            return; // Stop execution
        }

        // Get the challenges points that users have obtained
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef, user.uid);
        const userData = userDoc.data();

        const userCafeChallenges = userData.challengeCafes;
        const userRestaurantChallenges = userData.challengeRestaurants;

        // Get the goal of each challenges from the challenges collection
        const cafeChallengesDocSnap = await getDoc(doc(db, "challenges", "challengeCafes"));
        const cafeGoal = cafeChallengesDocSnap.data().goal;
        const restaurantsChallengesDocSnap = await getDoc(doc(db, "challenges", "challengeRestaurants"));
        const restaurantGoal = restaurantsChallengesDocSnap.data().goal;
        
        if (userCafeChallenges < cafeGoal) {
            moveCloseToCafe(userRef, userCafeChallenges, cafeGoal)
        }

        if (userRestaurantChallenges < restaurantGoal) {
            moveCloseToRestaurant(userRef, userRestaurantChallenges, restaurantGoal)
        }

        if((userCafeChallenges >= cafeGoal) && (userRestaurantChallenges >= restaurantGoal)){
            if(trackUserChallengesInterval){
                clearInterval(trackUserChallengesInterval);
                trackUserChallengesInterval = null;
            }
        }
}

 onAuthReady(async (user) => {
    trackUserChallengesInterval = setInterval(()=>{trackUserMoveCloseToChallengePlaces(user)}, 5000);
 })

populateItems();
