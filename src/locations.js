import { collection, getDocs, addDoc, serverTimestamp, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";
import { map } from "./components/map.js";    // the live Map instance
import { addMarker } from "./mapFunctions.js"; // marker + popup function
import { onAuthReady } from '/src/authentication.js';

//add sample locations
// function addSampleLocationData() {
//     const locationsRef = collection(db, "locations");
//     addDoc(locationsRef, {
//         name: "name1", description: "description1",
//         type: "type1", lat: 49.2467097082573, lng: -122.9187029619698,
//         last_updated: serverTimestamp()
//     });
//     addDoc(locationsRef, {
//         name: "name2", description: "description2",
//         type: "type2", lat: 49.2467097082573, lng: -122.9187029619698,
//         last_updated: serverTimestamp()
//     });
// }

const locations = await getDocs(collection(db, "locations"));
// if (locations.empty) {
//     addSampleLocationData();
// }

// Loop every Firestore location and drop a marker on the map with a popup
locations.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    // MapTiler expects [lng, lat] order (opposite of Firestore storage)
    addMarker(
        [data.lng, data.lat],
        map,
        {
            name: data.name, description: data.description, type: data.type, id,
            saveCallback: () => {
                addNewLocation(id, data.name, data.description, data.type, data.lng, data.lat);
            }
        }
    );
});

// If logged in, display saved locations with same logic as above
onAuthReady(async (user) => {
    
    // If no user, stop execution
    if (!user) {
        return;
    }

    const savedLocations = await getDocs(collection(db, "users", user.uid, "savedLocations"));
    
    // Loop every saved location and drop a marker on the map with a popup
    savedLocations.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        // MapTiler expects [lng, lat] order (opposite of Firestore storage)
        addMarker(
            [data.lng, data.lat],
            map,
            {
                name: data.name, description: data.description, type: data.type, id,
                saved: true,
                saveCallback: () => {
                    addNewLocation(id, data.name, data.description, data.type, data.lng, data.lat);
                }
            }
        );
    });

});



// Function to get a location
export async function getALocation() {
    try {
        const docSnap = await getDoc
    }
    catch {

    }
}
// Function to add a new locaton
export async function addNewLocation(id, name, description, type, lng, lat) {
    try {

        // Wait until Firebase Auth finishes checking the user's auth state
        onAuthReady(async (user) => {

            // If no user, send an alert and stop execution
            if (!user) {
                alert("Please log in to save locations!");
                return;
            }


            const locationsRef = collection(db, "users", user.uid, "savedLocations");
            // Check if location exists
            // __name__ is the name of the id field of FireBase Database
            const q = query(locationsRef, where("__name__", "==", id));
            const querySnapshot = await getDocs(q);

            // if the location exists, send an alert
            if (!querySnapshot.empty) {
                alert("Location is already saved");
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
            await setDoc(doc(db, "users", user.uid, "savedLocations", id), location);







        });









    }

    catch (e) {
        console.log("Error adding new document" + e)
    }
}

// Function to remove a saved location
export async function removeLocation(id) {
    onAuthReady(async (user) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "savedLocations", id));
    });
}
