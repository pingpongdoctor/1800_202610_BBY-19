import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

// CSS variable names that map to theme fields in Firestore
// Firestore uses underscores (text_muted), CSS uses hyphens (--text-muted)
const THEME_VARS = [
    'primary', 'primary_compliment',
    'secondary', 'secondary_compliment',
    'white', 'black',
    'text_muted', 'text_secondary',
    'border', 'danger', 'danger_hover'
];

// Applies a theme by setting CSS variables on :root
// themeData is an object from Firestore with color values
export function applyTheme(themeData) {
    const root = document.documentElement;
    for (const key of THEME_VARS) {
        if (themeData[key]) {
            // Use the key as-is to match CSS variable names (which use underscores)
            const cssVar = `--${key}`;
            root.style.setProperty(cssVar, themeData[key]);
        }
    }

    // Re-color map markers to match the new theme
    if (typeof window.recolorMarkers === 'function') {
        window.recolorMarkers();
    }
}

// Fetches a theme from Firestore and applies it
// Falls back to defaultTheme if the requested theme doesn't exist
export async function switchTheme(themeId) {
    if (!themeId || themeId === 'default') {
        themeId = 'defaultTheme';
    }

    const themeDoc = await getDoc(doc(db, 'themes', themeId));

    if (themeDoc.exists()) {
        applyTheme(themeDoc.data());
    } else {
        // Fallback: try loading defaultTheme
        console.log(`Theme "${themeId}" not found, falling back to defaultTheme`);
        const fallback = await getDoc(doc(db, 'themes', 'defaultTheme'));
        if (fallback.exists()) {
            applyTheme(fallback.data());
        }
    }
}

// Loads the user's chosen theme on page load
function chosenTheme() {
    onAuthReady(async (user) => {
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userTheme = userDoc.exists() ? userDoc.data().theme : 'defaultTheme';

        await switchTheme(userTheme);

        // In the profile page, set the selected item in the dropdown to the set theme
        if (window.location.pathname.endsWith('profile.html')) {
            const select = document.getElementById("themeSelect");
            if (select) select.value = userTheme;
        }
    });
}

chosenTheme();
