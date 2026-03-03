class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav>
                <a href="/index.html"><img class="footer-image" src="/img/Location.png" alt="location"></a>
                <a href = "/challenges.html"> <img class="footer-image" src="/img/Footprint.png" alt="footprint"></a>
                <a href = "/itemshop.html"> <img class="footer-image" src="/img/Dollar Bag.png" alt="shop"></a>
                <a href = "/user.html"> <img class="footer-image" src="/img/Person.png" alt="person"></a>
            </nav>
        `;
    }
    
}

customElements.define('site-footer', SiteFooter);