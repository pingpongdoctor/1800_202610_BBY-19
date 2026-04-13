import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';
import { geocoding, config } from "@maptiler/client";

config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

let trackUserChallengesInterval;


// Loads the user's chosen theme on page load (Firestore is the source of truth)
function userFunctions() {
    onAuthReady(async (user) => {
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userTheme = userDoc.exists() ? userDoc.data().theme : 'defaultTheme';

        await switchTheme(userTheme);

        // In the profile page, highlight the active theme card
        if (window.location.pathname.endsWith('profile.html')) {
            const container = document.getElementById("themeSelect");
            if (container) {
                container.querySelectorAll(".theme-card").forEach(c => {
                    c.classList.toggle("active", c.dataset.themeId === userTheme);
                });
            }
        }

        trackUserChallengesInterval = setInterval(() => { trackUserMoveCloseToChallengePlaces(user) }, 5000);


    });
}


// CSS variable names that map to theme fields in Firestore
// Firestore uses underscores (text_muted), CSS uses hyphens (--text-muted)
const THEME_VARS = [
    'primary', 'primary_compliment',
    'secondary', 'secondary_compliment',
    'white', 'black',
    'text_muted', 'text_secondary',
    'border', 'danger', 'danger_hover'
];

// Applies a theme by setting CSS variables on :root
// themeData is an object from Firestore with color values
export function applyTheme(themeData) {
    const root = document.documentElement;
    for (const key of THEME_VARS) {
        if (themeData[key]) {
            // Use the key as-is to match CSS variable names (which use underscores)
            const cssVar = `--${key}`;
            root.style.setProperty(cssVar, themeData[key]);
        }
    }

    // Cache theme data in localStorage so next page load can apply it instantly
    try {
        const toCache = {};
        for (const key of THEME_VARS) {
            if (themeData[key]) toCache[key] = themeData[key];
        }
        localStorage.setItem('cachedTheme', JSON.stringify(toCache));
    } catch (_) { /* localStorage may be unavailable */ }

    // Re-color map markers to match the new theme
    if (typeof window.recolorMarkers === 'function') {
        window.recolorMarkers();
    }
}

// Fetches a theme from Firestore and applies it
// Falls back to defaultTheme if the requested theme doesn't exist
export async function switchTheme(themeId) {
    if (!themeId || themeId === 'default') {
        themeId = 'defaultTheme';
    }

    const themeDoc = await getDoc(doc(db, 'themes', themeId));

    if (themeDoc.exists()) {
        applyTheme(themeDoc.data());
    } else {
        // Fallback: try loading defaultTheme
        const fallback = await getDoc(doc(db, 'themes', 'defaultTheme'));
        if (fallback.exists()) {
            applyTheme(fallback.data());
        }
    }
}

// Apply cached theme instantly to prevent flash of default colors on page load
try {
    const cached = localStorage.getItem('cachedTheme');
    if (cached) {
        const themeData = JSON.parse(cached);
        const root = document.documentElement;
        for (const key of THEME_VARS) {
            if (themeData[key]) root.style.setProperty(`--${key}`, themeData[key]);
        }
    }
} catch (_) { /* ignore parse errors or missing storage */ }

const restaurantTypes = ["restaurant", "food", "dining", "eatery", "diner", "bistro", "grill", "kitchen"];
const cafeTypes = ["coffee", "cafe", "espresso", "coffeehouse", "coffee shop", "tea house", "bakery", "roastery"];

// Function that is used to recognize if users move close to a cafe or a restaurant
// Update the user database if the users move close these places
async function moveCloseToCafe(userRef, userCafeChallenges, cafeGoal) {
    const userLng = window._userPosition?.lng;
    const userLat = window._userPosition?.lat;

    if (!userLng || !userLat) {
        console.log("User position unavailable. Skipping cafe proximity check");
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
            console.log(`Cafe detected nearby (matched type: ${cafeType}). Counting as cafe visit`)
            moveCloseCafe = true;
            break;
        }
    }

    if (!moveCloseCafe) {
        console.log("No cafe found within 50m. Cafe challenge progress is unchanged")

    }


    if (moveCloseCafe && (userCafeChallenges < cafeGoal)) {
        // Increment user cafe challenge field if user moves close to a cafe and the goal has not been achieved
        await updateDoc(userRef, {
            challengeCafes: userCafeChallenges + 1
        });
        console.log(`Cafe challenge progress updated: ${userCafeChallenges + 1}/${cafeGoal}${userCafeChallenges + 1 >= cafeGoal ? " .Challenge complete! 🎉" : ""}`)

    }
}

async function moveCloseToRestaurant(userRef, userRestaurantChallenges, restaurantGoal) {
    const userLng = window._userPosition?.lng;
    const userLat = window._userPosition?.lat;

    if (!userLng || !userLat) {
        console.log("User position unavailable. Skipping restaurant proximity check.");
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
            console.log(`Restaurant detected nearby (matched type: ${restaurantType}). Counting as restaurant visit`)
            moveCloseRestaurant = true;
            break;
        }
    }

    if (!moveCloseRestaurant) {
        console.log("No restaurant found within 50m. Restaurant challenge progress is unchanged")
    }

    if (moveCloseRestaurant && (userRestaurantChallenges < restaurantGoal)) {
        // Increment user cafe challenge field if user moves close to a cafe and the goal has not been achieved
        await updateDoc(userRef, {
            challengeRestaurants: userRestaurantChallenges + 1
        });
        console.log(`Restaurant challenge progress updated: ${userRestaurantChallenges + 1}/${restaurantGoal}${userRestaurantChallenges + 1 >= restaurantGoal ? ". Challenge complete! 🎉" : ""}`)
    }
}

async function trackUserMoveCloseToChallengePlaces(user) {

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

    if ((userCafeChallenges >= cafeGoal) && (userRestaurantChallenges >= restaurantGoal)) {
        if (trackUserChallengesInterval) {
            clearInterval(trackUserChallengesInterval);
            trackUserChallengesInterval = null;
        }
    }
}

userFunctions();
