import '@maptiler/sdk/dist/maptiler-sdk.css';
import "@maptiler/geocoding-control/style.css";
import * as maptilersdk from '@maptiler/sdk';
import {getLocationsByPlaceName, addMarker} from "../mapFunctions";

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

// Get the coordinate of Vancouver
const result = await getLocationsByPlaceName("Vancouver, BC, Canada");

export const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element to render the map
  style: maptilersdk.MapStyle.STREETS,
  zoom: 14, // starting zoom
  geolocate: maptilersdk.GeolocationType.POINT,
  center: result[0]?.center || [],
});


// Add a default marker in Vancouver
addMarker(result[0]?.center || [], map)