import { onAuthStateChanged } from "firebase/auth"; // Detect login state
import { auth } from '../firebaseConfig.js'; // Firebase authentication connection

class SiteFooter extends HTMLElement {
    connectedCallback() {
        onAuthStateChanged(auth, (user) => {
            const userPage = user ? 'profile' : 'login';
            const itemShopPage = user ? 'itemshop' : 'login';
            const challengesPage = user ? 'challenges' : 'login';

            this.innerHTML = `
                <nav class="app-nav">
                    <a href="/index.html" class="nav-item">
                        <img class="footer-image" src="/images/Location.png" alt="location">
                        <span class="nav-label">Explore</span>
                    </a>
                    <a href="/app/html/${challengesPage}.html" class="nav-item">
                        <img class="footer-image" src="/images/Footprint.png" alt="footprint">
                        <span class="nav-label">Challenges</span>
                    </a>
                    <a href="/app/html/${itemShopPage}.html" class="nav-item">
                        <img class="footer-image" src="/images/Dollar Bag.png" alt="shop">
                        <span class="nav-label">Shop</span>
                    </a>
                    <a href="/app/html/${userPage}.html" class="nav-item">
                        <img class="footer-image" src="/images/Person.png" alt="person">
                        <span class="nav-label">Profile</span>
                    </a>
                </nav>
            `;
        });
    }
}

customElements.define('site-footer', SiteFooter);