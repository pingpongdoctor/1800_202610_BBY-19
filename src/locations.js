import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";
import { ln } from 'firebase/firestore/pipelines';

//add sample locations
function addSampleLocationData() {
    const locationsRef = collection(db, "locations");
    addDoc(locationsRef, {
        name: "name1", description: "description1",
        type: "type1", lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
    addDoc(locationsRef, {
        name: "name2", description: "description2",
        type: "type2", lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
}



const locations = await getDocs(collection(db, "locations"))
if (locations.empty) {
    addSampleLocationData();
}

// add new locaton
function addNewLocation(name, description, type, lat, lng) {
    const locationsRef = collection(db, "locations");
    const location = {
        name,
        description,
        type,
        lat,
        lng,
        last_updated: serverTimestamp()
    }
    addDoc(locationsRef, location)
}
