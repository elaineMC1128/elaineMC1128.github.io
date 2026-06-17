/* ============================================================
   level2.js — Spatial Disorientation

   Scene: An neighbourhood map. Grandma is lost and cannot find her way home despite having lived here for decades.

   Mechanic:
   A series of waypoints are placed along a dotted path on the map. The user drags grandma from waypoint to waypoint, one at a time.
   Each waypoint lights up (fills solid) when she arrives. The final destination is her home.

   Design rationale:
   The user physically guides grandma through the map.
   This is not a click, it requires continuous effort and attention, mirroring the exhausting experience of leading someone with Alzheimer's through a familiar place that has become unrecognisable to them.
   The user cannot rush: grandma must be brought to each stop in order.
============================================================ */

(function () {
    'use strict';

    /* ── Waypoints ──
       Positions as % of the scene container (matches image proportions).
       Grandma starts at WAYPOINTS[0] and must reach each in order.
       The final waypoint is "home".
    */
    const WAYPOINTS = [
        { x: 44,   y: 98,   isHome: false },
        { x: 62,   y: 83,   isHome: false },
        { x: 42,   y: 59,   isHome: false },
        { x: 56.4, y: 44,   isHome: false },
        { x: 44,   y: 31.5, isHome: true  },
    ];

    const GRANDMA = {
        src: 'assets/grandma_character.png',
        alt: 'Grandma',
        size: 4,
    };

    const SNAP_RADIUS   = 8;   // % — how close grandma must be to a waypoint to snap
    let currentTarget   = 1;   // index of next waypoint to reach (start at 1, skip WP0)
    let grandmaEl       = null;
    let waypointEls     = [];
    let locked          = false;

    function initLevel2() {
        const area = document.getElementById('interaction-2');
        if (!area) return;
        area.innerHTML = `<div class="l2-scene" id="l2-scene"></div>`;
        injectStyles();
        const scene = document.getElementById('l2-scene');

        // Draw dotted path line (SVG overlay) -> connects all waypoints visually so the route is clear.
        // I used Chatgpt to teach me how to draw dotted line, and it guided me to learn it at mdn doc(Web/SVG/Reference/Element/svg)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'l2-path-svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        const points = WAYPOINTS.map(function (wp) { return wp.x + ',' + wp.y; }).join(' ');
        polyline.setAttribute('points', points);
        polyline.setAttribute('class', 'l2-path-line');
        svg.appendChild(polyline);
        scene.appendChild(svg);

        // Create waypoint dots
        WAYPOINTS.forEach(function (wp, i) {
            const dot = document.createElement('div');
            dot.className = 'l2-waypoint' + (wp.isHome ? ' l2-waypoint-home' : '');
            dot.id = 'l2-wp-' + i;
            dot.style.left = wp.x + '%';
            dot.style.top = wp.y + '%';

            if (i === 0) {
                // Start: filled immediately (already visited)
                dot.classList.add('l2-wp-visited');
            }

            scene.appendChild(dot);
            waypointEls.push(dot);
        });

        // Create grandma character
        grandmaEl = document.createElement('img');
        grandmaEl.className = 'l2-grandma';
        grandmaEl.id = 'l2-grandma';
        grandmaEl.src = GRANDMA.src;
        grandmaEl.alt = GRANDMA.alt;
        grandmaEl.draggable = false;
        grandmaEl.style.width = GRANDMA.size + '%';
        grandmaEl.style.left = WAYPOINTS[0].x + '%';
        grandmaEl.style.top = WAYPOINTS[0].y + '%';
        scene.appendChild(grandmaEl);

        attachGrandmaDrag();
    }

    /* ── Grandma Drag Logic ──
       Grandma can be dragged freely across the map.
       On release, check if she is close enough to the NEXT waypoint (currentTarget).

       If yes: snap her to it, mark it visited, advance target.
       If no: spring back to the PREVIOUS waypoint position (the last confirmed stop). This prevents skipping steps.
       If she reaches home: trigger level complete.

       Design rationale for "only next waypoint" rule:
       The user cannot drag grandma directly to the end — they must accompany her through each stop.
       This enforces the feeling of slowly, carefully guiding someone who cannot navigate alone.
    */
    function attachGrandmaDrag() {
        if (!grandmaEl) return;

        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        function onStart(clientX, clientY) {
            if (locked) return;
            isDragging = true;
            grandmaEl.classList.add('l2-grandma-dragging');
            const r = grandmaEl.getBoundingClientRect();
            offsetX = clientX - (r.left + r.width  / 2);
            offsetY = clientY - (r.top  + r.height / 2);
            grandmaEl.style.zIndex = 50;
        }

        function onMove(clientX, clientY) {
            if (!isDragging) return;
            const scene = document.getElementById('l2-scene');
            const sr = scene.getBoundingClientRect();
            const pctX = ((clientX - offsetX - sr.left) / sr.width)  * 100;
            const pctY = ((clientY - offsetY - sr.top)  / sr.height) * 100;

            grandmaEl.style.left = pctX + '%';
            grandmaEl.style.top = pctY + '%';

            // Highlight next target while dragging near it
            const target = WAYPOINTS[currentTarget];
            const dist = Math.hypot(pctX - target.x, pctY - target.y);
            const wpEl   = waypointEls[currentTarget];
            if (wpEl) {
                wpEl.classList.toggle('l2-wp-near', dist < SNAP_RADIUS * 1.8);
            }
        }

        function onEnd(clientX, clientY) {
            if (!isDragging) return;
            isDragging = false;
            grandmaEl.classList.remove('l2-grandma-dragging');
            grandmaEl.style.zIndex = 10;

            const scene = document.getElementById('l2-scene');
            const sr = scene.getBoundingClientRect();
            const pctX = ((clientX - offsetX - sr.left) / sr.width)  * 100;
            const pctY = ((clientY - offsetY - sr.top)  / sr.height) * 100;

            const target = WAYPOINTS[currentTarget];
            const dist = Math.hypot(pctX - target.x, pctY - target.y);

            // Remove near highlight
            if (waypointEls[currentTarget]) {
                waypointEls[currentTarget].classList.remove('l2-wp-near');
            }

            if (dist <= SNAP_RADIUS) {
                // CORRECT: reached next waypoint ──
                snapToWaypoint(currentTarget);
                currentTarget++;

                if (currentTarget >= WAYPOINTS.length) {
                    // All waypoints reached — level complete
                    locked = true;
                    setTimeout(function () {
                        window.completeLevel(2);
                    }, 800);
                }
            } else {
                // WRONG: spring back to last confirmed position ──
                const prev = WAYPOINTS[currentTarget - 1];
                springTo(prev.x, prev.y);
            }
        }

        grandmaEl.addEventListener('mousedown', function (e) {
            onStart(e.clientX, e.clientY); e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (isDragging) onMove(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', function (e) {
            if (isDragging) onEnd(e.clientX, e.clientY);
        });

        grandmaEl.addEventListener('touchstart', function (e) {
            onStart(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        grandmaEl.addEventListener('touchmove', function (e) {
            if (isDragging) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });
        grandmaEl.addEventListener('touchend', function (e) {
            if (isDragging) {
                const t = e.changedTouches[0];
                onEnd(t.clientX, t.clientY);
            }
        });
    }

    // Snap grandma to a waypoint position with a quick ease
    function snapToWaypoint(index) {
        const wp = WAYPOINTS[index];
        grandmaEl.style.transition = 'left 0.3s ease, top 0.3s ease';
        grandmaEl.style.left = wp.x + '%';
        grandmaEl.style.top = wp.y + '%';
        setTimeout(function () { grandmaEl.style.transition = ''; }, 320);

        // Mark waypoint as visited (fills solid green)
        const dot = waypointEls[index];
        if (dot) {
            dot.classList.add('l2-wp-visited');
            // Pulse animation on arrival
            dot.classList.add('l2-wp-pulse');
            setTimeout(function () { dot.classList.remove('l2-wp-pulse'); }, 600);
        }
    }

    // Spring grandma back to a position
    function springTo(x, y) {
        grandmaEl.style.transition = 'left 0.4s cubic-bezier(0.25,0.46,0.45,0.94), top 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
        grandmaEl.style.left = x + '%';
        grandmaEl.style.top  = y + '%';
        setTimeout(function () { grandmaEl.style.transition = ''; }, 420);
    }

    // Styles
    function injectStyles() {
        if (document.getElementById('l2-styles')) return;
	        const s = document.createElement('style');
	        s.id = 'l2-styles';
	        s.textContent = `

	      /* Scene container */
	      .l2-scene {
	        position: relative;
	        width: 100%;
        height: 100%;
        background-image: url('assets/chapter2_bg.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center top;
        border-radius: 6px;
        overflow: hidden;
      }

      /* SVG path connecting waypoints */
      .l2-path-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 6;
      }

      .l2-path-line {
        fill: none;
        stroke: rgba(139, 111, 99, 0.35);
        stroke-width: 0.6;
        stroke-dasharray: 2 2;
      }

      /* Waypoint dots */
      .l2-waypoint {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #6E9B7B;
        background: transparent;
        transform: translate(-50%, -50%);
        z-index: 8;
        pointer-events: none;
        transition: background 0.4s ease, transform 0.2s ease, box-shadow 0.3s ease;
      }

      /* Visited: fills solid green */
      .l2-waypoint.l2-wp-visited {
        background: #6E9B7B;
        box-shadow: 0 0 0 3px rgba(110, 155, 123, 0.25);
      }

      /* Near: pulses when grandma is close to it while dragging */
      .l2-waypoint.l2-wp-near {
        border-color: #8B6F63;
        box-shadow: 0 0 0 4px rgba(139, 111, 99, 0.2);
        transform: translate(-50%, -50%) scale(1.3);
      }

      /* Arrival pulse animation */
      .l2-waypoint.l2-wp-pulse {
        animation: l2-pulse 0.6s ease-out;
      }

      @keyframes l2-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(110,155,123,0.6); }
        70%  { box-shadow: 0 0 0 10px rgba(110,155,123,0); }
        100% { box-shadow: 0 0 0 0 rgba(110,155,123,0); }
      }

      /* Home waypoint: slightly larger with heart */
      .l2-waypoint-home {
        width: 20px;
        height: 20px;
        border-color: #8B6F63;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .l2-waypoint-home.l2-wp-visited {
        background: #8B6F63;
      }

      /* Grandma character */
      .l2-grandma {
        position: absolute;
        transform: translate(-50%, -80%);
        cursor: grab;
        user-select: none;
        z-index: 15;
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.25));
        transition: filter 0.15s ease, transform 0.15s ease;
      }

      .l2-grandma:hover {
        filter: drop-shadow(0 5px 14px rgba(0,0,0,0.35));
        transform: translate(-50%, -80%) scale(1.06);
      }

      .l2-grandma.l2-grandma-dragging {
        cursor: grabbing;
        filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4));
        transform: translate(-50%, -80%) scale(1.1);
        transition: none;
      }

    `;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLevel2);
    } else {
        initLevel2();
    }

})();


/*
Image Statement 1 - Spatial disorientation drag navigation map:
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "black and white isometric neighborhood map with small houses, parks, shops, illustration reference"
 */

/*
Image Statement 2 - Grandma character:
Ido Yehimovitz(2016) Grandma's Cats Are Trying To Kill Her![original series], Behance Website, accessed 12 June 2026. https://www.behance.net/gallery/43029131/Grandmas-Cats-Are-Trying-To-Kill-Her
 */