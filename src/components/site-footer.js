import { onAuthStateChanged } from "firebase/auth"; // Detect login state
import { auth } from '../firebaseConfig.js'; // Firebase authentication connection

class SiteFooter extends HTMLElement {
    connectedCallback() {
        onAuthStateChanged(auth, (user) => {
            const userPage = user ? 'profile.html' : 'login.html';

            this.innerHTML = `
                <nav class="navbar fixed-bottom border-top justify-content-around py-2">
                    <a href="/index.html"><img class="footer-image" src="/images/Location.png" alt="location"></a>
                    <a href="/app/html/challenges.html"><img class="footer-image" src="/images/Footprint.png" alt="footprint"></a>
                    <a href="/app/html/itemshop.html"><img class="footer-image" src="/images/Dollar Bag.png" alt="shop"></a>
                    <a href="/app/html/${userPage}"><img class="footer-image" src="/images/Person.png" alt="person"></a>
                </nav>
            `;
        });
    }
}

customElements.define('site-footer', SiteFooter);