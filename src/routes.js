import * as maptilersdk from '@maptiler/sdk';
import { map } from './components/map.js';
import { addMarker } from './mapFunctions.js';

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
let routeCache = {};

// Current destination info (set when the panel is opened)
let destLat = null;
let destLng = null;

// Calls the ORS directions API for a specific travel profile (walking, cycling, driving)
async function fetchRoute(profile, startLng, startLat, endLng, endLat) {
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
function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// Draws or updates the route polyline on the map
function drawRoute(geometry) {
    const geojson = {
        type: 'Feature',
        geometry: geometry
    };

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
async function initRoutes(originLng, originLat) {
    // Drop markers at the start (user) and end (destination) points
    addMarker([originLng, originLat], map);
    addMarker([destLng, destLat], map);

    // Zoom the map so both origin and destination are visible with some padding
    const bounds = new maptilersdk.LngLatBounds();
    bounds.extend([originLng, originLat]);
    bounds.extend([destLng, destLat]);
    map.fitBounds(bounds, { padding: 80 });

    // Fetch all three modes in parallel
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

    // Show the walking route by default
    displayRouteInfo('walking');
}

// Removes the route line from the map and resets state
function clearRoute() {
    if (map.getLayer('route-line')) {
        map.removeLayer('route-line');
    }
    if (map.getSource('route')) {
        map.removeSource('route');
    }
    routeCache = {};
}

// Closes the route panel and cleans up
function closeRoutePanel() {
    document.querySelector('.route-panel').classList.remove('open');
    document.getElementById('cancel-route-btn').style.display = 'none';
    clearRoute();
}

// Wire up event listeners once the component is in the DOM
function setupRouteListeners() {
    // Mode button click handlers
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayRouteInfo(btn.dataset.mode);
        });
    });

    // Cancel button in the route panel — close panel and clean up
    document.getElementById('route-panel-cancel').addEventListener('click', () => {
        closeRoutePanel();
    });

    // Confirm route button: hides the route panel and shows the floating cancel button
    document.getElementById('confirm-route-btn').addEventListener('click', () => {
        document.querySelector('.route-panel').classList.remove('open');
        document.getElementById('cancel-route-btn').style.display = 'block';
    });

    // Floating cancel route button: removes route and brings panel back
    document.getElementById('cancel-route-btn').addEventListener('click', () => {
        closeRoutePanel();
    });
}

// Opens the route panel and starts fetching directions
// Called from mapFunctions.js when user clicks "Directions"
window.openRoutePanel = function (name, lat, lng) {
    // Store destination
    destLat = lat;
    destLng = lng;

    // Reset state
    routeCache = {};
    document.getElementById('route-duration').textContent = 'Loading...';
    document.getElementById('route-distance').textContent = 'Loading...';

    // Reset mode buttons to walking
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.mode-btn[data-mode="walking"]').classList.add('active');

    // Display destination name
    document.getElementById('dest-name').textContent = name;

    // Close the location panel if it's open
    const locationPanel = document.getElementById('location-panel');
    if (locationPanel) {
        locationPanel.classList.remove('open');
    }

    // Show the route panel
    document.querySelector('.route-panel').classList.add('open');

    // Start routing
    const startRouting = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                initRoutes(pos.coords.longitude, pos.coords.latitude);
            },
            () => {
                console.log('Geolocation unavailable, using map center as origin');
                const center = map.getCenter();
                initRoutes(center.lng, center.lat);
            }
        );
    };

    if (map.loaded()) {
        startRouting();
    } else {
        map.on('load', startRouting);
    }
};

// Set up listeners once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRouteListeners);
} else {
    // Small delay to let the web component render its HTML
    setTimeout(setupRouteListeners, 0);
}
