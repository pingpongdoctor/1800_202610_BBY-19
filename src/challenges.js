console.log("Script loaded");
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
        if (docSnap.exists()) {          // Document existence check
            let challengeGoal = docSnap.data().goal;
            return challengeGoal;
        } else {
            console.log("No such document!");
        }
    }, (error) => {                      //Listener/system error
        console.error("Error listening to document: ", error);
    });
}

// Instantiates a challenge board item
function createChallenge(title, value, max) {
    let temp = document.querySelector("#challenge-item");
    let cln = temp.content.cloneNode(true);

    let chalTitle = cln.querySelector("#challenge-title");
    let progressBar = cln.querySelector(".progress-bar");
    let progressContainer = cln.querySelector(".progress");

    chalTitle.textContent = title;
    progressBar.textContent = `${value} / ${max}`;
    progressBar.style.width = `${(value / max) * 100}%`;
    progressContainer.setAttribute("aria-valuenow", value);
    progressContainer.setAttribute("aria-valuemax", max);

    return cln;
}
const list = document.getElementById("challengeList");
list.appendChild(createChallenge(readChallengeTitle("cafes"), 2, readChallengeGoal("cafes")));
list.appendChild(createChallenge(readChallengeTitle("restaurants"), 2, readChallengeGoal("restaurants")));
list.appendChild(createChallenge(readChallengeTitle("walking"), 2, readChallengeGoal("walking")));


window.onload = function () {
    readChallengeTitle("walking");
};