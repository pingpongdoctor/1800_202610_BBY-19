import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";

//add locations
function addSampleLocationData() {
    console.log("running")
    const hikesRef = collection(db, "locations");
    addDoc(hikesRef, {
        name: "name1", description: "description1",
        type: "type1", lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
    addDoc(hikesRef, {
        name: "name2", description: "description2",
        type: "type2", lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
}



const locations = await getDocs(collection(db, "locations"))
if (locations.empty) {
    addSampleLocationData();
}
