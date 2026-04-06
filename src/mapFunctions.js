import { geocoding } from "@maptiler/client";
import * as maptilersdk from '@maptiler/sdk';

// Function that is used to get Location information object using the place name
export async function getLocationsByPlaceName(name) {
    const result = await geocoding.forward(name);
    return result?.features || [];
}

// Function that is used to get Location information object using the place name and the country
// Proximity and bbox values allow setting the boundary of the search result
export async function getLocationsByPlaceNameAndCountry(name, country, limit, proximity, bbox) {
    const result = await geocoding.forward(name, {
        country,
        limit,
        proximity,
        bbox,
        types: ["poi"]
    });
    return result?.features || [];
}

export async function getLocationsInVacouverByType(type) {
    // Params are West, East, South, North
    const vancouverBoundary = [-123.224, 49.100, -122.900, 49.315];

    const result = await geocoding.forward(type, { types: ["poi"], bbox: vancouverBoundary, limit: 10 });
    return result?.features || [];
}

// Global registry of all markers so they can be re-colored when the theme changes
window._allMarkers = window._allMarkers || [];

// Tracks the currently active popup so close events from stale popups are ignored
window._activePopupKey = null;

// Re-colors all existing markers to match the current theme
export function recolorMarkers() {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#68E152';
    for (const marker of window._allMarkers) {
        const svg = marker.getElement().querySelector('svg');
        if (svg) {
            // The pin shape is the second <g> with a [fill] attribute (index 1)
            // Structure: [0] shadow ellipses, [1] pin body, [2] pin outline, [3] inner white, [4-5] center dot
            const groups = svg.querySelectorAll('[fill]');
            if (groups.length > 1) {
                groups[1].setAttribute('fill', color);
            }
        }
    }
}
// Expose on window so main.js can call it without circular imports
window.recolorMarkers = recolorMarkers;

// Function that allows to set a new marker
export async function addMarker(coordinates, map, locationData = null) {
    // Color the pin with the app's primary color from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#68E152';
    const marker = new maptilersdk.Marker({ color: primaryColor })
        .setLngLat(coordinates)
        .addTo(map);

    // Track the marker so it can be re-colored on theme change
    window._allMarkers.push(marker);

    if (locationData) {
        const { name: locationName, description: locationDesc, type: locationType } = locationData;

        // Store location data in a global registry keyed by a unique ID.
        // This avoids passing raw strings through onclick attributes (escaping issues).
        const registryKey = `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        window._locationRegistry = window._locationRegistry || {};
        // saveCallback is an optional function passed by the searchbar for unsaved locations
        // When present, the Save button in the detail panel becomes active

        // Small popup — just the name (panel opens automatically alongside it)
        const popupHTML = `
            <div class="map-popup">
                <p class="popup-type">${locationType ?? "Location"}</p>
                <h4 class="popup-name">${locationName}</h4>
            </div>
        `;

        // Create the popup and attach it to the marker — clicking the pin opens it
        const popup = new maptilersdk.Popup({ offset: 30, closeButton: true, maxWidth: "200px" })
            .setHTML(popupHTML);

        marker.setPopup(popup);

        // Open the location panel automatically when the popup opens
        popup.on('open', () => {
            window._activePopupKey = registryKey;
            window.openLocationPanel(registryKey);
        });

        // Close the location panel only if this popup is still the active one
        // (prevents a stale close from overriding a newly opened panel)
        popup.on('close', () => {
            if (window._activePopupKey === registryKey) {
                window._activePopupKey = null;
                window.closeLocationPanel();
            }
        });

        // Move this part to the end of the function to save marker and popup HTML element
        window._locationRegistry[registryKey] = {
            locationName, locationDesc, locationType,
            lat: coordinates[1], lng: coordinates[0],
            saveCallback: locationData.saveCallback ?? null,
            popupHTML,
            marker
        };
    }

    // Opens the side panel and populates it with the location's data
    window.openLocationPanel = function (key) {
        // Close the route panel if it's open
        if (window.closeRoutePanel) window.closeRoutePanel();

        const { locationName, locationDesc, locationType, lat, lng, saveCallback } = window._locationRegistry[key];

        // Populate panel fields
        document.getElementById("panel-type").textContent = locationType ?? "Location";
        document.getElementById("panel-name").textContent = locationName;
        document.getElementById("panel-description").textContent = locationDesc;

        // Wire up the Directions button to open the route panel instead of navigating
        const directionsBtn = document.getElementById("panel-directions-btn");
        directionsBtn.href = "#";
        directionsBtn.onclick = (e) => {
            e.preventDefault();
            window.openRoutePanel(locationName, lat, lng);
        };

        // If a saveCallback exists (search result not yet saved), enable the Save button
        // Otherwise disable it (location already exists in Firestore)
        const saveBtn = document.querySelector('.panel-save-btn');
        if (saveCallback) {
            saveBtn.disabled = false;
            saveBtn.onclick = () => {
                saveCallback();
                // Disable after saving so the user cant double save
                saveBtn.disabled = true;
            };
        } else {
            saveBtn.disabled = true;
            saveBtn.onclick = null;
        }

        // Slide the panel in
        document.getElementById("location-panel").classList.add("open");
    };

    // Closes the side panel by sliding it back out
    window.closeLocationPanel = function () {
        document.getElementById("location-panel").classList.remove("open");
    };

    return marker;
}

