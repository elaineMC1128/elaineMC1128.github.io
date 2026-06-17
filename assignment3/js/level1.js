/* ============================================================
   level1.js — Misplacement

   Scene: An illustrated living room. Three objects are misplaced:
     - Remote → floor by sofa right  (belongs on coffee table)
     - Shoes  → floor by sofa left   (belongs on shoe rack)
     - Keys   → floor center         (belongs on red tray)

   Drop zone positions calibrated to the white dashed outlines painted into the background illustration.

   Design rationale:
   The dashed outlines in the illustration act as natural affordances,which the user can understand where things belong without any UI labels.
   The drag gesture of "putting something back" physically enacts the caregiver's routine.
   Spring-back on wrong drops carries no penalty, mirroring the patience required in real caregiving.
============================================================ */



(function () {
  'use strict';

  let placedCount = 0;  // count the correct-placed objects
  const totalObjects = 3;

  const OBJECTS = [
    {
      id:    'remote',
      src:   'assets/remote.png',
      alt:   'TV remote',
      initX: 80, initY: 77,
      size:  8,
      dropX: 46.5, dropY: 62, // (correct zone)coffee table dashed rect
      dropW: 10, dropH: 7,
    },
    {
      id:    'shoes',
      src:   'assets/shoes.png',
      alt:   'Blue sneakers',
      initX: 22,    initY: 73,
      size:  8,
      rotate: 5,
      dropX: 68.8, dropY: 43, // shoe rack lower shelf
      dropW: 11,   dropH: 7,
    },
    {
      id:    'keys',
      src:   'assets/keys.png',
      alt:   'Keys',
      initX: 58,   initY: 38,
      size:  6,
      rotate: -45,
      dropX: 66,   dropY: 76.5, // red tray on side table
      dropW: 8,    dropH: 6,
    },
  ];

  function initLevel1() {
    const area = document.getElementById('interaction-1');
    if (!area) return;
    area.innerHTML = `<div class="l1-scene" id="l1-scene"></div>`;
    injectStyles();

    const scene = document.getElementById('l1-scene');

    // Drop zones (behind objects)
    OBJECTS.forEach(function (obj) {
      const zone = document.createElement('div');
      zone.className = 'l1-drop-zone';
      zone.id = 'l1-zone-' + obj.id;
      zone.style.left = obj.dropX + '%';
      zone.style.top = obj.dropY + '%';
      zone.style.width = obj.dropW + '%';
      zone.style.height = obj.dropH + '%';
      zone.style.transform = 'translate(-50%, -50%)';
      scene.appendChild(zone);
    });

    // Draggable objects
    OBJECTS.forEach(function (obj) {
      const el = document.createElement('img');
      el.className = 'l1-object';
      el.id = 'l1-obj-' + obj.id;
      el.src = obj.src;
      el.alt = obj.alt;
      el.dataset.id = obj.id;
      el.style.width = obj.size + '%';
      el.style.left = obj.initX + '%';
      el.style.top = obj.initY + '%';
      el.style.setProperty('--l1-rotation', (obj.rotate || 0) + 'deg');
      el.style.transform = 'translate(-50%, -50%) rotate(var(--l1-rotation))';
      el.draggable = false;
      scene.appendChild(el);
      attachDrag(el, obj);
    });
  }

  function attachDrag(el, objDef) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let locked = false;

    function onStart(clientX, clientY) {
      if (locked) return;
      isDragging = true;
      el.classList.add('l1-dragging');
      const r = el.getBoundingClientRect();
      offsetX = clientX - (r.left + r.width  / 2);
      offsetY = clientY - (r.top  + r.height / 2);
      el.style.zIndex = 100;
      highlightZone(objDef.id, true);
    }

    function onMove(clientX, clientY) {
      if (!isDragging) return;
      const scene = document.getElementById('l1-scene');
      const sr = scene.getBoundingClientRect();
      el.style.left = ((clientX - offsetX - sr.left) / sr.width)  * 100 + '%';
      el.style.top  = ((clientY - offsetY - sr.top)  / sr.height) * 100 + '%';
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('l1-dragging');
      el.style.zIndex = 10;
      highlightZone(objDef.id, false);

      const zone    = document.getElementById('l1-zone-' + objDef.id);
      const elRect  = el.getBoundingClientRect();
      const zRect   = zone.getBoundingClientRect();

      if (window.isOverlapping(elRect, zRect, 0.35)) {
        locked = true;
        zone.classList.add('l1-zone-correct');
        el.style.transition = 'left 0.25s ease, top 0.25s ease';
        el.style.left = objDef.dropX + '%';
        el.style.top = objDef.dropY + '%';
        setTimeout(function () { el.style.transition = ''; }, 280);
        placedCount++;
        if (placedCount >= totalObjects) {
          setTimeout(function () {
            showCompletedScene();
            window.completeLevel(1);
          }, 700);
        }
      } else {
        // Spring back — no penalty
        el.style.transition = 'left 0.4s cubic-bezier(0.25,0.46,0.45,0.94), top 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
        el.style.left = objDef.initX + '%';
        el.style.top  = objDef.initY + '%';
        setTimeout(function () { el.style.transition = ''; }, 420);
      }
    }

    el.addEventListener('mousedown', function (e) { onStart(e.clientX, e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', function (e) { if (isDragging) onMove(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   function ()  { if (isDragging) onEnd(); });
    el.addEventListener('touchstart', function (e) { onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    el.addEventListener('touchmove',  function (e) { if (isDragging) { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } }, { passive: false });
    el.addEventListener('touchend',   function ()  { if (isDragging) onEnd(); });
  }

  function highlightZone(id, active) {
    const z = document.getElementById('l1-zone-' + id);
    if (z) z.classList.toggle('l1-zone-active', active);
  }

  function showCompletedScene() {
    const scene = document.getElementById('l1-scene');
    if (!scene) return;
    scene.classList.add('l1-scene-complete');
  }

  function injectStyles() {
    if (document.getElementById('l1-styles')) return;
    const s = document.createElement('style');
    s.id = 'l1-styles';
    s.textContent = `
      .l1-scene {
        position: relative;
        width: 90%;
        height: 90%;
        background-image: url('assets/chapter1_bg.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center center;
        border-radius: 6px;
      }
      .l1-scene.l1-scene-complete {
        background-image: url('assets/chapter1_bg_done.png');
      }
      .l1-scene.l1-scene-complete .l1-object,
      .l1-scene.l1-scene-complete .l1-drop-zone {
        opacity: 0;
        pointer-events: none;
      }
      .l1-object {
        position: absolute;
        transform: translate(-50%, -50%) rotate(var(--l1-rotation, 0deg));
        cursor: grab;
        user-select: none;
        z-index: 10;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        transition: filter 0.15s ease, transform 0.15s ease;
      }
      .l1-object:hover {
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
        transform: translate(-50%, -50%) rotate(var(--l1-rotation, 0deg)) scale(1.08);
      }
      .l1-object.l1-dragging {
        cursor: grabbing;
        filter: drop-shadow(0 8px 20px rgba(0,0,0,0.45));
        transform: translate(-50%, -50%) rotate(var(--l1-rotation, 0deg)) scale(1.12);
        z-index: 100;
      }
      .l1-drop-zone {
        position: absolute;
        transform: translate(-50%, -50%);
        border-radius: 4px;
        pointer-events: none;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }
      .l1-drop-zone.l1-zone-active {
        background: rgba(255,255,255,0.2);
        box-shadow: 0 0 0 2px rgba(255,255,255,0.55);
      }
      .l1-drop-zone.l1-zone-correct {
        background: rgba(110,155,123,0.15);
        box-shadow: 0 0 0 2px rgba(110,155,123,0.45);
      }
    `;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLevel1);
  } else {
    initLevel1();
  }

})();


/*
Image Statement - Scene 1  Misplaced Objects drag interaction background:
Image generated using AI (ChatGPT / DALL·E via OpenAI)
Prompt: "A cozy family living room + a light hand-drawn style + interactive drag-and-drop items(remote, shoes, key) + the dotted line indicates the correct placement of the dragged item. "
*/
