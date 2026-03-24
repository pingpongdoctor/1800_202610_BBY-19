import * as maptilerClient from '@maptiler/client';

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
    return Math.round(meters / 0.762);
}

// variables used for saving the preceding coordinates and the corresponding time of this preceding location
let lastPos = null;
let lastTime = null;

// We only calculate the speed of user every 5 seconds using the distance and the time to avoid over calculation
let lastCalculation = 0;

// Geolocation API watchPosition method is invoked whenever the user location changes
// We calculate the user speed by using the distance and time taken to travel from last position to the current position
// watchPosition method is a callback function
navigator.geolocation.watchPosition((pos) => {
    console.log("user are moving")

    const now = Date.now();
    if (now - lastCalculation < 5000) {
        console.log("not enough time")
        return;
    }
    lastCalculation = now;
    
    if(lastPos == null){
        console.log("user has not had previous coordinates to calculate the distance")
    }

    if (lastPos && lastTime) {
        // Use haversineDistanceWgs84 method from maptilerCilent library to calculate distance between two set of coordinates
        const distance = maptilerClient.math.haversineDistanceWgs84(
            [lastPos.longitude, lastPos.latitude],
            [pos.coords.longitude, pos.coords.latitude]
        );
        console.log("distance")
        const timeElapsed = (now - lastTime) / 1000; // convert to seconds
        const speed = distance / timeElapsed; // m/s

        const mode = detectTransportMode(speed);

        // If users are walking, we can start counting steps
        if(mode == "walking"){
            distanceToSteps(distance);
            console.log(distanceToSteps(distance))
        }
    }

    // Set new values for last position and last time of the previous coordinates
    lastPos = pos.coords;
    lastTime = now;
}, (error)=>{
    console.log("Geolocation API watchPostion method error" + error)
}, {enableHighAccuracy: true});