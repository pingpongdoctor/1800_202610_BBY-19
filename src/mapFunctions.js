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

        // popupHTML is injected into MapTiler's popup
        const popupHTML = `
            <div class="map-popup">
                <p class="popup-type">${locationType ?? "Location"}</p>
                <h4 class="popup-name">${locationName}</h4>
                <p class="popup-description">${locationDesc}</p>
                <a href="${routeUrl}" class="popup-directions-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    Directions
                </a>
            </div>
        `;

        // Create the popup and attach it to the marker — clicking the pin opens it
        const popup = new maptilersdk.Popup({ offset: 30, closeButton: true, maxWidth: "240px" })
            .setHTML(popupHTML);

        marker.setPopup(popup);
    }

    return marker;
}

