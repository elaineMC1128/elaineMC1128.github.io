/* =========================
   Get page elements
   ========================= */

const app = document.getElementById("app");
const audio = document.getElementById("audio-player");

const themeBtn = document.getElementById("theme-btn");
const themeIcon = document.getElementById("theme-icon");
const themePanel = document.getElementById("theme-panel");
const themeCardList = document.getElementById("theme-card-list");
const themePrevBtn = document.getElementById("theme-prev-btn");
const themeNextBtn = document.getElementById("theme-next-btn");

const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const playPauseBtn = document.getElementById("play-pause-btn");
const playPauseImg = document.getElementById("play-pause-img");
const randomBtn = document.getElementById("shuffle-btn");

const volumeBtn = document.getElementById("volume-btn");
const volumeIcon = document.getElementById("volume-icon");
const volumePanel = document.getElementById("volume-panel");
const volumeSlider = document.getElementById("volume-slider");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");

const hideToggle = document.getElementById("hide-toggle");
const hideSecondsInput = document.getElementById("hide-seconds-input");

const clockToggle = document.getElementById("clock-toggle");
const shortcutToggle = document.getElementById("shortcut-toggle");
const clockDisplay = document.getElementById("clock-display");

const fullscreenBtn = document.getElementById("fullscreen");


/* =========================
   All theme data is stored in the "themes" array. 
   Each theme has an id, title, subtitle, artist, background image, music file, and icon. 
   This structure allows for easy management and expansion of themes in the future, rather than modify the HTML as well.
   ========================= */

const themes = [
  {
    id: "chill",
   /*  
   Attribution text：

    Music by: bensound.com
    License code: ZP0JAXO72NCL5QRY
    Artist: : Yunior Arronte 
    */
    title: "Fireside Chat",
    subtitle: "Soft Break",
    artist: "Yunior Arronte",
    bg: "assets/theme/chill/bg.gif",
    music: "assets/theme/chill/audio.mp3",
    icon: "assets/theme/chill/icon.png",
  },
  {
    id: "focus",
    // music download from media source of assignment2
    title: "Ambient Wave",
    subtitle: "Focus Study",
    artist: "Erokia",
    bg: "assets/theme/focus/bg.gif",
    music: "assets/theme/focus/audio.mp3",
    icon: "assets/theme/focus/icon.png",
  },
  {
    id: "relax",
    /* 
    Music I use: Bensound.com
    License code: UL79S3V8MWPAQAIP
    Artist: : Aventure 
    */
    title: "Longnight",
    subtitle: "Relaxing Mood",
    artist: "Aventure",
    bg: "assets/theme/relax/bg.gif",
    music: "assets/theme/relax/audio.mp3",
    icon: "assets/theme/relax/icon.png",
  },
  {
    id: "jazzy",
    // Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6402">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6402">Pixabay</a>
    title: "Pixabay",
    subtitle: "Chill Night",
    artist: "freesound_community",
    bg: "assets/theme/jazzy/bg.gif",
    music: "assets/theme/jazzy/audio.mp3",
    icon: "assets/theme/jazzy/icon.png",
  },
];


/* =========================
   Playing state
   ========================= */

let currentThemeIndex = 0; // The first item in the array is the default theme when the page loads
let previousVolume = 0.7; // Default volume level (70%)

audio.volume = 0.7;


/* =========================
   Initialization page, run the functions below
   ========================= */

renderThemeCards();
loadTheme(currentThemeIndex);


/* =========================
   Automatically generate theme cards
   ========================= */

// I asked ChatGPT to write this function for me, and I made some modifications to fit my needs.
function renderThemeCards() {
  themeCardList.innerHTML = ""; // Clear existing cards

  // I learn forEach loop from mdn webdocs, and I think it's more clear than for loop in this case, so I use it to loop through the themes array and create a card for each theme.
  themes.forEach((theme, index) => {
    const card = document.createElement("button"); // create a new button

    card.className = "theme-card"; // add the class "theme-card" to the button, so it can be styled in CSS
    card.style.backgroundImage = `url("${theme.bg}")`;
    card.dataset.index = index;

    card.innerHTML = `
      <h3>${theme.title}</h3>
      <p>${theme.subtitle}</p>
    `;

    card.addEventListener("click", () => {
      currentThemeIndex = index;
      loadTheme(currentThemeIndex);
      closeSmallPanels(); // close the theme panel after selecting a theme

      audio.play(); // start playing the music when a theme is selected
      setPauseIcon(); // change the play button to pause button when a theme is selected and starts playing
    });

    themeCardList.appendChild(card); // add the card to the themeCardList container in the HTML
  });
}


/* =========================
  Loading themes: 
  A theme = background + music + title
   ========================= */

// load the theme based on the currentThemeIndex
function loadTheme(index) {
  const theme = themes[index];
  app.style.backgroundImage = `url("${theme.bg}")`;
  audio.src = theme.music;
  trackTitle.textContent = theme.title;
  trackArtist.textContent = theme.artist;
  themeIcon.src = theme.icon;
  themeIcon.alt = `${theme.subtitle} icon`;

  updateActiveThemeCard();
}

// update the active state of the theme cards based on the currentThemeIndex
function updateActiveThemeCard() {
  const cards = document.querySelectorAll(".theme-card"); // select all theme cards

  // loop through the cards and toggle the "active" class based on whether the card's index matches the currentThemeIndex
  cards.forEach((card, index) => {
    // I searched and learned the usage of classList.toggle() method on mdn web docs (Web > Web API > DOMTokenList: toggle() method), and I think it's a cleaner way to add or remove the "active" class based on the condition.
    card.classList.toggle("active", index === currentThemeIndex);  
  });
}


/* =========================
  Theme panel
   ========================= */

themeBtn.addEventListener("click", () => {
  togglePanel(themePanel); // toggle the visibility of the theme panel when the theme button is clicked
});

themePrevBtn.addEventListener("click", () => {
  playPreviousTheme();
});

themeNextBtn.addEventListener("click", () => {
  playNextTheme();
});


/* =========================
   play / pause
   ========================= */

playPauseBtn.addEventListener("click", togglePlayPause); //I want this function to be called when the play/pause button is clicked by the user, so I used 'togglePlayPause', but not 'togglePlayPause()'.

function togglePlayPause() {
  if (audio.paused) {
    audio.play();
    setPauseIcon();
  } else {
    audio.pause();
    setPlayIcon();
  }
}

function setPlayIcon() {
  playPauseImg.src = "assets/icon/play.png";
  playPauseImg.alt = "play-btn";
}

function setPauseIcon() {
  playPauseImg.src = "assets/icon/pause.png";
  playPauseImg.alt = "pause-btn";
}


/* =========================
   previous / next theme
   ========================= */

nextBtn.addEventListener("click", playNextTheme);
prevBtn.addEventListener("click", playPreviousTheme);

function playNextTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length; // This formula ensures that the index wraps around correctly when going to the next theme, so when it reaches the end of the array, it will go back to the first item (index 0).

  loadTheme(currentThemeIndex);
  audio.play();
  setPauseIcon();
}

function playPreviousTheme() {
  currentThemeIndex =
    (currentThemeIndex - 1 + themes.length) % themes.length; // This formula ensures that the index wraps around correctly when going to the previous theme, even if the current index is 0.

  loadTheme(currentThemeIndex);
  audio.play();
  setPauseIcon();
}


/* =========================
   Random theme
   ========================= */

randomBtn.addEventListener("click", () => {
  let randomIndex = Math.floor(Math.random() * themes.length); // Generate a random index between 0 and themes.length - 1
  
  // If there is more than one theme, ensure the random index is different from the current theme index to avoid repeating the same theme.
  if (themes.length > 1) {
    while (randomIndex === currentThemeIndex) {
      randomIndex = Math.floor(Math.random() * themes.length);
    }
  }

  currentThemeIndex = randomIndex;
  loadTheme(currentThemeIndex);

  audio.play();
  setPauseIcon();
});


/* =========================
    Volume control
     - double click volume button to toggle mute/unmute
     - volume icon changes based on current volume state
   ========================= */

// click volume button to toggle volume panel
volumeBtn.addEventListener("click", () => {
  togglePanel(volumePanel);
});

// slide volume slider to adjust volume
// I asked ChatGPT how to make a volume slider and use it, and I learned the usage of input event from mdn web docs (Web > Web APIs > Element > input event), and I think it's more suitable for this case than change event, because it will trigger immediately when the slider value changes, rather than waiting until the user releases the slider.
volumeSlider.addEventListener("input", () => {
  audio.volume = Number(volumeSlider.value);
  if (audio.volume === 0) {
    volumeIcon.src = "assets/icon/no_audio.png";
    volumeIcon.alt = "mute-btn";
  } else {
    previousVolume = audio.volume;
    volumeIcon.src = "assets/icon/audio.png";
    volumeIcon.alt = "audio-btn";
  }
});

// I asked ChatGPT how to toggle mute/unmute by double clicking the volume button, and I learned the usage of dblclick event.
volumeBtn.addEventListener("dblclick", () => {
  toggleMute();
});

function toggleMute() {
  if (audio.volume > 0) {
    previousVolume = audio.volume;
    audio.volume = 0;
    volumeSlider.value = 0;

    volumeIcon.src = "assets/icon/no_audio.png";
    volumeIcon.alt = "mute-btn";
  } else {
    audio.volume = previousVolume;
    volumeSlider.value = previousVolume;

    volumeIcon.src = "assets/icon/audio.png";
    volumeIcon.alt = "audio-btn";
  }
}


/* =========================
   Settings panel
   ========================= */

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.remove("hidden");
  // When the settings panel is opened, we want to make sure that any other small panels (like theme or volume) are closed, so the user can focus on the settings without distractions.
  closeSmallPanels();
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});


/* =========================
   Settings - hide UI automatically
   I asked ChatGPT how to implement the feature of hiding UI automatically after a period of inactivity. 
   I also learned the usage of setTimeout() and clearTimeout() functions from mdn web docs (Web > Web APIs > WindowOrWorkerGlobalScope > setTimeout() method), and I think it's a good way to achieve this feature by setting a timer that adds a "hide-ui" class to the body after a certain delay, and resetting the timer whenever there is user activity (like mouse movement or key press).
   ========================= */

let hideElementsEnabled = true;
let hideTimer = null;

hideToggle.addEventListener("click", () => {
  hideElementsEnabled = !hideElementsEnabled;
  hideToggle.classList.toggle("active", hideElementsEnabled);

  if (!hideElementsEnabled) {
    document.body.classList.remove("hide-ui");
    // To prevent the UI from hiding after the user has disabled the hide feature, we need to clear the existing timer when the feature is turned off. This ensures that if the user had previously set a timer for hiding the UI, it will be canceled and the UI will remain visible.
    clearTimeout(hideTimer);
  }
});

// reset the hide timer whenever there is user activity (like mouse movement or key press)
document.addEventListener("mousemove", resetHideTimer);
document.addEventListener("keydown", resetHideTimer);

function resetHideTimer() {
  document.body.classList.remove("hide-ui");

  if (!hideElementsEnabled) return;

  clearTimeout(hideTimer);

  let hideDelay = Number(hideSecondsInput.value) * 1000;

  if (!hideDelay || hideDelay < 1000) {
    hideDelay = 30000;
  }

  hideTimer = setTimeout(() => {
    document.body.classList.add("hide-ui");
  }, hideDelay);
}


/* =========================
   Settings - show clock
   ========================= */

// By default, the clock is hidden when the page loads, so we set clockEnabled to false initially. This way, the clock will only be shown when the user clicks the clock toggle button to enable it.
let clockEnabled = false; 

clockToggle.addEventListener("click", () => {
  clockEnabled = !clockEnabled;
  clockToggle.classList.toggle("active", clockEnabled);
  clockDisplay.classList.toggle("hidden", !clockEnabled);
});

// To keep the clock display updated in real-time, we use setInterval to call the updateClock function every second. This ensures that the clock will always show the current time accurately.
setInterval(updateClock, 1000);
updateClock();

function updateClock() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  clockDisplay.textContent = `${hours}:${minutes}`;
}


/* =========================
   Settings - shortcuts
   Space - play/pause ，M - mute/unmute
   ========================= */

// Because these two shortcuts are commonly used and can enhance the user experience, I want to make sure they are enabled by default when the page loads, so users can immediately use them without having to toggle them on in the settings. 
shortcutToggle.addEventListener("click", () => {
  shortcutsEnabled = !shortcutsEnabled;
  shortcutToggle.classList.toggle("active", shortcutsEnabled);
});

document.addEventListener("keydown", (event) => {
  if (!shortcutsEnabled) return;

  if (event.code === "Space") {
    event.preventDefault();
    togglePlayPause();
  }

  if (event.key.toLowerCase() === "m") {
    toggleMute();
  }
});


/* =========================
   Fullscreen feature
   ========================= */

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});


/* =========================
   Utility functions
   ========================= */

function togglePanel(panel) {
  const isHidden = panel.classList.contains("hidden");

  closeSmallPanels();

  if (isHidden) {
    panel.classList.remove("hidden");
  }
}

function closeSmallPanels() {
  themePanel.classList.add("hidden");
  volumePanel.classList.add("hidden");
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}