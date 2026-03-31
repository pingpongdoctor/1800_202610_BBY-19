console.log("Script loaded");
import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';



const challengeItem = document.getElementById("challengeItem");
const itemList = document.getElementById("challengeList");

async function populateItems() {

    onAuthReady(async (user) => {
    // If no user is logged in, redirect to the login page
    if (!user) {
        if (!window.location.pathname.endsWith('index.html')) {
            location.href = 'index.html';
        }

        return; // Stop execution
    }

    const userDoc = await getDoc(doc(db, "users", user.uid)); // current user's collection
    const userRef = doc(db, "users", user.uid);


    const q = query(collection(db, "challenges"));
    const challengeItems = await getDocs(q);

    challengeItems.forEach((doc) => {
        // Grab the values of each item's fields to be added to the template
        const data = doc.data();
        const id = doc.id;
        
        const chalTitle = data.title || "Error: no title";
        const chalGoal = data.goal || "Error: no goal";
        const chalValue = userDoc.data()[id] || 0; // must grab the value stored in the user db for the current challenge ----------------------------------
        const chalPercent = 100 * (chalValue / chalGoal);
        console.log(chalValue);

        // Clone the template and update the content
        const itemCard = challengeItem.content.cloneNode(true);
        console.log(itemCard);
        itemCard.querySelector(".challenge-title").textContent = chalTitle;
        itemCard.querySelector(".progress").setAttribute("aria-valuemax", chalGoal);
        itemCard.querySelector(".progress-bar").setAttribute("style", ("width: " + chalPercent + "%"))
        console.log(typeof itemCard);
        itemList.appendChild(itemCard);
        console.log("iteration of loop")
    })



})





}
populateItems();



// Proposed fix -- NON FUNCTIONAL

