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

// Function that allows to set a new marker
export async function addMarker(coordinates, map, locationData = null) {
    // Color the pin with the app's primary green
    const marker = new maptilersdk.Marker({ color: "#68E152" })
        .setLngLat(coordinates)
        .addTo(map);

    if (locationData) {
        const { name: locationName, description: locationDesc, type: locationType } = locationData;

        // Passes the destination name + coords as query params to the routes page
        const routeUrl =
            `/app/html/route.html?name=${encodeURIComponent(locationName)}&lat=${coordinates[1]}&lng=${coordinates[0]}`;

        // Store location data in a global registry keyed by a unique ID.
        // This avoids passing raw strings through onclick attributes (escaping issues).
        const registryKey = `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        window._locationRegistry = window._locationRegistry || {};
        window._locationRegistry[registryKey] = { locationName, locationDesc, locationType, routeUrl };

        // Small popup — just the name + a Details button that opens the side panel
        const popupHTML = `
            <div class="map-popup">
                <p class="popup-type">${locationType ?? "Location"}</p>
                <h4 class="popup-name">${locationName}</h4>
                <button class="popup-details-btn" onclick="openLocationPanel('${registryKey}')">
                    Details
                </button>
            </div>
        `;

        // Create the popup and attach it to the marker — clicking the pin opens it
        const popup = new maptilersdk.Popup({ offset: 30, closeButton: true, maxWidth: "200px" })
            .setHTML(popupHTML);

        marker.setPopup(popup);
    }

// Opens the side panel and populates it with the location's data
window.openLocationPanel = function (key) {
    const { locationName, locationDesc, locationType, routeUrl } = window._locationRegistry[key];

    // Populate panel fields
    document.getElementById("panel-type").textContent        = locationType ?? "Location";
    document.getElementById("panel-name").textContent        = locationName;
    document.getElementById("panel-description").textContent = locationDesc;
    document.getElementById("panel-directions-btn").href     = routeUrl;

    // Slide the panel in
    document.getElementById("location-panel").classList.add("open");
};

// Closes the side panel by sliding it back out
window.closeLocationPanel = function () {
    document.getElementById("location-panel").classList.remove("open");
};

    return marker;
}

