import { onAuthStateChanged } from "firebase/auth"; // Detect login state
import { auth } from '../firebaseConfig.js'; // Firebase authentication connection

class SiteFooter extends HTMLElement {
    connectedCallback() {
        // Render nav immediately so it never flashes in/out
        this.innerHTML = `
            <nav class="app-nav">
                <a href="/index.html" class="nav-item">
                    <img class="footer-image" src="/images/Location.png" alt="location">
                    <span class="nav-label">Explore</span>
                </a>
                <a href="/app/html/challenges.html" class="nav-item" data-auth="challenges">
                    <img class="footer-image" src="/images/climb.png" alt="footprint">
                    <span class="nav-label">Challenges</span>
                </a>
                <a href="/app/html/itemshop.html" class="nav-item" data-auth="itemshop">
                    <img class="footer-image" src="/images/shopIcon.png" alt="shop">
                    <span class="nav-label">Shop</span>
                </a>
                <a href="/app/html/profile.html" class="nav-item" data-auth="profile">
                    <img class="footer-image" src="/images/Person.png" alt="person">
                    <span class="nav-label">Profile</span>
                </a>
            </nav>
        `;

        // Once auth resolves, redirect unauthenticated users to login
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                this.querySelectorAll('[data-auth]').forEach(link => {
                    link.href = '/app/html/login.html';
                });
            }
        });
    }
}

customElements.define('site-footer', SiteFooter);