import * as maptilerClient from '@maptiler/client';
import { getAuth } from "firebase/auth";
import { updateDoc, getDoc, doc } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";

const STEP_LENGTH_METERS = 0.762;
const METERS_TO_KM = 1000;
const CALCULATION_INTERVAL_MS = 5000;

async function updateUserPointStepDistance(steps){
    const auth = getAuth();
    const user = auth.currentUser;

    if(user==null){
        console.log("Skipping step count update since user is not authenticated");
        return;
    }

    //get current points
    const docRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(docRef);
    const userData = userDoc.data();

    const currentPoint = userData.points;
    const currentStep = userData.steps;
    const currentDistance = userData.distance;

    const updatedStep = currentStep + steps;
    const updatedPoint = currentPoint + steps;
    const updatedDistance = currentDistance + (steps * STEP_LENGTH_METERS)/METERS_TO_KM;
    
    //update points using the current points and new steps
    await updateDoc(docRef, {points: updatedPoint, steps: updatedStep, distance: updatedDistance});
    console.log(`Step count is updated: +${steps} | Total steps: ${updatedStep} | Points: ${updatedPoint} | Distance: ${updatedDistance}km`);
}

// This function is used to guess what kinds of transportation the users are using based on their current speed
// The unit is m/s
function detectTransportMode(speedMetersPerSecond) {
    if (speedMetersPerSecond < 0.5) return 'stationary';
    if (speedMetersPerSecond < 2.5) return 'walking';
    if (speedMetersPerSecond < 7) return 'cycling';
    if (speedMetersPerSecond < 35) return 'driving';
    return 'transit'; // fast bus/train
}

// Convert distance into steps
// The average length of a step is about 0.762 meter
function distanceToSteps(meters) {
    return Math.round(meters / STEP_LENGTH_METERS);
}

// variables used for saving the preceding coordinates and the corresponding time of this preceding location
let lastPos = null;
let lastTime = null;

// We only calculate the speed of user every 5 seconds using the distance and the time to avoid over calculation
let lastCalculation = 0;

// Geolocation API watchPosition method is invoked whenever the user location changes
// We calculate the user speed by using the distance and time taken to travel from last position to the current position
// watchPosition method is a callback function
navigator.geolocation.watchPosition(async (pos) => {
    console.log("User position updated. Analyze transport mode to determine if the user is walking");
    const now = Date.now();
    if (now - lastCalculation < CALCULATION_INTERVAL_MS) {
        return;
    }
    lastCalculation = now;

    if (lastPos == null) {
        console.log("No previous position recorded. Skipping distance calculation until next update");
    }

    if (lastPos && lastTime) {
        // Use haversineDistanceWgs84 method from maptilerCilent library to calculate distance between two set of coordinates
        const distance = maptilerClient.math.haversineDistanceWgs84(
            [lastPos.longitude, lastPos.latitude],
            [pos.coords.longitude, pos.coords.latitude]
        );
        const timeElapsed = (now - lastTime) / 1000; // convert to seconds
        const speed = distance / timeElapsed; // m/s
        const mode = detectTransportMode(speed);
        
        console.log(`Transport mode detected: ${mode} at ${speed}m/s`);

        // If users are walking, we can start counting steps
        if (mode == "walking") {
            const stepNum = distanceToSteps(distance);
            await updateUserPointStepDistance(stepNum);
        }
    }

    // Set new values for last position and last time of the previous coordinates
    lastPos = pos.coords;
    lastTime = now;

    // Share the user's position globally so other modules (e.g. routes) can use it
    window._userPosition = { lng: pos.coords.longitude, lat: pos.coords.latitude };
}, (error) => {
    console.log("Geolocation API watchPosition method error" + error)
}, { enableHighAccuracy: false });