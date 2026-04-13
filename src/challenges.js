import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, updateDoc, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

function challengesPage() {

    // Wait until Firebase Auth finishes checking the user's auth state
    onAuthReady(async (user) => {

        // If no user is logged in, redirect to the login page
        if (!user) {
            if (window.location.pathname.endsWith('profile.html')) {
                location.href = '/app/html/login.html';
            }
            return; // Stop execution
        }

        populateItems(user);


    });
}

async function populateItems(user) {

    const challengeItem = document.getElementById("challengeItem");
    const itemList = document.getElementById("challengeList");

    // Listen to the user doc for changes
    const userSnapshot = onSnapshot(doc(db, "users", user.uid), (userDoc) => {

        // Query through the challenges collection and listen for changes to any doc
        const q = query(collection(db, "challenges"));
        const challengesSnapshot = onSnapshot(q, (QuerySnapshot) => {

            // Clear the HTML to re-add the data on any change
            itemList.innerHTML = "";
            QuerySnapshot.forEach((challengesDoc) => {

                // Grab the values of each item's fields to be added to the template
                const data = challengesDoc.data();
                let id = challengesDoc.id;

                if (id == "challengeWalking") {
                    id = "steps";
                }

                const chalTitle = data.title || "Error: no title";
                const chalGoal = data.goal || "Error: no goal";
                const chalValue = userDoc.data()[id] || 0; // must grab the value stored in the user db for the current challenge
                const chalPercent = 100 * (chalValue / chalGoal);
                const progressString = (chalPercent < 20) ? "" : (chalValue + "/" + chalGoal);

                // Clone the template and update the content
                const itemCard = challengeItem.content.cloneNode(true);
                itemCard.querySelector(".challenge-title").textContent = chalTitle;
                itemCard.querySelector(".progress").setAttribute("aria-valuemax", chalGoal);
                itemCard.querySelector(".progress-bar").setAttribute("style", ("width: " + chalPercent + "%"));
                itemCard.querySelector(".progress-bar").innerHTML = "<h6><small>" + progressString + "<small></h6>";
                itemList.appendChild(itemCard);

                // if (chalValue >= chalGoal) {}
                
            })
        })
    })

}



challengesPage()