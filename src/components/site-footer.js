import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '/css/styles.css?url';

// Import specific functions from the Firebase Auth SDK
import { onAuthStateChanged } from "firebase/auth";     //Detect login state
import { auth } from '/src/firebaseConfig.js';        //Firebase authentication connection

class SiteFooter extends HTMLElement {

    connectedCallback() {

        onAuthStateChanged(auth, (user) => {
            
            let userLink = user ? "profile.html" : "login.html";

            this.innerHTML = `
            <nav>
                <a href="/index.html"><img class="footer-image" src="/images/Location.png" alt="location"></a>
                <a href = "/app/html/challenges.html"> <img class="footer-image" src="/images/Footprint.png" alt="footprint"></a>
                <a href = "/app/html/itemshop.html"> <img class="footer-image" src="/images/Dollar Bag.png" alt="shop"></a>
                <a href = "/app/html/${userLink}"> <img class="footer-image" src="/images/Person.png" alt="person"></a>
            </nav>
        `;

        });


    }

}

customElements.define('site-footer', SiteFooter);