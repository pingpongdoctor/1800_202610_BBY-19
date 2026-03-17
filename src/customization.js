import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';
import { switchTheme } from '/src/main.js';

import '/css/default.css?url';

function switchThemeButtons(theme) {

    document.getElementById(theme).addEventListener("click", event => {
        switchTheme(theme);

        // Wait until Firebase Auth finishes checking the user's auth state
        onAuthReady(async (user) => {

            // Get the user's Firestore document from the "users" collection
            // Document ID is the user's unique UID
            const userDoc = doc(db, "users", user.uid);

            // grab what theme is set for the user
            await updateDoc(userDoc, {
                theme: theme
            });
            console.log("Theme changed to: " + theme);
        });
    })
}

switchThemeButtons("default");
switchThemeButtons("test");


