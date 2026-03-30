// seedThemes.js
// Run with: node seedThemes.js (or npm run seed-themes)
// Reads themes.json and writes each theme to Firestore:
//   - "themes" collection: full theme data (colors + shop info)
//   - "items" collection: shop listing (title, description, cost)

const { readFileSync } = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read themes from JSON file
const themes = JSON.parse(readFileSync('./themes.json', 'utf-8'));

async function seed() {
    for (const [id, themeData] of Object.entries(themes)) {
        // Write full theme data to the themes collection
        await setDoc(doc(db, 'themes', id), themeData);
        console.log(`Seeded theme: ${id} (${themeData.title})`);

        // Write shop item to the items collection (skip default — it's free for everyone)
        if (id !== 'defaultTheme') {
            await setDoc(doc(db, 'items', id), {
                title: themeData.title,
                description: themeData.description || '',
                cost: themeData.cost ?? 0
            });
            console.log(`Seeded shop item: ${id}`);
        }
    }
    console.log('Done! All themes and shop items seeded.');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
