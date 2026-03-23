// Web component for the location detail panel
// Slides in from the left on desktop, from the bottom on mobile (like Google Maps)
// Drop <site-location-panel></site-location-panel> into any page that has a map

class SiteLocationPanel extends HTMLElement {
    connectedCallback() {
        // Inject the panel HTML into the custom element
        this.innerHTML = `
            <div id="location-panel" class="location-panel">
                <button class="panel-close-btn" onclick="closeLocationPanel()">✕</button>
                <p id="panel-type" class="panel-type"></p>
                <h2 id="panel-name" class="panel-name"></h2>
                <p id="panel-description" class="panel-description"></p>
                <div class="panel-actions">
                    <a id="panel-directions-btn" href="#" class="panel-btn panel-directions-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                        Directions
                    </a>
                    <!-- Save location (wired up by mapFunctions.js when a saveCallback exists) -->
                    <button class="panel-btn panel-save-btn" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2z"/>
                        </svg>
                        Save
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('site-location-panel', SiteLocationPanel);
