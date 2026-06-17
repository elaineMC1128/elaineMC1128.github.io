(function () {
  'use strict';

  /* =========================
   State management
   ========================= */

  // Tracks which chapter is active and which levels are complete.
  /*
  Global state management:
  A shared state object tracks progress across the experience.
  This includes the currently visible chapter and completed interactions.
  Using a central state system prevents repeated triggers (for example, feedback panels opening multiple times) and makes chapter progression easier to manage.

  Future benefit:
  If the project expanded into a larger interactive website, this shared state system could support saving progress, branching experiences, or revisiting chapters.
  */
  const state = {
    currentChapter: 0,
    totalChapters: 6,       // 0=intro, 1-4=levels, 5=ending
    // A value in the set may only occur once -> This is used to record which levels have been completed, thus preventing feedback from being triggered repeatedly
    // mdn doc: Web/JavaScript/Reference/Global_Objects/Set
    completedLevels: new Set(),
  };


  /* =========================
  Chapter Management
  ========================= */

  /*
   Show a specific chapter by index.

   All chapter transitions use the same pacing:
   1. Current chapter fades/slides out
   2. Next chapter fades in as a blank page
   3. Narration appears centered
   4. Narration rises away while the scene fades in

   Design rationale:
   A consistent transition language makes the experience feel less like separate mini-games and more like one continuous emotional journey.
   */
  function goToChapter(index) {
    if (index < 0 || index >= state.totalChapters) return;

    const current = document.querySelector('.chapter.active');
    const next    = document.querySelector(`.chapter[data-chapter="${index}"]`);

    if (!next || current === next) return;

    if (current) {
      current.classList.add('exiting');
      current.classList.remove('active');
      // setTimeout() -> function() will be executed in 4s
      // mdn doc: Web/API/Window/setTimeout
      setTimeout(function () {
        current.classList.remove('exiting');
      }, 400);
    }

    next.style.opacity = '0';
    next.classList.add('active');
    state.currentChapter = index;
    prepareChapterStage(next);

    setTimeout(function () {
      next.style.transition = 'opacity 0.6s ease';
      next.style.opacity    = '1';
      setTimeout(function () {
        next.style.transition = '';
        next.style.opacity    = '';
      }, 650);
    }, 50);

    runChapterIntro(next, 1200, 3200);
  }

  function prepareChapterStage(chapterEl) {
    const overlay = chapterEl.querySelector('.narration-overlay');
    const stage = chapterEl.querySelector('.chapter-stage');

    if (overlay) {
      overlay.classList.remove('rising', 'visible');
    }

    if (stage) {
      stage.classList.remove('visible');
    }
  }

  function runChapterIntro(chapterEl, overlayDelay, revealDelay) {
    const overlay = chapterEl.querySelector('.narration-overlay');
    const stage = chapterEl.querySelector('.chapter-stage');

    if (!overlay || !stage) {
      return;
    }

    setTimeout(function () {
      overlay.classList.add('visible');
    }, overlayDelay);

    setTimeout(function () {
      overlay.classList.add('rising');
      stage.classList.add('visible');
    }, revealDelay);
  }

  /*
   Called by individual level scripts when their task is complete.
   Reveals the feedback panel, then shows the page-turn handle.
   */
  function completeLevel(levelNumber) {
    if (state.completedLevels.has(levelNumber)) return;
    state.completedLevels.add(levelNumber);

    const feedback = document.getElementById(`feedback-${levelNumber}`);
    const turnHandle = document.getElementById(`turn-${levelNumber}`);
    const stage = document.getElementById(`chapter-inner-${levelNumber}`);

    if (stage) {
      stage.classList.add('level-complete');
    }

    // Reveal feedback panel with animation
    if (feedback) {
      feedback.classList.remove('hidden');
      // Small delay so the removal of 'hidden' triggers the CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          feedback.classList.add('visible');
        });
      });
    }

    // Show page-turn handle after feedback appears
    // Delay so user reads the feedback before seeing "continue"
    setTimeout(() => {
      if (turnHandle) {
        turnHandle.classList.remove('hidden');
      }
    }, 800);
  }

  // Expose completeLevel globally so level scripts can call it
  window.completeLevel = completeLevel;


  /* =========================
  Page-turn Drag Interaction
  ========================= */
  // Each .page-turn element is a drag target.
  // User drags upward -> THRESHOLD px to advance to next chapter.

  const DRAG_THRESHOLD = 60; // px upward drag needed to trigger advance

  function initPageTurns() {
    const pageTurns = document.querySelectorAll('.page-turn');

    pageTurns.forEach(function (el) {
      let isDragging = false;
      let startY = 0;
      let currentDeltaY = 0;
      const targetChapter = parseInt(el.dataset.target, 10);

      /* =========================
      Mouse events(drag action)
      ========================= */
      el.addEventListener('mousedown', function (e) {
        isDragging = true;
        startY = e.clientY;
        el.classList.add('dragging');
        e.preventDefault();
      });

      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        currentDeltaY = startY - e.clientY; // positive = dragging up

        // Visual feedback: handle moves up slightly as user drags
        const clampedDelta = Math.min(currentDeltaY, DRAG_THRESHOLD);
        if (clampedDelta > 0) {
          el.style.transform = `translateY(-${clampedDelta * 0.3}px)`;
        }
      });

      document.addEventListener('mouseup', function () {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        el.style.transform = '';

        // If dragged far enough upward, advance to next chapter
        if (currentDeltaY >= DRAG_THRESHOLD) {
          goToChapter(targetChapter);
        }

        currentDeltaY = 0;
      });

      /* =========================
      Touch Events (mobile support)
      ========================= */
      el.addEventListener('touchstart', function (e) {
        isDragging = true;
        startY = e.touches[0].clientY;
        el.classList.add('dragging');
      }, { passive: true });

      el.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        currentDeltaY = startY - e.touches[0].clientY;
        const clampedDelta = Math.min(currentDeltaY, DRAG_THRESHOLD);
        if (clampedDelta > 0) {
          el.style.transform = `translateY(-${clampedDelta * 0.3}px)`;
        }
      }, { passive: true });

      el.addEventListener('touchend', function () {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        el.style.transform = '';

        if (currentDeltaY >= DRAG_THRESHOLD) {
          goToChapter(targetChapter);
        }

        currentDeltaY = 0;
      });
    });
  }
  /*
   isOverlapping(rect1, rect2, threshold)
   Returns true if two DOMRects overlap by at least threshold%.
   Used by level scripts to check if an item landed on a drop zone.

   Design rationale: exact center-point detection feels finicky.
   Overlap detection is more forgiving and feels more natural —
   like actually placing something on a surface.
   */
  function isOverlapping(rect1, rect2, threshold) {
    threshold = threshold || 0.4; // 40% overlap required by default
    const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    const overlapArea = overlapX * overlapY;
    const smallerArea = Math.min(
      (rect1.right - rect1.left) * (rect1.bottom - rect1.top),
      (rect2.right - rect2.left) * (rect2.bottom - rect2.top)
    );
    return overlapArea / smallerArea >= threshold;
  }

  window.isOverlapping = isOverlapping;


  /* =========================
   Init
   ========================= */
  function init() {
    // Show the first chapter
    goToChapter(0);
    // Set up all page-turn drag handles
    initPageTurns();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
