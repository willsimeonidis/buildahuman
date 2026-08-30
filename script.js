// ===== BASIC SETUP =====
const characterContainer = document.getElementById("character-container");
const cameraControls = {
    rotateLeft: document.getElementById("cam-rotate-left"),
    rotateRight: document.getElementById("cam-rotate-right"),
    zoomIn: document.getElementById("cam-zoom-in"),
    zoomOut: document.getElementById("cam-zoom-out"),
    panUp: document.getElementById("cam-pan-up"),
    panDown: document.getElementById("cam-pan-down"),
    panLeft: document.getElementById("cam-pan-left"),
    panRight: document.getElementById("cam-pan-right"),
    reset: document.getElementById("cam-reset")
};

const topButtons = {
    refresh: document.getElementById("refresh-character"),
    reset: document.getElementById("reset-character"),
    randomise: document.getElementById("randomise-character"),
    boy: document.getElementById("boy-btn"),
    girl: document.getElementById("girl-btn")
};

const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const commandBox = document.getElementById("command-box");

// sliders
const sliders = {
    bodyHeight: document.getElementById("body-height"),
    bodyWidth: document.getElementById("body-width"),
    armLength: document.getElementById("arm-length"),
    legLength: document.getElementById("leg-length"),
    eyeSize: document.getElementById("eye-size"),
    mouthSize: document.getElementById("mouth-size"),
    noseSize: document.getElementById("nose-size"),
    emotionLevel: document.getElementById("emotion-level")
};

// camera state
let camRotateY = 0;
let camScale = 1;
let camTranslateX = 0;
let camTranslateY = 0;

// idle timer
let idleTimer = null;
const IDLE_TIME_MS = 5000;

// ===== SVG HUMAN (CARTOONY) =====
let currentGender = "boy";

function getHumanSVG(gender) {
    const skinColor = "#f5c49b";
    const hairColor = gender === "boy" ? "#3b2f2f" : "#4b2a5a";
    const shirtColor = "#4a90e2";
    const shortsColor = "#2ecc71";

    return `
    <svg id="human-svg" width="300" height="400" viewBox="0 0 300 400">
        <!-- BODY GROUP -->
        <g id="body-group" transform="translate(150,200)">
            <!-- Torso -->
            <rect id="torso" x="-40" y="-40" width="80" height="120" fill="${shirtColor}" rx="20" />
            <!-- Neck -->
            <rect id="neck" x="-15" y="-60" width="30" height="20" fill="${skinColor}" rx="10" />
            <!-- Head -->
            <circle id="head" cx="0" cy="-100" r="40" fill="${skinColor}" />
            <!-- Hair -->
            <path id="hair" d="M -40 -110 Q 0 -150 40 -110 Q 0 -130 -40 -110" fill="${hairColor}" />

            <!-- Eyes -->
            <circle id="eye-left" cx="-15" cy="-105" r="5" fill="#000" />
            <circle id="eye-right" cx="15" cy="-105" r="5" fill="#000" />

            <!-- Mouth -->
            <path id="mouth" d="M -15 -85 Q 0 -75 15 -85" stroke="#b0413e" stroke-width="3" fill="none" />

            <!-- Arms -->
            <rect id="arm-left" x="-60" y="-40" width="20" height="90" fill="${skinColor}" rx="10" />
            <rect id="arm-right" x="40" y="-40" width="20" height="90" fill="${skinColor}" rx="10" />

            <!-- Legs -->
            <rect id="leg-left" x="-25" y="80" width="20" height="90" fill="${shortsColor}" rx="10" />
            <rect id="leg-right" x="5" y="80" width="20" height="90" fill="${shortsColor}" rx="10" />

            <!-- Base clothing (always on, appropriate) -->
            <rect id="underwear" x="-30" y="40" width="60" height="40" fill="#ffffff" rx="10" />
        </g>
    </svg>
    `;
}

function renderHuman() {
    characterContainer.innerHTML = getHumanSVG(currentGender);
    applyCameraTransform();
}

// ===== CAMERA TRANSFORMS =====
function applyCameraTransform() {
    const svg = document.getElementById("human-svg");
    if (!svg) return;
    svg.style.transform = `
        translate(${camTranslateX}px, ${camTranslateY}px)
        scale(${camScale})
        rotateY(${camRotateY}deg)
    `;
    svg.style.transformOrigin = "50% 50%";
}

// camera buttons
cameraControls.rotateLeft.addEventListener("click", () => {
    camRotateY -= 15;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.rotateRight.addEventListener("click", () => {
    camRotateY += 15;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.zoomIn.addEventListener("click", () => {
    camScale += 0.1;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.zoomOut.addEventListener("click", () => {
    camScale = Math.max(0.5, camScale - 0.1);
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.panUp.addEventListener("click", () => {
    camTranslateY -= 10;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.panDown.addEventListener("click", () => {
    camTranslateY += 10;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.panLeft.addEventListener("click", () => {
    camTranslateX -= 10;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.panRight.addEventListener("click", () => {
    camTranslateX += 10;
    applyCameraTransform();
    resetIdleTimer();
});

cameraControls.reset.addEventListener("click", () => {
    camRotateY = 0;
    camScale = 1;
    camTranslateX = 0;
    camTranslateY = 0;
    applyCameraTransform();
    resetIdleTimer();
});

// ===== TABS =====
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const target = tab.getAttribute("data-tab");
        tabContents.forEach(c => {
            c.classList.remove("active");
            if (c.id === target) c.classList.add("active");
        });

        resetIdleTimer();
    });
});

// ===== SLIDERS → MORPH =====
function updateBodyFromSliders() {
    const svg = document.getElementById("human-svg");
    if (!svg) return;

    const bodyGroup = document.getElementById("body-group");
    const torso = document.getElementById("torso");
    const armLeft = document.getElementById("arm-left");
    const armRight = document.getElementById("arm-right");
    const legLeft = document.getElementById("leg-left");
    const legRight = document.getElementById("leg-right");
    const head = document.getElementById("head");
    const eyeLeft = document.getElementById("eye-left");
    const eyeRight = document.getElementById("eye-right");
    const mouth = document.getElementById("mouth");
    const noseSize = sliders.noseSize.value;
    const emotion = sliders.emotionLevel.value;

    const heightVal = sliders.bodyHeight.value;   // 0–100
    const widthVal = sliders.bodyWidth.value;
    const armVal = sliders.armLength.value;
    const legVal = sliders.legLength.value;
    const eyeVal = sliders.eyeSize.value;
    const mouthVal = sliders.mouthSize.value;

    // torso height/width
    const torsoWidth = 40 + (widthVal - 50) * 0.6;  // base 40
    const torsoHeight = 80 + (heightVal - 50) * 0.8; // base 80
    torso.setAttribute("x", -torsoWidth);
    torso.setAttribute("width", torsoWidth * 2);
    torso.setAttribute("height", torsoHeight);

    // arms length
    const armLengthPx = 70 + (armVal - 50) * 1.2;
    armLeft.setAttribute("height", armLengthPx);
    armRight.setAttribute("height", armLengthPx);

    // legs length
    const legLengthPx = 70 + (legVal - 50) * 1.5;
    legLeft.setAttribute("height", legLengthPx);
    legRight.setAttribute("height", legLengthPx);

    // head size
    const headRadius = 30 + (heightVal - 50) * 0.3;
    head.setAttribute("r", headRadius);

    // eye size
    const eyeRadius = 3 + (eyeVal - 50) * 0.1;
    eyeLeft.setAttribute("r", eyeRadius);
    eyeRight.setAttribute("r", eyeRadius);

    // mouth size (curve)
    const mouthWidth = 10 + (mouthVal - 50) * 0.3;
    mouth.setAttribute("d", `M -${mouthWidth} -85 Q 0 -75 ${mouthWidth} -85`);

    // nose (simple: move neck height slightly)
    const neck = document.getElementById("neck");
    neck.setAttribute("height", 20 + (noseSize - 50) * 0.1);

    // emotion → mouth curve up/down
    const emotionOffset = (emotion - 50) * 0.1; // -5 to +5
    mouth.setAttribute("d", `M -${mouthWidth} ${-85 + emotionOffset} Q 0 ${-75 - emotionOffset} ${mouthWidth} ${-85 + emotionOffset}`);

    // morph animation (simple scale pulse)
    bodyGroup.style.transition = "transform 0.2s ease";
    bodyGroup.style.transform = "scale(1.02)";
    setTimeout(() => {
        bodyGroup.style.transform = "scale(1)";
    }, 200);
}

Object.values(sliders).forEach(slider => {
    slider.addEventListener("input", () => {
        updateBodyFromSliders();
        resetIdleTimer();
    });
});

// ===== TEXT COMMAND BOT =====
function applyCommand(text) {
    const cmd = text.toLowerCase();

    if (cmd.includes("make arms longer")) {
        sliders.armLength.value = 90;
    }
    if (cmd.includes("make arms shorter")) {
        sliders.armLength.value = 10;
    }
    if (cmd.includes("make legs longer")) {
        sliders.legLength.value = 90;
    }
    if (cmd.includes("make legs shorter")) {
        sliders.legLength.value = 10;
    }
    if (cmd.includes("make everything exaggerated")) {
        sliders.bodyHeight.value = 90;
        sliders.bodyWidth.value = 90;
        sliders.armLength.value = 90;
        sliders.legLength.value = 90;
        sliders.eyeSize.value = 90;
        sliders.mouthSize.value = 90;
        sliders.noseSize.value = 90;
    }
    if (cmd.includes("normalize") || cmd.includes("make everything normal")) {
        sliders.bodyHeight.value = 50;
        sliders.bodyWidth.value = 50;
        sliders.armLength.value = 50;
        sliders.legLength.value = 50;
        sliders.eyeSize.value = 50;
        sliders.mouthSize.value = 50;
        sliders.noseSize.value = 50;
        sliders.emotionLevel.value = 50;
    }
    if (cmd.includes("happy")) {
        sliders.emotionLevel.value = 80;
    }
    if (cmd.includes("sad")) {
        sliders.emotionLevel.value = 20;
    }

    updateBodyFromSliders();
}

commandBox.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        applyCommand(commandBox.value);
        commandBox.value = "";
        resetIdleTimer();
    }
});

// ===== TOP BAR BUTTONS =====
topButtons.boy.addEventListener("click", () => {
    currentGender = "boy";
    topButtons.boy.classList.add("active");
    topButtons.girl.classList.remove("active");
    renderHuman();
    updateBodyFromSliders();
    resetIdleTimer();
});

topButtons.girl.addEventListener("click", () => {
    currentGender = "girl";
    topButtons.girl.classList.add("active");
    topButtons.boy.classList.remove("active");
    renderHuman();
    updateBodyFromSliders();
    resetIdleTimer();
});

topButtons.refresh.addEventListener("click", () => {
    renderHuman();
    updateBodyFromSliders();
    resetIdleTimer();
});

topButtons.reset.addEventListener("click", () => {
    const sure = confirm("Are you sure you want to reset everything?");
    if (!sure) return;

    Object.values(sliders).forEach(s => s.value = 50);
    camRotateY = 0;
    camScale = 1;
    camTranslateX = 0;
    camTranslateY = 0;
    currentGender = "boy";
    topButtons.boy.classList.add("active");
    topButtons.girl.classList.remove("active");
    renderHuman();
    updateBodyFromSliders();
    resetIdleTimer();
});

topButtons.randomise.addEventListener("click", () => {
    Object.values(sliders).forEach(s => s.value = Math.floor(Math.random() * 101));
    updateBodyFromSliders();
    resetIdleTimer();
});

// ===== IDLE ANIMATIONS =====
function startIdleAnimation() {
    const bodyGroup = document.getElementById("body-group");
    if (!bodyGroup) return;

    bodyGroup.style.animation = "breathe 2s infinite";
    const head = document.getElementById("head");
    if (head) head.style.animation = "blink 3s infinite";
}

function stopIdleAnimation() {
    const bodyGroup = document.getElementById("body-group");
    if (!bodyGroup) return;
    bodyGroup.style.animation = "none";

    const head = document.getElementById("head");
    if (head) head.style.animation = "none";
}

function resetIdleTimer() {
    stopIdleAnimation();
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        startIdleAnimation();
    }, IDLE_TIME_MS);
}

// add CSS keyframes via JS
const styleEl = document.createElement("style");
styleEl.innerHTML = `
@keyframes breathe {
    0% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0); }
}
@keyframes blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
}
`;
document.head.appendChild(styleEl);

// ===== INIT =====
renderHuman();
updateBodyFromSliders();
resetIdleTimer();
