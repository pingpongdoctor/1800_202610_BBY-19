console.log("Script loaded");
import { db } from "./firebaseConfig.js";
import { doc, onSnapshot } from "firebase/firestore";
import { collection, getDocs, query } from "firebase/firestore";

// Reads the provided challenge's title script
// function readChallengeTitle(challenge) {
//     const challengeDocRef = doc(db, "challenges", challenge); // Get a reference to the document

//     onSnapshot(challengeDocRef, docSnap => { // Listen for real-time updates
//         if (docSnap.exists()) {          //Document existence check
//             document.getElementById("challenge-title").innerHTML = docSnap.data().title;
//         } else {
//             console.log("No such document!");
//         }
//     }, (error) => {                      //Listener/system error
//         console.error("Error listening to document: ", error);
//     });
// }

// // Reads the provided challenge's goal value
// function readChallengeGoal(challenge) {
//     const challengeDocRef = doc(db, "challenges", challenge); // Get a reference to the document

//     onSnapshot(challengeDocRef, docSnap => { // Listen for real-time updates
//         if (docSnap.exists()) {          // Document existence check
//             let challengeGoal = docSnap.data().goal;
//             return challengeGoal;
//         } else {
//             console.log("No such document!");
//         }
//     }, (error) => {                      //Listener/system error
//         console.error("Error listening to document: ", error);
//     });
// }

// // Instantiates a challenge board item
// function createChallenge(title, value, max) {
//     let temp = document.querySelector("#challenge-item");
//     let cln = temp.content.cloneNode(true);

//     let chalTitle = cln.querySelector("#challenge-title");
//     let progressBar = cln.querySelector(".progress-bar");
//     let progressContainer = cln.querySelector(".progress");

//     chalTitle.textContent = title;
//     progressBar.textContent = `${value} / ${max}`;
//     progressBar.style.width = `${(value / max) * 100}%`;
//     progressContainer.setAttribute("aria-valuenow", value);
//     progressContainer.setAttribute("aria-valuemax", max);

//     return cln;
// }
// const list = document.getElementById("challengeList");
// list.appendChild(createChallenge(readChallengeTitle("cafes"), 2, readChallengeGoal("cafes")));
// list.appendChild(createChallenge(readChallengeTitle("restaurants"), 2, readChallengeGoal("restaurants")));
// list.appendChild(createChallenge(readChallengeTitle("walking"), 2, readChallengeGoal("walking")));



// Take Two: Electric Boogaloo -- NON FUNCTIONAL

const challengeItem = document.getElementById("challengeItem");
const itemList = document.getElementById("challengeList");

async function populateItems() {
    const q = query(collection(db, "challenges"));
    const queryItems = await getDocs(q);

    queryItems.forEach((doc) => {
        // Grab the values of each item's fields to be added to the template
        const data = doc.data();
        const chalTitle = data.title || "Error: no title";
        const chalGoal = data.goal || "Error: no goal";
        console.log(chalGoal);

        // Clone the template and update the content
        const itemCard = challengeItem.content.cloneNode(true);
        console.log(itemCard);
        itemCard.querySelector(".challenge-title").textContent = chalTitle;
        itemCard.querySelector(".progress").setAttribute("aria-valuemax", chalGoal); // this line doesn't function correctly
        console.log(typeof itemCard);
        itemList.appendChild(itemCard);
        console.log("iteration of loop")
    })
}
populateItems();



// Proposed fix -- NON FUNCTIONAL
// onAuthReady(async (user) => {
//     // If no user is logged in, redirect to the login page
//     if (!user) {
//         if (!window.location.pathname.endsWith('index.html')) {
//             location.href = 'index.html';
//         }

//         return; // Stop execution
//     }

//     const userDoc = await getDoc(doc(db, "users", user.uid));
//     const userRef = doc(db, "users", user.uid);

//     const itemTemplate = document.getElementById("challenge-item");

//     async function populateItems() {

//         // Shop items collection
//         const q = query(collection(db, "challenges"));
//         const queryItems = await getDocs(q);

//         // Iterate through each document in the "challenges" collection
//         queryItems.forEach((doc) => {

//             const data = doc.data();

//             // Grab the values of each item's fields to be added to the template
//             const itemTitle = data.title || "Error: no title";
//             const itemGoal = data.goal || "Error: no description";

//             // Clone the template and update the content
//             const itemCard = itemTemplate.content.cloneNode(true);
//             itemCard.querySelector(".challenge-title").textContent = itemTitle;
//             itemCard.querySelector(".itemGoal").textContent = itemGoal; // Doesn't work, must rewrite
//             itemCard.querySelector(".list-group-item").id = doc.id;
 
//             // Append the updated cloned item and add it to the list of items to be displayed
//             itemList.appendChild(itemCard);

//         })
//     }
// })
