import { db } from "./firebaseConfig.js";
import { doc, onSnapshot } from "firebase/firestore";

// Reads the provided challenge's title script
function readChallengeTitle(challenge) {
    const challengeDocRef = doc(db, "challenges", challenge); // Get a reference to the document

    onSnapshot(challengeDocRef, docSnap => { // Listen for real-time updates
        if (docSnap.exists()) {          //Document existence check
            document.getElementById("challenge-title").innerHTML = docSnap.data().title;
        } else {
            console.log("No such document!");
        }
    }, (error) => {                      //Listener/system error
        console.error("Error listening to document: ", error);
    });
}

// Reads the provided challenge's goal value
function readChallengeGoal(challenge) {
    const challengeDocRef = doc(db, "challenges", challenge); // Get a reference to the document

    onSnapshot(challengeDocRef, docSnap => { // Listen for real-time updates
        if (docSnap.exists()) {          //Document existence check
            document.getElementById("challenge-goal").innerHTML = docSnap.data().challenge;
        } else {
            console.log("No such document!");
        }
    }, (error) => {                      //Listener/system error
        console.error("Error listening to document: ", error);
    });
}

// Not yet functioning, meant to help make the challenges list. Rewrite if needed
function displayChallenge (challenge) {
    const list = document.getElementById("challengeList")
    list.innerHTML = "";

    challenge.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.title;

        list.appendChild(li);
    });
}