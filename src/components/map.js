import '@maptiler/sdk/dist/maptiler-sdk.css';
import "@maptiler/geocoding-control/style.css";
import * as maptilersdk from '@maptiler/sdk';
import { getLocationsByPlaceName, addMarker } from "../mapFunctions";

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

// Get the coordinate of Vancouver
const result = await getLocationsByPlaceName("Vancouver, BC, Canada");

// Get the search params from the url
const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);
const paramLocation = searchParams.getAll("coord");

export const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element to render the map
  style: maptilersdk.MapStyle.STREETS,
  zoom: 14, // starting zoom
  geolocate: maptilersdk.GeolocationType.WATCH,
  // if there are two 'coord' params, center map on those coordinates. otherwise, center on vancouver
  center: (paramLocation != "" && paramLocation.length == 2) ? paramLocation : result[0]?.center || [], 
});

const geolocate = new maptilersdk.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
});

map.addControl(geolocate, 'top-right');

export function centerTheMapToUserLocation() {
  if(map){
    geolocate.trigger();
  }
}
