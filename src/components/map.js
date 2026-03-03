import { Map, MapStyle, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

config.apiKey = import.meta.env.VITE_MAPTILER_KEY;
const map = new Map({
  container: 'map', // container's id or the HTML element in which the SDK will render the map
  style: "aquarelle-v4",
  center: [0, 0], // starting position [lng, lat]
  zoom: 1// starting zoom
});