import * as maptilersdk from '@maptiler/sdk';
import { map } from './components/map.js';
import { addMarker } from './mapFunctions.js';
import * as maptilerClient from '@maptiler/client';

// ORS (OpenRouteService) API key loaded from the .env file via Vite
const ORS_KEY = import.meta.env.VITE_ORS_KEY;

// Maps our UI mode button names to the ORS API profile strings
// Transit is treated as driving for now (bus stop routing is out of scope)
const ORS_PROFILES = {
    walking: 'foot-walking',
    cycling: 'cycling-regular',
    transit: 'driving-car'
};

// Stores fetched route data per mode so we dont refetch when switching tabs
// Structure: { walking: { geometry, duration, distance }, cycling: {...}, transit: {...} }
const routeCache = {};

// Read the destination coordinates and name from the URL query params
// These get passed from the Directions button in the location panel (mapFunctions.js)
const params = new URLSearchParams(window.location.search);
const destLat = parseFloat(params.get('lat'));
const destLng = parseFloat(params.get('lng'));
const destName = params.get('name') || 'Destination';

// Display the destination name in the route panel so the user knows where they are going
const destNameEl = document.getElementById('dest-name');
if (destNameEl) {
    destNameEl.textContent = destName;
}

// Calls the ORS directions API for a specific travel profile (walking, cycling, driving)
// Uses the Authorization header instead of a query param to keep the key out of URLs
// Returns the full GeoJSON FeatureCollection from ORS
async function fetchRoute(profile, startLng, startLat, endLng, endLat) {
    // ORS GET endpoint requires the api_key as a query parameter
    const url = `https://api.openrouteservice.org/v2/directions/${profile}`
        + `?api_key=${ORS_KEY}`
        + `&start=${startLng},${startLat}`
        + `&end=${endLng},${endLat}`;

    const response = await fetch(url);

    if (!response.ok) {
        const body = await response.text();
        console.log('ORS error for ' + profile + ': ' + response.status + ' ' + body);
        throw new Error(`ORS returned status ${response.status}`);
    }

    return await response.json();
}

// Converts raw seconds into a readable duration string
// Examples: "Under 1 min", "12 min", "1 hr 25 min"
function formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 1) return 'Under 1 min';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (remainMins === 0) return `${hrs} hr`;
    return `${hrs} hr ${remainMins} min`;
}

// Converts raw meters into a readable distance string
// Shows meters under 1km, otherwise shows km with one decimal
function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// Draws or updates the route polyline on the map
// MapTiler is built on MapLibre which natively supports GeoJSON line layers
function drawRoute(geometry) {
    // Wrap the raw LineString geometry in a proper GeoJSON Feature
    const geojson = {
        type: 'Feature',
        geometry: geometry
    };

    // If the source already exists from a previous draw, just swap the data
    // Otherwise create the source and layer for the first time
    if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
    } else {
        map.addSource('route', {
            type: 'geojson',
            data: geojson
        });
        map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#68E152',
                'line-width': 5,
                'line-opacity': 0.8
            }
        });
    }
}

// Updates the duration and distance text in the route panel for the selected mode
// Also redraws the route line on the map to match the selected mode
function displayRouteInfo(mode) {
    const data = routeCache[mode];
    const durationEl = document.getElementById('route-duration');
    const distanceEl = document.getElementById('route-distance');

    if (data) {
        durationEl.textContent = formatDuration(data.duration);
        distanceEl.textContent = formatDistance(data.distance);
        drawRoute(data.geometry);
    } else {
        durationEl.textContent = 'N/A';
        distanceEl.textContent = 'Try again later';
    }
}

// Fetches routes from ORS for all three travel modes, then displays the default (walking)
// Takes the user's origin coordinates as input
async function initRoutes(originLng, originLat) {
    // Drop markers at the start (user) and end (destination) points
    addMarker([originLng, originLat], map);
    addMarker([destLng, destLat], map);

    // Zoom the map so both origin and destination are visible with some padding
    const bounds = new maptilersdk.LngLatBounds();
    bounds.extend([originLng, originLat]);
    bounds.extend([destLng, destLat]);
    map.fitBounds(bounds, { padding: 80 });

    // Fetch all three modes in parallel using Promise.allSettled
    // allSettled lets individual modes fail without blocking the others
    const entries = Object.entries(ORS_PROFILES);
    const results = await Promise.allSettled(
        entries.map(([mode, profile]) =>
            fetchRoute(profile, originLng, originLat, destLng, destLat)
        )
    );

    // Process each result and store it in the cache
    results.forEach((result, i) => {
        const mode = entries[i][0];
        if (result.status === 'fulfilled') {
            // Pull out the geometry, duration and distance from the ORS response
            const feature = result.value.features[0];
            routeCache[mode] = {
                geometry: feature.geometry,
                duration: feature.properties.summary.duration,
                distance: feature.properties.summary.distance
            };
        } else {
            console.log('Failed to fetch route for ' + mode + ': ' + result.reason);
        }
    });

    // Show the walking route by default (matches the initially active button)
    displayRouteInfo('walking');
}

// Mode button click handlers
// Switches the active highlight and displays the selected mode's route
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove the active class from all buttons
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        // Add active to the clicked button
        btn.classList.add('active');
        // Show that mode's cached route data and redraw the line
        displayRouteInfo(btn.dataset.mode);
    });
});

// Starts the route fetching process once the map is ready
function startRouting() {
    // Make sure we actually got destination coordinates from the URL
    if (isNaN(destLat) || isNaN(destLng)) {
        console.log('No destination coordinates found in URL params');
        return;
    }

    // Try to get the user's real position as the route origin
    navigator.geolocation.getCurrentPosition(
        // Success: use the browser's reported position
        (pos) => {
            initRoutes(pos.coords.longitude, pos.coords.latitude);
        },
        // Denied or unavailable: fall back to the map center (Vancouver) as origin
        () => {
            console.log('Geolocation unavailable, using map center as origin');
            const center = map.getCenter();
            initRoutes(center.lng, center.lat);
        }
    );
}

// Confirm route button: hides the route panel and shows the cancel button
document.getElementById('confirm-route-btn').addEventListener('click', () => {
    document.querySelector('.route-panel').style.display = 'none';
    document.getElementById('cancel-route-btn').style.display = 'block';
});

// Cancel route button: removes the route line from the map and brings the panel back
document.getElementById('cancel-route-btn').addEventListener('click', () => {
    // Remove the route line from the map if it exists
    if (map.getLayer('route-line')) {
        map.removeLayer('route-line');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }

    // Hide the cancel button and show the route panel again
    document.getElementById('cancel-route-btn').style.display = 'none';
    document.querySelector('.route-panel').style.display = '';
});

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
navigator.geolocation.watchPosition((pos) => {
    const now = Date.now();
    if (now - lastCalculation < 5000) {
        return;
    }
    lastCalculation = now;
    33
    if (lastPos && lastTime) {
        // Use haversineDistanceWgs84 method from maptilerCilent library to calculate distance between two set of coordinates
        const distance = maptilerClient.math.haversineDistanceWgs84(
            [lastPos.longitude, lastPos.latitude],
            [pos.longitude, pos.latitude]
        );
        const timeElapsed = (now - lastTime) / 1000; // convert to seconds
        const speed = distance / timeElapsed; // m/s

        const mode = detectTransportMode(speed);

        // If users are walking, we can start counting steps
        if(mode == "walking"){
            distanceToSteps(distance);
            console.log(distanceToSteps(distance))
        }
    }

    lastPos = pos.coords;
    lastTime = now;
});

// Check if the map already finished loading (can happen if map.js loaded before this script)
// If it has, start immediately. Otherwise wait for the load event.
if (map.loaded()) {
    startRouting();
} else {
    map.on('load', startRouting);
}
