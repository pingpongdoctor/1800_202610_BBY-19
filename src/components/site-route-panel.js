// Web component for the route panel
// Slides up from the bottom when a user requests directions
// Drop <site-route-panel></site-route-panel> into the main page

class SiteRoutePanel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <!-- MODE SELECTOR + ROUTE INFO (fixed to bottom) -->
            <div class="route-panel">
                <!-- TOP ROW: cancel button, destination name, confirm button -->
                <div class="d-flex align-items-center px-2 pt-2 gap-2">
                    <button class="route-cancel-btn" id="route-panel-cancel">Cancel</button>
                    <span id="dest-name" class="fw-bold text-truncate flex-grow-1" style="color: var(--black);"></span>
                    <button id="confirm-route-btn" class="route-go-btn">Go</button>
                </div>

                <!-- MODE SELECTOR -->
                <div class="d-flex w-100">
                    <button class="mode-btn active flex-fill d-flex flex-column align-items-center py-3 border-0" data-mode="walking">
                        <img src="/images/walking.png" alt="walking" style="width: 35px;">
                        <span class="mt-1 small">Walking</span>
                    </button>
                    <button class="mode-btn flex-fill d-flex flex-column align-items-center py-3 border-0" data-mode="cycling">
                        <img src="/images/cycling.png" alt="cycling" style="width: 35px;">
                        <span class="mt-1 small">Cycling</span>
                    </button>
                    <button class="mode-btn flex-fill d-flex flex-column align-items-center py-3 border-0" data-mode="transit">
                        <img src="/images/transit.png" alt="transit" style="width: 35px;">
                        <span class="mt-1 small">Transit</span>
                    </button>
                </div>

                <!-- ROUTE INFO TABLE (duration and distance for the selected mode) -->
                <table class="table table-striped mb-0">
                    <tbody>
                        <tr>
                            <th class="route-odd" scope="row">Duration</th>
                            <td id="route-duration" class="route-odd">Loading...</td>
                        </tr>
                        <tr>
                            <th class="route-even" scope="row">Distance</th>
                            <td id="route-distance" class="route-even">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Shows up after confirming a route, lets the user cancel navigation -->
            <button id="cancel-route-btn" class="cancel-route-btn" style="display: none;">Cancel Route</button>
        `;
    }
}

customElements.define('site-route-panel', SiteRoutePanel);
