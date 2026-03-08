import { geocoding } from "@maptiler/client";


export async function getLocationsByPlaceName(name) {
    const result = await geocoding.forward(name);
    return result;
}

export async function getLocationsByPlaceNameAndCountry(name, country, limit) {
    const result = await geocoding.forward(name, {
        country:country,
        limit:limit,
    });
    return result;
}

