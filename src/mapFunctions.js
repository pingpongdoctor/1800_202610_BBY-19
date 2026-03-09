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
export async function addMarker(coordinates, map) {
    // Add popup
    const marker = new maptilersdk.Marker()
        .setLngLat(coordinates)
        .addTo(map);
        
    return marker
}
