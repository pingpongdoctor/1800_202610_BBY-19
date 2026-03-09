import { collection, getDocs, addDoc, serverTimestamp, query, where, setDoc, doc } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";

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

// Function to get a location
export async function getALocation(){
    try{
        const docSnap = await getDoc
    }
    catch {

    }
}
// Function to add a new locaton
export async function addNewLocation(id, name, description, type, lng, lat) {
    try {
        const locationsRef = collection(db, "locations");
        // Check if location exists
        // __name__ is the name of the id field of FireBase Database
        const q = query(locationsRef, where ("__name__","==",id));
        const querySnapshot = await getDocs(q);

        // if the location exists, send an alert
        if(!querySnapshot.empty){
            alert("Location is already saved")
            return;
        }

        const location = {
            name,
            description,
            type,
            lat,
            lng,
            last_updated: serverTimestamp()
        }

        // We generate id for the location document by using the id taken from the map api database document
        await setDoc(doc(db, "locations", id), location);
        alert("New location is added")
    }

    catch (e){
        console.log("Error adding new document" + e)
    }
}
