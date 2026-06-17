/* ============================================================
   level3.js — Repetitive Behaviour

   Scene: A conversation between the user and grandma.
   Grandma keeps asking the same question. The user must drag the reply card to her speech bubble each time.

   The interaction repeats 5 times with the same question.
   On the 6th exchange, grandma says something different. A moment of unexpected lucidity that lands harder because of the repetition that preceded it.

   Design rationale (why repetition is the interaction):
   The drag gesture is intentionally the same every time.
   The user performs the identical action over and over, which is exactly what caregivers experience.
   By the 4th or 5th repetition, the user may feel impatience, and that feeling is the point.
   The final different message reframes everything: she was never just repeating. She was trying to connect.

   Grandma's character sprite sits on the left. Her speech bubble appears above her.
   The reply card sits at the bottom right. A drop zone glows above the reply card — drag it up to respond.
============================================================ */

(function () {
    'use strict';

    /* ── DIALOGUE SEQUENCE ──
       First 5 entries: same question, same reply.
       Entry 6: different — a moment of lucidity.
    */
    const DIALOGUE = [
        {
            grandma: '"Did I tell you about the garden?\nThe roses are blooming."',
            reply:   'Yes, Grandma. They\'re beautiful.',
            isLast:  false,
        },
        {
            grandma: '"Did I tell you about the garden?\nThe roses are blooming."',
            reply:   'Yes, Grandma, you already told me.They\'re beautiful.',
            isLast:  false,
        },
        {
            grandma: '"Did I tell you about the garden?\nThe roses are blooming."',
            reply:   'Yes, Grandma. They\'re beautiful.',
            isLast:  false,
        },
        {
            grandma: '"Did I tell you about the garden?\nThe roses are blooming."',
            reply:   'Yes, Grandma. They\'re beautiful.',
            isLast:  false,
        },
        {
            grandma: '"Did I tell you about the garden?\nThe roses are blooming."',
            reply:   'Yes, Grandma. They\'re beautiful.',
            isLast:  false,
        },
        {
            grandma: '"You always had time for me.\nEven when I forget... you stay."',
            reply:   '...',
            isLast:  true,
        },
    ];

    const GRANDMA = {
        src: 'assets/grandma_character.png',
        alt: 'Grandma',
    };

    let currentIndex = 0;
    let locked = false; // whether finished (completed level)

    function initLevel3() {
        const area = document.getElementById('interaction-3');
        if (!area) return;

        area.innerHTML = `
      <div class="l3-scene" id="l3-scene">

        <!-- Left: grandma character + speech bubble -->
        <div class="l3-left">
          <div class="l3-bubble-wrap">
            <div class="l3-bubble" id="l3-bubble">
              <p class="l3-bubble-text" id="l3-bubble-text"></p>
            </div>
            <div class="l3-bubble-tail"></div>
          </div>
          <img class="l3-grandma" src="${GRANDMA.src}" alt="${GRANDMA.alt}" />
        </div>

        <!-- Right: reply area -->
        <div class="l3-right">

          <!-- Progress dots: one per dialogue step -->
          <div class="l3-progress" id="l3-progress"></div>

          <!-- Drop zone: drag reply card here -->
          <div class="l3-drop-zone" id="l3-drop-zone">
            <span class="l3-drop-label">drag here to reply</span>
          </div>

          <!-- Reply card: draggable -->
          <div class="l3-reply-card" id="l3-reply-card">
            <p class="l3-reply-text" id="l3-reply-text"></p>
          </div>

        </div>

      </div>
    `;

        injectStyles();
        buildProgress();
        showStep(0);
        attachDrag();
    }

    // Build progress dots
    function buildProgress() {
        const container = document.getElementById('l3-progress');
        if (!container) return;
        DIALOGUE.forEach(function (_, i) {
            const dot = document.createElement('div');
            dot.className = 'l3-dot';
            dot.id = 'l3-dot-' + i;
            container.appendChild(dot);
        });
    }

    // Show a dialogue step: update bubble text and reply card
    function showStep(index) {
        const entry = DIALOGUE[index];
        const bubbleText = document.getElementById('l3-bubble-text');
        const replyText = document.getElementById('l3-reply-text');
        const bubble = document.getElementById('l3-bubble');
        const replyCard = document.getElementById('l3-reply-card');
        const dropZone = document.getElementById('l3-drop-zone');

        if (!bubbleText || !replyText) return;

        // Reset reply card position
        replyCard.style.transition = '';
        replyCard.style.transform = 'translateY(0)';
        replyCard.style.opacity = '1';
        replyCard.classList.remove('l3-card-last');

        if (entry.isLast) {
            replyCard.classList.add('l3-card-last');
            bubble.classList.add('l3-bubble-last');
        } else {
            bubble.classList.remove('l3-bubble-last');
        }

        // Fade bubble text in
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(6px)';

        setTimeout(function () {
            bubbleText.textContent = entry.grandma;
            replyText.textContent = entry.reply;
            bubble.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateY(0)';
        }, index === 0 ? 300 : 150);

        // Mark current dot active
        document.querySelectorAll('.l3-dot').forEach(function (dot, i) {
            dot.classList.toggle('l3-dot-active', i === index);
            dot.classList.toggle('l3-dot-done', i < index);
        });

        // Re-enable drag
        locked = false;
        if (dropZone) dropZone.classList.remove('l3-drop-correct');
    }

    /* ── DRAG LOGIC ──
       The reply card can be dragged upward toward the drop zone.
       On release: if overlapping, it "sends" the reply.
       If not: springs back down.

       The card must be dragged to the same target every single time.
       The repetition of the identical gesture is intentional — it is the experience the interaction is trying to create.
    */
    function attachDrag() {
        const card = document.getElementById('l3-reply-card');
        const dropZone = document.getElementById('l3-drop-zone');
        if (!card || !dropZone) return;

        let isDragging = false;
        let startY = 0;
        let currentDY = 0;

        function onStart(clientY) {
            if (locked) return;
            isDragging = true;
            startY = clientY;
            card.classList.add('l3-card-dragging');
            card.style.transition = '';
        }

        function onMove(clientY) {
            if (!isDragging) return;
            currentDY = startY - clientY; // positive = dragging up
            if (currentDY > 0) {
                card.style.transform = 'translateY(-' + Math.min(currentDY, 200) + 'px)';
            }
            // Highlight drop zone when card is near
            const cardRect = card.getBoundingClientRect();
            const zoneRect = dropZone.getBoundingClientRect();
            const near = window.isOverlapping(cardRect, zoneRect, 0.3);
            dropZone.classList.toggle('l3-drop-near', near);
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('l3-card-dragging');
            dropZone.classList.remove('l3-drop-near');

            const cardRect = card.getBoundingClientRect();
            const zoneRect = dropZone.getBoundingClientRect();

            if (window.isOverlapping(cardRect, zoneRect, 0.3)) {
                // CORRECT: reply sent
                locked = true;
                dropZone.classList.add('l3-drop-correct');

                // Card flies up and fades out
                card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
                card.style.transform = 'translateY(-' + (currentDY + 40) + 'px)';
                card.style.opacity = '0';

                setTimeout(function () { advanceDialogue(); }, 500);

            } else {
                // Spring back
                card.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
                card.style.transform = 'translateY(0)';
            }

            currentDY = 0;
        }

        card.addEventListener('mousedown', function (e) {
            onStart(e.clientY); e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (isDragging) onMove(e.clientY);
        });
        document.addEventListener('mouseup', function () {
            if (isDragging) onEnd();
        });

        card.addEventListener('touchstart', function (e) {
            onStart(e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchmove', function (e) {
            if (isDragging) { onMove(e.touches[0].clientY); e.preventDefault(); }
        }, { passive: false });
        card.addEventListener('touchend', function () {
            if (isDragging) onEnd();
        });
    }

    function advanceDialogue() {
        // Mark current dot as done
        const dot = document.getElementById('l3-dot-' + currentIndex);
        if (dot) {
            dot.classList.remove('l3-dot-active');
            dot.classList.add('l3-dot-done');
        }

        currentIndex++;

        if (currentIndex >= DIALOGUE.length) {
            // All exchanges done
            setTimeout(function () { window.completeLevel(3); }, 400);
            return;
        }

        showStep(currentIndex);
    }

    // Styles
    function injectStyles() {
        if (document.getElementById('l3-styles')) return;
        const s = document.createElement('style');
        s.id = 'l3-styles';
        s.textContent = `

	      .l3-scene {
	        position: relative;
	        width: 100%;
	        height: 100%;
	        display: flex;
	        align-items: flex-start;
	        justify-content: center;
	        gap: 80px;
	        padding: 150px 24px 16px;
	      }

      /* ── LEFT: grandma + bubble ── */
	      .l3-left {
	        display: flex;
	        flex-direction: column;
	        align-items: center;
	        justify-content: flex-start;
	        flex: 0 0 auto;
	        gap: 0;
	      }

      .l3-bubble-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: -2px;
      }

      /* Speech bubble */
	      .l3-bubble {
	        background: var(--surface);
	        border: 1px solid var(--border);
	        border-radius: 12px;
	        padding: 20px 26px;
	        max-width: 340px;
	        min-height: 96px;
	        display: flex;
	        align-items: center;
	        transition: opacity 0.5s ease, transform 0.5s ease;
	      }

      /* Last message: slightly warmer border */
      .l3-bubble.l3-bubble-last {
        border-color: var(--accent);
        background: #F9F5F0;
      }

	      .l3-bubble-text {
	        font-family: var(--font-serif);
	        font-size: 17px;
	        line-height: 1.7;
	        color: var(--text);
	        font-style: italic;
	        white-space: pre-line;
	        text-align: center;
      }

      /* Bubble tail triangle */
      .l3-bubble-tail {
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid var(--border);
        margin-top: -1px;
      }

      /* Grandma character */
	      .l3-grandma {
	        height: 184px;
	        width: auto;
	        object-fit: contain;
	      }

      /* ── RIGHT: reply area ── */
	      .l3-right {
	        display: flex;
	        flex-direction: column;
	        align-items: center;
	        justify-content: flex-start;
	        flex: 0 0 auto;
	        gap: 22px;
	        padding-top: 24px;
	      }

      /* Progress dots */
	      .l3-progress {
	        display: flex;
	        gap: 8px;
	        margin-bottom: 6px;
	      }

	      .l3-dot {
	        width: 9px;
	        height: 9px;
	        border-radius: 50%;
	        border: 1.5px solid var(--border);
	        background: transparent;
	      }

      .l3-dot.l3-dot-active {
        border-color: var(--accent);
        background: var(--accent);
      }

      .l3-dot.l3-dot-done {
        border-color: var(--correct);
        background: var(--correct);
      }

      /* Drop zone */
	      .l3-drop-zone {
	        width: 252px;
	        height: 66px;
	        border: 1.5px dashed var(--border);
	        border-radius: 6px;
	        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.2s ease, background 0.2s ease;
      }

	      .l3-drop-label {
	        font-family: var(--font-sans);
	        font-size: 11px;
	        letter-spacing: 0.08em;
	        color: var(--text-muted);
	        pointer-events: none;
      }

      .l3-drop-zone.l3-drop-near {
        border-color: var(--accent);
        background: rgba(139, 111, 99, 0.06);
      }

      .l3-drop-zone.l3-drop-correct {
        border-color: var(--correct);
        background: rgba(110, 155, 123, 0.08);
      }

      /* Reply card */
	      .l3-reply-card {
	        width: 252px;
	        min-height: 66px;
	        background: var(--bg);
	        border: 1px solid var(--border);
	        border-radius: 6px;
	        padding: 15px 19px;
	        cursor: grab;
	        user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
	      }

      .l3-reply-card.l3-card-dragging {
        cursor: grabbing;
        box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      }

      /* Last card: styled differently to signal change */
      .l3-reply-card.l3-card-last {
        border-color: var(--accent);
        background: #F9F5F0;
      }

	      .l3-reply-text {
	        font-family: var(--font-sans);
	        font-size: 15px;
	        color: var(--text);
	        text-align: center;
	        line-height: 1.5;
        pointer-events: none;
      }

    `;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLevel3);
    } else {
        initLevel3();
    }

})();
