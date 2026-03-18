import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { db } from "./firebaseConfig.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { onAuthReady } from '/src/authentication.js';

onAuthReady(async (user) => {
    // If no user is logged in, redirect to the login page
    if (!user) {
        if (!window.location.pathname.endsWith('index.html')) {
            location.href = 'index.html';
        }

        return; // Stop execution
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userRef = doc(db, "users", user.uid);

    const itemTemplate = document.getElementById("itemTemplate");
    const itemList = document.getElementById("itemList");

    // Grab users points 
    const userPoints = userDoc.data().points;

    // *** NEED TO MAKE THIS AUTO UPDATE ***
    function displayPoints() {
        document.getElementById("pointsGoHere").innerHTML = userPoints;
    }

    displayPoints();


    async function populateItems() {

        console.log("Adding items to the shop...");

        try {

            // User's currently owned items
            const userItems = userDoc.data().items;
            console.log("User's purchased items:", userItems);

            // Shop items collection
            const q = query(collection(db, "items"));
            const queryItems = await getDocs(q);

            // Iterate through each document in the "items" collection
            queryItems.forEach((doc) => {

                // Only display items that the user doesn't already own
                if (!userItems.includes(doc.id)) {
                    const data = doc.data();

                    // Grab the values of each item's fields to be added to the template
                    const itemTitle = data.title || "Error: no title";
                    const itemDesc = data.description || "Error: no description";
                    const itemCost = data.cost || "Error: no cost";

                    // Clone the template and update the content
                    const itemCard = itemTemplate.content.cloneNode(true);
                    itemCard.querySelector(".itemTitle").textContent = itemTitle;
                    itemCard.querySelector(".itemDesc").textContent = itemDesc;
                    itemCard.querySelector(".itemCost").textContent = itemCost;
                    itemCard.querySelector(".itemRedeem").id = doc.id + "Redeem";
                    itemCard.querySelector(".card").id = doc.id;

                    // Append the updated cloned item and add it to the list of items to be displayed
                    itemList.appendChild(itemCard);

                    // Add a listener to the button 
                    document.getElementById(doc.id + "Redeem").addEventListener("click", async event => {

                        // If user has enough points, show the redeemed modal, remove the item from the list, 
                        //  and update the user's purchased items and points fields
                        // Else, show the error modal
                        if (userPoints >= itemCost) {
                            console.log("Redeeming", itemTitle + "...");

                            const redeemModal = new bootstrap.Modal(document.getElementById('redeemModal'))
                            redeemModal.show();

                            document.getElementById(doc.id).style.display = "none";

                            await updateDoc(userRef, {
                                items: arrayUnion(doc.id),
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

    populateItems();


})




