class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer>
                <a href="./index.html"><img class="footer-image" src="./images/Location.png" alt="location"></a>
                <a href = "./challenges.html"> <img class="footer-image" src="./images/Footprint.png" alt="footprint"></a>
                <a href = "./itemshop.html"> <img class="footer-image" src="./images//Dollar Bag.png" alt="shop"></a>
                <a href = "/user.html"> <img class="footer-image" src="./images/Person.png" alt="person"></a>
            </footer>
        `;
    }
    
}

customElements.define('site-footer', SiteFooter);