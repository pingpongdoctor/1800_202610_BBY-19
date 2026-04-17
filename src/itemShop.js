import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, updateDoc, arrayUnion, increment, onSnapshot} from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

onAuthReady(async (user) => {
    // If no user is logged in, redirect to the login page
    if (!user) {
        if (!window.location.pathname.endsWith('index.html')) {
            location.href = '/app/html/login.html';
        }
        return; // Stop execution
    }
    // Listen to users points data and display with dynamic updates
    onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        const userPointsSnapshot = snapshot.data().points;
        document.getElementById("pointsGoHere").innerHTML = userPointsSnapshot;
    })

    await populateItems(user);
})

async function populateItems(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        const itemTemplate = document.getElementById("itemTemplate");
        const itemList = document.getElementById("itemList");
        const userItems = userDoc.data().items;

        // Shop items collection
        const q = query(collection(db, "items"));
        const queryItems = await getDocs(q);

        // Iterate through each document in the "items" collection
        queryItems.forEach((snapshot) => {

            // Only display items that the user doesn't already own
            if (!userItems.includes(snapshot.id)) {
                const data = snapshot.data();

                // Grab the values of each item's fields to be added to the template
                const itemTitle = data.title || "Error: no title";
                const itemDesc = data.description || "Error: no description";
                const itemCost = data.cost || "Error: no cost";

                // Clone the template and update the content
                const itemCard = itemTemplate.content.cloneNode(true);
                itemCard.querySelector(".itemTitle").textContent = itemTitle;
                itemCard.querySelector(".itemDesc").textContent = itemDesc;
                itemCard.querySelector(".itemCost").textContent = itemCost;
                itemCard.querySelector(".itemRedeem").id = snapshot.id + "Redeem";
                itemCard.querySelector(".card").id = snapshot.id;
                itemCard.querySelector("img").src = `/images/${snapshot.id}.png`;

                // Append the updated cloned item and add it to the list of items to be displayed
                itemList.appendChild(itemCard);

                // Add a listener to the button 
                document.getElementById(snapshot.id + "Redeem").addEventListener("click", async event => {

                    const userDocSnapshot = await getDoc(userRef);
                    const userPointsSnapshot = userDocSnapshot.data().points;

                    // If user has enough points, show the redeemed modal, remove the item from the list, 
                    //  and update the user's purchased items and points fields
                    // Else, show the error modal
                    if (userPointsSnapshot >= itemCost) {
                        const redeemModal = new bootstrap.Modal(document.getElementById('redeemModal'))
                        redeemModal.show();

                        document.getElementById(snapshot.id).style.display = "none";

                        await updateDoc(userRef, {
                            items: arrayUnion(snapshot.id),
                            points: increment(-itemCost)
                        });
                    } else {
                        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'))
                        errorModal.show();
                    }
                })
            }
        })
    } catch (error) {
        console.error("Error loading items: ", error);
    }
}

