class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav>
                <a href="/index.html"><img class="footer-image" src="./public/images/Location.png" alt="location"></a>
                <a href = "/challenges.html"> <img class="footer-image" src="./public/images/Footprint.png" alt="footprint"></a>
                <a href = "/itemshop.html"> <img class="footer-image" src="./public/images/Dollar Bag.png" alt="shop"></a>
                <a href = "/user.html"> <img class="footer-image" src="./public/images/Person.png" alt="person"></a>
            </nav>
        `;
    }
    
}

customElements.define('site-footer', SiteFooter);