class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav>
                <a href="/index.html"><img class="footer-image" src="/images/Location.png" alt="location"></a>
                <a href = "/app/html/challenges.html"> <img class="footer-image" src="/images/Footprint.png" alt="footprint"></a>
                <a href = "/app/html/itemshop.html"> <img class="footer-image" src="/images/Dollar Bag.png" alt="shop"></a>
                <a href = "/app/html/login.html"> <img class="footer-image" src="/images/Person.png" alt="person"></a>
            </nav>
        `;
    }
    
}

customElements.define('site-footer', SiteFooter);