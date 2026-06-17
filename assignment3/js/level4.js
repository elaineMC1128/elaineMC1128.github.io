/* ============================================================
   level4.js — Memory Loss

   Scene: A horizontal timeline with four anchors (Childhood, Wedding, Career, Recent).
   Four memory cards are scattered on the right and each must be dragged to its correct anchor.

   Visual design rationale:
   Cards representing distant memories are rendered clearly, with sharp text, full opacity, warm colour.
   Cards for recent memories are progressively blurred, desaturated, and faded.
   This reflects the clinical reality of Alzheimer's memory loss: remote memories persist while recent ones dissolve.
   The user must work hardest to place the recent cards, whose labels are barely legible, mirroring the patient's own struggle to grasp what just happened.

   Drag rationale:
   Placing a memory on a timeline is an act of anchoring and trying to fix something in time before it disappears.
   The physical gesture of dragging and placing a fragile, faded card carries emotional weight that a click cannot.
============================================================ */

(function () {
    'use strict';

    const CARDS = [
        {
            id: 'childhood',
            src: 'assets/childhood.png',
            alt: 'Childhood memory',
            blur:    0,
            opacity: 1,
            initX:   12,  initY: 22,
        },
        {
            id:      'wedding',
            src:     'assets/wedding.png',
            alt:     'Wedding memory',
            blur:    0.6,
            opacity: 0.85,
            initX:   36,  initY: 28,
        },
        {
            id:      'family',
            src:     'assets/family photograph.png',
            alt:     'Big family memory',
            blur:    2.5,
            opacity: 0.62,
            initX:   61,  initY: 20,
        },
        {
            id:      'recent',
            src:     'assets/recent.png',
            alt:     'Recent memory',
            blur:    4.5,
            opacity: 0.38,
            initX:   84,  initY: 26,
        },
    ];

    const ANCHORS = [
        { id: 'childhood', label: 'Childhood', x: 12 },
        { id: 'wedding',   label: 'Wedding',   x: 36 },
        { id: 'family',    label: 'Big Family', x: 61 },
        { id: 'recent',    label: 'Recent',    x: 84 },
    ];

    // Timeline sits in the lower portion of the scene
    const TIMELINE_Y = 70;
    // Cards snap to just above the timeline when placed
    const SNAP_Y = 52;

    let placedCount = 0;

    function initLevel4() {
        const area = document.getElementById('interaction-4');
        if (!area) return;
        area.innerHTML = `<div class="l4-scene" id="l4-scene"></div>`;
        injectStyles();
        const scene = document.getElementById('l4-scene');
        buildTimeline(scene);
        buildCards(scene);
    }

    function buildTimeline(scene) {
        // Rail line
        const rail = document.createElement('div');
        rail.className  = 'l4-rail';
        rail.style.top  = TIMELINE_Y + '%';
        scene.appendChild(rail);

        ANCHORS.forEach(function (anchor) {
            // Dot on the rail
            const dot = document.createElement('div');
            dot.className = 'l4-anchor-dot';
            dot.id = 'l4-dot-' + anchor.id;
            dot.style.left = anchor.x + '%';
            dot.style.top = TIMELINE_Y + '%';
            scene.appendChild(dot);

            // Label below dot
            const lbl = document.createElement('div');
            lbl.className = 'l4-anchor-label';
            lbl.textContent = anchor.label;
            lbl.style.left = anchor.x + '%';
            lbl.style.top = (TIMELINE_Y + 5.5) + '%';
            scene.appendChild(lbl);

            // Drop zone: tall column from cards area down to anchor
            const zone = document.createElement('div');
            zone.className = 'l4-drop-zone';
            zone.id = 'l4-zone-' + anchor.id;
            zone.style.left = anchor.x + '%';
            zone.style.top = TIMELINE_Y + '%';
            scene.appendChild(zone);
        });

        // "Drag cards onto the timeline" hint
        const hint = document.createElement('p');
        hint.className = 'l4-hint';
        hint.textContent = 'drag each memory to its place on the timeline';
        scene.appendChild(hint);
    }

    function buildCards(scene) {
        CARDS.forEach(function (card) {
            const el = document.createElement('div');
            el.className = 'l4-card';
            el.id = 'l4-card-' + card.id;
            el.style.left = card.initX + '%';
            el.style.top = card.initY + '%';
            el.style.filter = buildFilter(card);
            el.style.opacity = card.opacity;
            el.innerHTML = `<img class="l4-card-image" src="${card.src}" alt="${card.alt}" />`;
            scene.appendChild(el);
            attachDrag(el, card);
        });
    }

    function buildFilter(card) {
        var f = [];
        if (card.blur  > 0) f.push('blur('  + card.blur  + 'px)');
        return f.length ? f.join(' ') : 'none';
    }

    function attachDrag(el, cardDef) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;
        let locked = false;

        function onStart(cx, cy) {
            if (locked) return;
            isDragging = true;
            el.classList.add('l4-dragging');
            const r = el.getBoundingClientRect();
            offsetX = cx - (r.left + r.width  / 2);
            offsetY = cy - (r.top  + r.height / 2);
            el.style.zIndex = 50;
            highlightZone(cardDef.id, true);
        }

        function onMove(cx, cy) {
            if (!isDragging) return;
            const sc = document.getElementById('l4-scene').getBoundingClientRect();
            el.style.left = ((cx - offsetX - sc.left) / sc.width)  * 100 + '%';
            el.style.top = ((cy - offsetY - sc.top)  / sc.height) * 100 + '%';
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            el.classList.remove('l4-dragging');
            el.style.zIndex = 10;
            highlightZone(cardDef.id, false);

            const zone = document.getElementById('l4-zone-' + cardDef.id);
            const elR = el.getBoundingClientRect();
            const zR = zone.getBoundingClientRect();

            if (window.isOverlapping(elR, zR, 0.25)) {
                //Correct
                locked = true;

                const anchor = ANCHORS.find(function (a) { return a.id === cardDef.id; });

                // Snap card above anchor, clear degradation
                el.style.transition = 'left 0.4s ease, top 0.4s ease, filter 0.9s ease, opacity 0.9s ease';
                el.style.left = anchor.x + '%';
                el.style.top = SNAP_Y + '%';
                el.style.filter = 'none';
                el.style.opacity = '1';
                setTimeout(function () { el.style.transition = ''; }, 950);

                // Fill anchor dot
                const dot = document.getElementById('l4-dot-' + cardDef.id);
                if (dot) {
                    dot.classList.add('l4-dot-filled');
                    setTimeout(function () { dot.classList.add('l4-dot-pulse'); }, 150);
                }

                placedCount++;
                if (placedCount >= CARDS.length) {
                    setTimeout(function () { window.completeLevel(4); }, 1000);
                }

            } else {
                // Spring back
                el.style.transition = 'left 0.4s cubic-bezier(0.25,0.46,0.45,0.94), top 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
                el.style.left = cardDef.initX + '%';
                el.style.top = cardDef.initY + '%';
                setTimeout(function () { el.style.transition = ''; }, 420);
            }
        }

        el.addEventListener('mousedown', function (e) { onStart(e.clientX, e.clientY); e.preventDefault(); });
        document.addEventListener('mousemove', function (e) { if (isDragging) onMove(e.clientX, e.clientY); });
        document.addEventListener('mouseup', function () { if (isDragging) onEnd(); });
        el.addEventListener('touchstart', function (e) { onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
        el.addEventListener('touchmove', function (e) { if (isDragging) { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
        el.addEventListener('touchend', function () { if (isDragging) onEnd(); });
    }

    function highlightZone(id, active) {
        const z = document.getElementById('l4-zone-' + id);
        if (z) z.classList.toggle('l4-zone-active', active);
    }

    function injectStyles() {
        if (document.getElementById('l4-styles')) return;
        const s = document.createElement('style');
        s.id = 'l4-styles';
        s.textContent = `

      .l4-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      /* Hint text */
      .l4-hint {
        position: absolute;
        bottom: 4%;
        left: 50%;
        transform: translateX(-50%);
        font-family: var(--font-sans);
        font-size: 10px;
        letter-spacing: 0.08em;
        color: var(--text-muted);
        white-space: nowrap;
        pointer-events: none;
      }

      /* ── TIMELINE ── */
      .l4-rail {
        position: absolute;
        left: 4%;
        right: 4%;
        height: 1px;
        transform: translateY(-50%);
        background: linear-gradient(
          to right,
          var(--border) 0%,
          var(--border) 65%,
          rgba(200,191,181,0.25) 100%
        );
        z-index: 1;
        pointer-events: none;
      }

      .l4-anchor-dot {
        position: absolute;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        border: 1.5px solid var(--border);
        background: var(--bg);
        transform: translate(-50%, -50%);
        z-index: 4;
        transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.3s ease;
      }

      .l4-anchor-dot.l4-dot-filled {
        background: var(--correct);
        border-color: var(--correct);
      }

      .l4-anchor-dot.l4-dot-pulse {
        animation: l4pulse 0.7s ease-out;
      }

      @keyframes l4pulse {
        0%   { box-shadow: 0 0 0 0    rgba(110,155,123,0.55); }
        70%  { box-shadow: 0 0 0 10px rgba(110,155,123,0);    }
        100% { box-shadow: 0 0 0 0    rgba(110,155,123,0);    }
      }

      .l4-anchor-label {
        position: absolute;
        transform: translateX(-50%);
        font-family: var(--font-sans);
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
        white-space: nowrap;
        pointer-events: none;
        z-index: 3;
      }

      /* Drop zone: column above each anchor dot */
      .l4-drop-zone {
        position: absolute;
        width: 16%;
        height: 30%;
        transform: translate(-50%, -100%);
        border-radius: 6px;
        pointer-events: none;
        z-index: 3;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }

      .l4-drop-zone.l4-zone-active {
        background: rgba(139,111,99,0.06);
        box-shadow: 0 0 0 1.5px rgba(139,111,99,0.3);
      }

      /* ── CARDS ── */
      .l4-card {
        position: absolute;
        width: 14%;
        min-width: 90px;
        transform: translate(-50%, -50%);
        cursor: grab;
        user-select: none;
        z-index: 10;
      }

      #l4-card-childhood,
      #l4-card-wedding,
      #l4-card-family {
        width: 16.5%;
        min-width: 112px;
      }

      .l4-card.l4-dragging {
        cursor: grabbing;
        z-index: 50;
      }

      .l4-card-image {
        width: 100%;
        height: auto;
        display: block;
        pointer-events: none;
      }
    `;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLevel4);
    } else {
        initLevel4();
    }

})();


/*
Image Statement 1 - childhood memory
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "childhood drawing scene, chalk drawing on stone road, warm nostalgic illustration"
 */

/*
Image Statement 2 - wedding picture
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "wedding photo illustration style, warm tone, framed memory picture"
 */

/*
Image Statement 3 - family photograph
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "warm illustrated family portrait in framed photo style, multi-generation family"
 */

/*
Image Statement 4 - eating breakfast
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "elderly woman eating breakfast with confused expression, warm sunlight, home setting"
 */