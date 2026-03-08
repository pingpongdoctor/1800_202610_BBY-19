import { geocoding } from "@maptiler/client";


export async function getLocationsByInputName(name) {
    const result = await geocoding.forward(name);
    return result;
}

