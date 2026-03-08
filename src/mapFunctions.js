import { geocoding } from "@maptiler/client";
import * as maptilersdk from '@maptiler/sdk';

export async function getLocationsByPlaceName(name) {
    const result = await geocoding.forward(name);
    return result?.features || [];
}

export async function getLocationsByPlaceNameAndCountry(name, country, limit, proximity, bbox) {
    console.log(name,country, limit, proximity);
    const result = await geocoding.forward(name, {
        country,
        limit,
        proximity,
        bbox,
        types: ["poi"]
    });
    return result?.features || [];
}

export async function addMarker(coordinates, map){
    const marker = new maptilersdk.Marker()
      .setLngLat(coordinates)
      .addTo(map);
      return marker
}
