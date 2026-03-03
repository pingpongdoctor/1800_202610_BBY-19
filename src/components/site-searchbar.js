class SiteSearchbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <form class="form-inline my-2 my-lg-0">
                <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                <a class="btn btn-outline-success my-2 my-sm-0" type="submit" href="/app/html/route.html">Search</a>
                <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Filter</button>
            </form>
        `;
    }
    
}

customElements.define('site-searchbar', SiteSearchbar);