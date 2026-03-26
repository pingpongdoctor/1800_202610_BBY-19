import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

// import '/css/defaultTheme.css?url';


export function switchTheme(theme) {
    // Obtain the name of stylesheet 
    // as a parameter and set it 
    // using href attribute.
    const sheets = document.getElementsByTagName('link');
    sheets[0].href = `/css/${theme}.css`;
}

function chosenTheme() {
    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, stop execution
        if (!user) {
            return; // Stop execution
        }

        // Get the user's Firestore document from the "users" collection
        // Document ID is the user's unique UID
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // grab what theme is set for the user
        const userTheme = userDoc.data().theme;

        console.log("Loaded user theme: " + userTheme);
        switchTheme(userTheme);

        // In the profile page, set the selected item in the dropdown to the set theme
        if (window.location.pathname.endsWith('profile.html')) {
            document.getElementById("themeSelect").value = userTheme;
        }


    });
}

chosenTheme();

