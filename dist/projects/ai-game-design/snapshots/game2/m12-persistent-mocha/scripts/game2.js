"use strict";

const CATWALK_BUILD = "p4-yarn-life-20260731-1";
const VOID_RESPAWN_Y = 490;

const RITUAL_ACTION_HELP = Object.freeze({
  scratch: "PRESS J",
  jump: "PRESS W",
  squeeze: "HOLD K",
  loaf: "HOLD S",
  roll: "MOVE + L",
  climb: "HOLD SPACE",
});

const FULL_KEYBOARD_LAYOUT = {
  functionGroups: [
    [{ code: "Escape", label: "Esc" }],
    ["F1", "F2", "F3", "F4"].map((label) => ({ code: label, label })),
    ["F5", "F6", "F7", "F8"].map((label) => ({ code: label, label })),
    ["F9", "F10", "F11", "F12"].map((label) => ({ code: label, label })),
    [
      { code: "PrintScreen", label: "PrtSc" },
      { code: "ScrollLock", label: "ScrLk" },
      { code: "Pause", label: "Pause" },
    ],
  ],
  mainRows: [
    [
      { code: "Backquote", label: "` ~" },
      ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((label) => ({
        code: `Digit${label}`,
        label,
      })),
      { code: "Minus", label: "- _" },
      { code: "Equal", label: "= +" },
      { code: "Backspace", label: "Backspace", units: 2 },
    ],
    [
      { code: "Tab", label: "Tab", units: 1.5 },
      ...["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((label) => ({
        code: `Key${label}`,
        label,
        key: label.toLowerCase(),
      })),
      { code: "BracketLeft", label: "[ {" },
      { code: "BracketRight", label: "] }" },
      { code: "Backslash", label: "\\ |", units: 1.5 },
    ],
    [
      { code: "CapsLock", label: "Caps Lock", units: 1.75 },
      ...["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((label) => ({
        code: `Key${label}`,
        label,
        key: label.toLowerCase(),
      })),
      { code: "Semicolon", label: "; :" },
      { code: "Quote", label: "' \"" },
      { code: "Enter", label: "Enter", units: 2.25 },
    ],
    [
      { code: "ShiftLeft", label: "Shift", units: 2.25 },
      ...["Z", "X", "C", "V", "B", "N", "M"].map((label) => ({
        code: `Key${label}`,
        label,
        key: label.toLowerCase(),
      })),
      { code: "Comma", label: ", <" },
      { code: "Period", label: ". >" },
      { code: "Slash", label: "/ ?" },
      { code: "ShiftRight", label: "Shift", units: 2.75 },
    ],
    [
      { code: "ControlLeft", label: "Ctrl", units: 1.25 },
      { code: "MetaLeft", label: "Win", units: 1.25 },
      { code: "AltLeft", label: "Alt", units: 1.25 },
      { code: "Space", label: "", units: 6.25, key: "space" },
      { code: "AltRight", label: "Alt", units: 1.25 },
      { code: "Fn", label: "Fn" },
      { code: "ContextMenu", label: "Menu" },
      { code: "ControlRight", label: "Ctrl", units: 1.25 },
    ],
  ],
  navigation: {
    six: [
      { code: "Insert", label: "Insert" },
      { code: "Home", label: "Home" },
      { code: "PageUp", label: "PgUp" },
      { code: "Delete", label: "Delete" },
      { code: "End", label: "End" },
      { code: "PageDown", label: "PgDn" },
    ],
    arrows: [
      { code: "ArrowUp", label: "↑", key: "arrowup" },
      { code: "ArrowLeft", label: "←", key: "arrowleft" },
      { code: "ArrowDown", label: "↓", key: "arrowdown" },
      { code: "ArrowRight", label: "→", key: "arrowright" },
    ],
  },
  numpad: [
    { code: "NumLock", label: "Num" },
    { code: "NumpadDivide", label: "/" },
    { code: "NumpadMultiply", label: "*" },
    { code: "NumpadSubtract", label: "-" },
    { code: "Numpad7", label: "7" },
    { code: "Numpad8", label: "8" },
    { code: "Numpad9", label: "9" },
    { code: "NumpadAdd", label: "+", gridColumn: "4", gridRow: "2 / span 2" },
    { code: "Numpad4", label: "4" },
    { code: "Numpad5", label: "5" },
    { code: "Numpad6", label: "6" },
    { code: "Numpad1", label: "1" },
    { code: "Numpad2", label: "2" },
    { code: "Numpad3", label: "3" },
    { code: "NumpadEnter", label: "Enter", gridColumn: "4", gridRow: "4 / span 2" },
    { code: "Numpad0", label: "0", gridColumn: "1 / span 2" },
    { code: "NumpadDecimal", label: "." },
  ],
};

function flattenKeyboardLayout(layout = FULL_KEYBOARD_LAYOUT) {
  return [
    ...layout.functionGroups.flat(),
    ...layout.mainRows.flat(),
    ...layout.navigation.six,
    ...layout.navigation.arrows,
    ...layout.numpad,
  ];
}

function resolvePrototypeInput(input) {
  const blockedKeys = new Set(input.blockedKeys || []);
  const heldKeys = new Set(input.heldKeys || []);
  const active = (key) => !blockedKeys.has(key) && (heldKeys.has(key) || Boolean(input[key]));

  const left = active("a") || active("arrowLeft");
  const right = active("d") || active("arrowRight");
  const anchor = active("s");

  return {
    horizontal: anchor || left === right ? 0 : left ? -1 : 1,
    jump: active("w") || active("arrowUp"),
    swipe: active("j"),
    squeeze: active("k"),
    climb: active("space"),
    roll: active("l"),
    anchor,
  };
}

function shouldRespawnFromFall(playerY) {
  return playerY > VOID_RESPAWN_Y;
}

function resolveThreatContact({
  type = "mouse",
  rolling = false,
  swiping = false,
  squeezing = false,
  loafing = false,
}) {
  if (type === "mouse" && (rolling || swiping)) {
    return rolling ? "roll-hit" : "scratch-hit";
  }
  if (type === "pigeon" && squeezing) {
    return "pigeon-passed";
  }
  if (type === "pigeon" && swiping) {
    return "pigeon-scattered";
  }
  if (type === "dog" && loafing) {
    return "dog-calmed";
  }
  return "hit";
}

function resolveYarnDeath(yarnShield = 0) {
  const protectedDeath = Number(yarnShield) > 0;
  return {
    protected: protectedDeath,
    yarnShield: protectedDeath ? 0 : Number(yarnShield) || 0,
  };
}

const CATWALK_LEVEL_DATA = typeof module !== "undefined" && module.exports
  ? require("./game2-level-data.js")
  : globalThis.CATWALK_LEVEL_DATA;

if (!CATWALK_LEVEL_DATA) {
  throw new Error("Catwalk level data failed to load.");
}

const { LEVEL_GALLERY, LEVEL_ACTORS } = CATWALK_LEVEL_DATA;

const CAT_SKILL_ROUTE = Object.freeze({
  worldWidth: 1840,
  jumpGapWidth: 80,
  estimatedJumpRange: 190,
  estimatedRollRange: 270,
  standingVisualHeight: 36,
  squeezeVisualHeight: 18,
  tunnelClearance: 28,
  tunnelCollisionModel: "visual-roof-with-conditional-gates",
  tunnelLeftGateX: 667,
  tunnelRightGateX: 873,
  tunnelSqueezeMinX: 655,
  tunnelSqueezeMaxX: 885,
  tunnelSqueezeMinY: 395,
  wallHeight: 170,
  estimatedJumpRise: 90,
  estimatedRollRise: 38,
  stormStart: 980,
  stormEnd: 1080,
  climbMinX: 1100,
  climbMaxX: 1185,
  climbMinY: 245,
  climbMaxY: 470,
  exitX: 1740,
});

function isInsideClimbZone(x, y, route = CAT_SKILL_ROUTE) {
  return x >= route.climbMinX
    && x <= route.climbMaxX
    && y >= route.climbMinY
    && y <= route.climbMaxY;
}

function shouldRemainSqueezed(inputHeld, wasSqueezing, x, y, route = CAT_SKILL_ROUTE) {
  if (inputHeld) {
    return true;
  }
  const insideLowClearance = x >= route.tunnelSqueezeMinX
    && x <= route.tunnelSqueezeMaxX
    && y >= route.tunnelSqueezeMinY;
  return wasSqueezing && insideLowClearance;
}

function canPassTunnelGate(squeezing) {
  return Boolean(squeezing);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CAT_SKILL_ROUTE,
    CATWALK_BUILD,
    VOID_RESPAWN_Y,
    FULL_KEYBOARD_LAYOUT,
    LEVEL_GALLERY,
    LEVEL_ACTORS,
    RITUAL_ACTION_HELP,
    canPassTunnelGate,
    flattenKeyboardLayout,
    isInsideClimbZone,
    resolvePrototypeInput,
    resolveThreatContact,
    resolveYarnDeath,
    shouldRespawnFromFall,
    shouldRemainSqueezed,
  };
}

function startCatwalkPrototype() {
  const keyboardElement = document.querySelector("#prototype-keyboard");
  const keyboardLayoutElement = document.querySelector("#full-keyboard-layout");
  const statusElement = document.querySelector("#prototype-status");
  const restartButton = document.querySelector("#restart-prototype");
  const previousButton = document.querySelector("#previous-level");
  const nextButton = document.querySelector("#next-level");

  if (!window.Phaser
    || !keyboardElement
    || !keyboardLayoutElement
    || !statusElement
    || !restartButton
    || !previousButton
    || !nextButton) {
    return;
  }

  const createKeyElement = (definition) => {
    const key = document.createElement("kbd");
    key.dataset.code = definition.code;
    key.textContent = definition.label;
    key.setAttribute("aria-label", definition.label || "Space");
    key.style.setProperty("--key-units", definition.units || 1);
    if (definition.key) {
      key.dataset.key = definition.key;
    }
    if (definition.gridColumn) {
      key.style.gridColumn = definition.gridColumn;
    }
    if (definition.gridRow) {
      key.style.gridRow = definition.gridRow;
    }
    if (["w", "a", "s", "d", "j", "k", "l", "space", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(definition.key)) {
      key.classList.add("key-playing");
    }
    if (definition.label.length > 3) {
      key.classList.add("key-legend-corner");
    }
    return key;
  };

  const createRow = (definitions, className = "keyboard-row") => {
    const row = document.createElement("div");
    row.className = className;
    definitions.forEach((definition) => row.append(createKeyElement(definition)));
    return row;
  };

  const buildFullKeyboard = () => {
    const fragment = document.createDocumentFragment();
    const functionRow = document.createElement("div");
    functionRow.className = "keyboard-function-row";
    FULL_KEYBOARD_LAYOUT.functionGroups.forEach((group) => {
      functionRow.append(createRow(group, "keyboard-function-group"));
    });

    const body = document.createElement("div");
    body.className = "keyboard-body";
    const main = document.createElement("div");
    main.className = "keyboard-main";
    FULL_KEYBOARD_LAYOUT.mainRows.forEach((row) => main.append(createRow(row)));

    const navigation = document.createElement("div");
    navigation.className = "keyboard-navigation";
    navigation.append(createRow(FULL_KEYBOARD_LAYOUT.navigation.six, "navigation-six"));
    navigation.append(createRow(FULL_KEYBOARD_LAYOUT.navigation.arrows, "navigation-arrows"));

    const numpad = createRow(FULL_KEYBOARD_LAYOUT.numpad, "keyboard-numpad");
    body.append(main, navigation, numpad);
    fragment.append(functionRow, body);
    keyboardLayoutElement.replaceChildren(fragment);
  };

  const positionPaws = () => {
    const keyboardRect = keyboardElement.getBoundingClientRect();
    const scaleX = keyboardRect.width / keyboardElement.offsetWidth;
    const scaleY = keyboardRect.height / keyboardElement.offsetHeight;
    keyboardElement.querySelectorAll(".paw[data-paw]").forEach((paw) => {
      const key = keyboardElement.querySelector(`[data-key="${paw.dataset.paw}"]`);
      if (!key) {
        return;
      }
      const keyRect = key.getBoundingClientRect();
      paw.style.setProperty("--paw-x", `${(keyRect.left - keyboardRect.left + keyRect.width / 2) / scaleX}px`);
      paw.style.setProperty("--paw-y", `${(keyRect.top - keyboardRect.top + keyRect.height / 2) / scaleY}px`);
      paw.style.setProperty("--paw-width", `${Math.max(10, keyRect.width / scaleX - 6)}px`);
      paw.style.setProperty("--paw-height", `${Math.max(8, keyRect.height / scaleY - 5)}px`);
    });
  };

  buildFullKeyboard();
  positionPaws();
  document.documentElement.dataset.catwalkBuild = CATWALK_BUILD;
  window.addEventListener("resize", positionPaws);

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const MOVE_SPEED = 245;
  const SQUEEZE_SPEED = 145;
  const JUMP_SPEED = 465;
  const CLIMB_SPEED = 220;
  const ROLL_SPEED = 520;
  const ROLL_LIFT = 300;
  const ROLL_DURATION = 520;

  class PrototypeScene extends Phaser.Scene {
    constructor() {
      super("PrototypeScene");
      this.pawStorm = false;
      this.completed = false;
      this.facing = 1;
      this.checkpoint = { x: 64, y: 430 };
      this.blockedKeys = [];
      this.heldKeys = [];
      this.lastAction = "none";
      this.squeezing = false;
      this.loafing = false;
      this.rolling = false;
      this.rollEndsAt = 0;
      this.levelIndex = 0;
    }

    init(data = {}) {
      if (Number.isInteger(data.levelIndex)) {
        this.levelIndex = (data.levelIndex + LEVEL_GALLERY.length) % LEVEL_GALLERY.length;
      }
      this.level = LEVEL_GALLERY[this.levelIndex];
    }

    create() {
      this.pawStorm = false;
      this.completed = false;
      this.facing = 1;
      this.checkpoint = { x: 64, y: 430 };
      this.blockedKeys = [];
      this.heldKeys = [];
      this.lastAction = "none";
      this.squeezing = false;
      this.loafing = false;
      this.rolling = false;
      this.rollEndsAt = 0;
      this.loafCharge = 0;
      this.loafSatisfied = false;
      this.ritualIndex = 0;
      this.ritualCharge = 0;
      this.ritualComplete = false;
      this.yarnShield = 0;
      this.enemyHitCooldownUntil = 0;
      this.actionLockUntil = 0;
      this.currentAction = "none";
      this.previousControls = {
        jump: false,
        swipe: false,
        squeeze: false,
        climb: false,
        roll: false,
        anchor: false,
      };

      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.setAttribute("aria-label", "Catwalk action platform game. Click to focus, then use the keyboard.");
      this.game.canvas.addEventListener("pointerdown", () => this.game.canvas.focus());

      keyboardElement.classList.remove("is-storm", "is-complete");
      keyboardElement.querySelectorAll("kbd").forEach((key) => {
        key.classList.remove("is-blocked", "is-held", "is-available");
      });
      statusElement.textContent = `Level ${this.level.id}: ${this.level.title}. ${this.level.hint}`;

      this.cameras.main.setBackgroundColor("#10191b");
      this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT + 160);
      this.physics.world.setBoundsCollision(true, true, true, false);
      this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

      this.createBackdrop();
      this.createCatTexture();
      this.createActorTextures();
      this.createGalleryLevel();
      this.createPlayer();
      this.createActors();
      this.createInterface();
      this.createInput();
      this.level.keys.forEach((key) => this.setKeyState(key, "is-available"));
      const alleyControlKeys = {
        mouse: ["j", "l"],
        pigeon: ["j", "k"],
        dog: ["s"],
      };
      new Set((this.actorPlan.enemies || [])
        .flatMap((enemy) => alleyControlKeys[enemy.type || "mouse"]))
        .forEach((key) => this.setKeyState(key, "is-available"));
      if (this.level.autoRight) {
        this.activateForcedRight();
      }
      this.publishState();

      restartButton.onclick = () => this.scene.restart({ levelIndex: this.levelIndex });
      previousButton.onclick = () => this.scene.restart({ levelIndex: this.levelIndex - 1 });
      nextButton.onclick = () => this.scene.restart({ levelIndex: this.levelIndex + 1 });
      this.input.keyboard.on("keydown-R", () => this.scene.restart({ levelIndex: this.levelIndex }));
    }

    createBackdrop() {
      this.add.rectangle(480, 270, 960, 540, 0x10191b);
      this.add.circle(782, 104, 88, 0xd7a764, 0.08);
      this.add.circle(830, 122, 128, 0xd7a764, 0.035);

      for (let index = 0; index < 20; index += 1) {
        const x = 34 + ((index * 149) % 900);
        const y = 38 + ((index * 83) % 220);
        this.add.circle(x, y, index % 3 === 0 ? 2 : 1, 0xc9ddd7, 0.28 + (index % 4) * 0.08);
      }

      this.add.rectangle(480, 486, 960, 108, 0x182324);
      this.add.rectangle(480, 441, 960, 2, 0x304143, 0.55);
      this.add.text(32, 28, "29-LEVEL CATWALK GALLERY", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#77898a",
        letterSpacing: 2,
      });
    }

    createCatTexture() {
      if (this.textures.exists("prototype-cat") && this.textures.exists("prototype-cat-squeeze")) {
        return;
      }

      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      if (!this.textures.exists("prototype-cat")) {
        graphics.fillStyle(0xd7c2a7, 1);
        graphics.fillTriangle(10, 13, 16, 1, 22, 15);
        graphics.fillTriangle(27, 14, 34, 1, 39, 17);
        graphics.fillRoundedRect(7, 12, 37, 27, 10);
        graphics.fillStyle(0x4c3b35, 1);
        graphics.fillCircle(18, 22, 3);
        graphics.fillCircle(34, 22, 3);
        graphics.fillRoundedRect(6, 31, 8, 9, 3);
        graphics.fillRoundedRect(36, 31, 8, 9, 3);
        graphics.lineStyle(5, 0xd7c2a7, 1);
        graphics.beginPath();
        graphics.moveTo(42, 29);
        graphics.lineTo(51, 23);
        graphics.lineTo(49, 13);
        graphics.strokePath();
        graphics.generateTexture("prototype-cat", 56, 44);
      }

      graphics.clear();
      if (!this.textures.exists("prototype-cat-squeeze")) {
        graphics.fillStyle(0xd7c2a7, 1);
        graphics.fillTriangle(8, 30, 14, 20, 19, 31);
        graphics.fillTriangle(31, 30, 37, 20, 42, 31);
        graphics.fillRoundedRect(5, 27, 43, 13, 6);
        graphics.fillStyle(0x4c3b35, 1);
        graphics.fillCircle(16, 32, 2);
        graphics.fillCircle(34, 32, 2);
        graphics.fillRoundedRect(6, 37, 10, 4, 2);
        graphics.fillRoundedRect(37, 37, 10, 4, 2);
        graphics.lineStyle(4, 0xd7c2a7, 1);
        graphics.beginPath();
        graphics.moveTo(45, 34);
        graphics.lineTo(53, 31);
        graphics.strokePath();
        graphics.generateTexture("prototype-cat-squeeze", 56, 44);
      }
      graphics.destroy();
    }

    createActorTextures() {
      if (
        this.textures.exists("prototype-yarn")
        && this.textures.exists("prototype-mouse")
        && this.textures.exists("prototype-pigeon")
        && this.textures.exists("prototype-dog")
      ) {
        return;
      }

      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      if (!this.textures.exists("prototype-yarn")) {
        graphics.fillStyle(0xd88aa5, 1);
        graphics.fillCircle(14, 14, 11);
        graphics.lineStyle(2, 0xf2bfd0, 0.9);
        graphics.strokeCircle(14, 14, 7);
        graphics.beginPath();
        graphics.moveTo(7, 9);
        graphics.lineTo(21, 18);
        graphics.moveTo(8, 18);
        graphics.lineTo(20, 8);
        graphics.strokePath();
        graphics.lineStyle(2, 0xd88aa5, 1);
        graphics.beginPath();
        graphics.moveTo(22, 19);
        graphics.lineTo(28, 24);
        graphics.strokePath();
        graphics.generateTexture("prototype-yarn", 30, 28);
      }

      graphics.clear();
      if (!this.textures.exists("prototype-mouse")) {
        graphics.fillStyle(0x89989a, 1);
        graphics.fillEllipse(16, 13, 25, 14);
        graphics.fillTriangle(24, 10, 32, 14, 24, 17);
        graphics.fillCircle(9, 7, 5);
        graphics.fillCircle(17, 7, 5);
        graphics.fillStyle(0xd8e0df, 1);
        graphics.fillCircle(27, 13, 2);
        graphics.lineStyle(2, 0x89989a, 1);
        graphics.beginPath();
        graphics.moveTo(4, 14);
        graphics.lineTo(0, 10);
        graphics.strokePath();
        graphics.generateTexture("prototype-mouse", 34, 22);
      }

      graphics.clear();
      if (!this.textures.exists("prototype-pigeon")) {
        graphics.fillStyle(0x83939f, 1);
        graphics.fillEllipse(18, 12, 22, 13);
        graphics.fillTriangle(15, 10, 3, 1, 10, 13);
        graphics.fillTriangle(20, 10, 31, 3, 25, 14);
        graphics.fillCircle(27, 9, 5);
        graphics.fillStyle(0xe4b16c, 1);
        graphics.fillTriangle(31, 9, 36, 11, 31, 12);
        graphics.fillCircle(29, 8, 1);
        graphics.generateTexture("prototype-pigeon", 38, 24);
      }

      graphics.clear();
      if (!this.textures.exists("prototype-dog")) {
        graphics.fillStyle(0x9b704f, 1);
        graphics.fillRoundedRect(4, 11, 34, 18, 6);
        graphics.fillCircle(38, 14, 10);
        graphics.fillTriangle(33, 6, 37, 0, 41, 8);
        graphics.fillTriangle(42, 7, 48, 2, 46, 12);
        graphics.fillRect(9, 26, 6, 10);
        graphics.fillRect(29, 26, 6, 10);
        graphics.fillStyle(0x352820, 1);
        graphics.fillCircle(46, 14, 2);
        graphics.fillCircle(40, 11, 1);
        graphics.lineStyle(3, 0x9b704f, 1);
        graphics.beginPath();
        graphics.moveTo(5, 16);
        graphics.lineTo(0, 10);
        graphics.strokePath();
        graphics.generateTexture("prototype-dog", 50, 38);
      }
      graphics.destroy();
    }

    createLevel() {
      this.platforms = [];
      this.crates = [];

      this.addPlatform(140, 505, 280, 70);
      this.addPlatform(670, 505, 620, 70);
      this.addPlatform(1050, 505, 140, 70, true);
      this.addPlatform(1360, 310, 360, 22);
      this.addPlatform(1650, 310, 220, 22);

      this.createCrate(205, 415, 48, 110, "J  SCRATCH");

      this.add.text(322, 448, "W  JUMP", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#c49c67",
        letterSpacing: 2,
      }).setOrigin(0.5);

      this.lowCeiling = this.add.rectangle(770, 355, 190, 174, 0x51443b)
        .setStrokeStyle(2, 0x9b8068, 0.72);
      this.tunnelGates = [
        this.addTunnelGate(CAT_SKILL_ROUTE.tunnelLeftGateX),
        this.addTunnelGate(CAT_SKILL_ROUTE.tunnelRightGateX),
      ];
      this.add.text(770, 454, "HOLD K  ·  LIQUID CAT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#c49c67",
        letterSpacing: 1,
      }).setOrigin(0.5);

      this.add.rectangle(1030, 468, 100, 3, 0xe1b777, 0.24);
      this.safeLabel = this.add.text(1030, 447, "PAW STORM ZONE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#8c7354",
        letterSpacing: 1,
      }).setOrigin(0.5);

      this.climbWall = this.addBlocker(1180, 385, 30, 170, 0x604a3b);
      this.add.text(1148, 350, "HOLD L", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#c4a1e4",
        letterSpacing: 1,
      }).setOrigin(1, 0.5);
      this.add.text(1207, 270, "CLAW CLIMB", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#9f83bd",
        letterSpacing: 1,
      }).setOrigin(0, 0.5);

      this.exitGlow = this.add.rectangle(1770, 253, 48, 94, 0xa6c98c, 0.14);
      this.exitDoor = this.add.rectangle(1770, 258, 38, 82, 0x293c32)
        .setStrokeStyle(2, 0x88af76, 0.9);
      this.add.circle(1759, 262, 3, 0xcfe2bd);
      this.add.text(1770, 202, "HOME?", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#9bb38b",
        letterSpacing: 2,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: this.exitGlow,
        alpha: { from: 0.12, to: 0.34 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    }

    createGalleryLevel() {
      this.platforms = [];
      this.crates = [];
      this.tunnelGates = [];
      this.tunnelBounds = [];
      this.climbZones = [];
      this.exitBarrier = null;
      this.loafGoal = null;
      this.safeLabel = null;
      this.ritual = this.level.ritual || [];
      this.ritualMarkers = [];

      this.createGround(this.level.gaps || []);
      (this.level.platforms || []).forEach(({ x, y, width }) => {
        this.addPlatform(x, y, width, 22);
      });
      (this.level.crates || []).forEach((x) => {
        this.createCrate(x, 415, 48, 110, "J  SCRATCH");
      });
      (this.level.tunnels || []).forEach((tunnel) => this.createTunnel(tunnel));
      (this.level.walls || []).forEach((wall) => this.createClimbWall(wall));
      if (this.ritual.length > 0) {
        this.createRitual();
      }

      if (this.level.loafGoal) {
        const { x, width } = this.level.loafGoal;
        this.loafGoal = { minX: x - width / 2, maxX: x + width / 2 };
        this.loafPad = this.add.rectangle(x, 468, width, 8, 0xe1b777, 0.72)
          .setStrokeStyle(2, 0xf0ca88, 0.85);
        this.add.text(x, 446, "HOLD S  ·  LOAF", {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#e7bd7f",
          letterSpacing: 1,
        }).setOrigin(0.5);
        this.exitBarrier = this.add.rectangle(872, 270, 18, 400, 0xe1b777, 0.1)
          .setStrokeStyle(2, 0xe1b777, 0.42);
        this.physics.add.existing(this.exitBarrier, true);
      }

      if (this.level.stormAt) {
        this.add.rectangle(this.level.stormAt, 468, 92, 3, 0xe1b777, 0.28);
        this.safeLabel = this.add.text(this.level.stormAt, 447, "PAW STORM", {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#9e805c",
          letterSpacing: 1,
        }).setOrigin(0.5);
      }

      const upperTop = (this.level.walls || []).reduce(
        (top, wall) => Math.min(top, 470 - wall.height),
        470,
      );
      const exitY = upperTop < 470 ? upperTop - 41 : 429;
      this.exitX = 912;
      this.exitGlow = this.add.rectangle(this.exitX, exitY - 5, 48, 94, 0xa6c98c, 0.14);
      this.exitDoor = this.add.rectangle(this.exitX, exitY, 38, 82, 0x293c32)
        .setStrokeStyle(2, 0x88af76, 0.9);
      this.add.circle(this.exitX - 11, exitY + 4, 3, 0xcfe2bd);
      this.add.text(this.exitX, exitY - 56, "HOME?", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#9bb38b",
        letterSpacing: 2,
      }).setOrigin(0.5);

      this.add.text(480, 155, `#${String(this.level.id).padStart(2, "0")}  ${this.level.title}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#e5d2b8",
        letterSpacing: 2,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: this.exitGlow,
        alpha: { from: 0.12, to: 0.34 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    }

    createRitual() {
      const actionLabels = {
        scratch: "J",
        jump: "W",
        squeeze: "K",
        loaf: "S",
        roll: "L",
        climb: "SPC",
      };
      this.ritual.forEach((step, index) => {
        const y = step.y || 402;
        const ring = this.add.circle(step.x, y, 18, 0x202d2d, 0.88)
          .setStrokeStyle(3, index === 0 ? 0xe8bb76 : 0x667879, index === 0 ? 1 : 0.55)
          .setDepth(2);
        const label = this.add.text(step.x, y, step.label || actionLabels[step.action], {
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          fontStyle: "bold",
          color: index === 0 ? "#f2ca8d" : "#819092",
        }).setOrigin(0.5).setDepth(3);
        const order = this.add.text(step.x, y - 28, String(index + 1), {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          color: "#8a9a9b",
        }).setOrigin(0.5);
        const helpBase = step.help || RITUAL_ACTION_HELP[step.action];
        const help = this.add.text(step.x, y + 29, helpBase, {
          fontFamily: "Arial, sans-serif",
          fontSize: "8px",
          fontStyle: "bold",
          color: index === 0 ? "#e8bb76" : "#697879",
          letterSpacing: 1,
        }).setOrigin(0.5).setDepth(3);
        this.ritualMarkers.push({
          ring,
          label,
          order,
          help,
          helpBase,
        });
      });

      this.exitBarrier = this.add.rectangle(872, 270, 18, 400, 0xb67ad1, 0.12)
        .setStrokeStyle(2, 0xc29ae0, 0.62);
      this.physics.add.existing(this.exitBarrier, true);
      this.add.text(860, 205, "CAT LOCK", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#c29ae0",
        letterSpacing: 1,
      }).setOrigin(1, 0.5);
    }

    createGround(gaps) {
      const sortedGaps = [...gaps].sort((left, right) => left.x - right.x);
      let segmentStart = 0;
      sortedGaps.forEach(({ x, width }) => {
        const gapStart = x - width / 2;
        if (gapStart > segmentStart) {
          const segmentWidth = gapStart - segmentStart;
          this.addPlatform(segmentStart + segmentWidth / 2, 505, segmentWidth, 70);
        }
        segmentStart = x + width / 2;
      });
      if (segmentStart < GAME_WIDTH) {
        const segmentWidth = GAME_WIDTH - segmentStart;
        this.addPlatform(segmentStart + segmentWidth / 2, 505, segmentWidth, 70);
      }
    }

    createTunnel({ x, width }) {
      this.add.rectangle(x, 355, width, 174, 0x51443b)
        .setStrokeStyle(2, 0x9b8068, 0.72);
      this.tunnelGates.push(
        this.addTunnelGate(x - width / 2 - 9),
        this.addTunnelGate(x + width / 2 + 9),
      );
      this.tunnelBounds.push({
        minX: x - width / 2 - 24,
        maxX: x + width / 2 + 24,
        minY: 395,
      });
      this.add.text(x, 454, "HOLD K  ·  LIQUID CAT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#c49c67",
        letterSpacing: 1,
      }).setOrigin(0.5);
    }

    createClimbWall({ x, height }) {
      const topY = 470 - height;
      this.addBlocker(x, 470 - height / 2, 30, height, 0x604a3b);
      const ledgeWidth = Math.max(45, GAME_WIDTH - x - 15);
      this.addPlatform(x + 15 + ledgeWidth / 2, topY + 11, ledgeWidth, 22);
      this.climbZones.push({
        minX: x - 80,
        maxX: x + 8,
        minY: topY - 45,
        maxY: 470,
        topY,
      });
      this.add.text(x - 27, topY + 34, "HOLD SPACE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#c4a1e4",
        letterSpacing: 1,
      }).setOrigin(1, 0.5);
    }

    addBlocker(x, y, width, height, color) {
      const blocker = this.add.rectangle(x, y, width, height, color)
        .setStrokeStyle(2, 0x9b8068, 0.72);
      this.physics.add.existing(blocker, true);
      this.platforms.push(blocker);
      return blocker;
    }

    addTunnelGate(x) {
      const gate = this.add.rectangle(x, 270, 18, 400, 0x000000, 0);
      this.physics.add.existing(gate, true);
      return gate;
    }

    addPlatform(x, y, width, height, safe = false) {
      const platform = this.add.rectangle(x, y, width, height, safe ? 0x66513b : 0x34494a)
        .setStrokeStyle(2, safe ? 0xd0a66d : 0x668084, 0.78);
      this.physics.add.existing(platform, true);
      this.platforms.push(platform);
      return platform;
    }

    createCrate(x, y, width, height, label) {
      const crate = this.add.rectangle(x, y, width, height, 0x745238)
        .setStrokeStyle(3, 0xc69a63, 0.85);
      this.physics.add.existing(crate, true);
      crate.label = this.add.text(x, y - height / 2 - 17, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#c69a63",
        letterSpacing: 1,
      }).setOrigin(0.5);
      crate.isCrate = true;
      this.crates.push(crate);
      return crate;
    }

    createPlayer() {
      this.player = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, "prototype-cat");
      this.player.setDepth(3);
      this.player.setCollideWorldBounds(true);
      this.player.setBodySize(38, CAT_SKILL_ROUTE.standingVisualHeight);
      this.player.setOffset(7, 7);
      this.player.body.setMaxVelocity(560, 820);

      this.platforms.forEach((platform) => {
        this.physics.add.collider(this.player, platform);
      });
      this.tunnelGates.forEach((gate) => {
        this.physics.add.collider(
          this.player,
          gate,
          undefined,
          () => !canPassTunnelGate(this.squeezing),
          this,
        );
      });
      this.crates.forEach((crate) => {
        crate.playerCollider = this.physics.add.collider(this.player, crate);
      });
      if (this.exitBarrier) {
        this.physics.add.collider(
          this.player,
          this.exitBarrier,
          undefined,
          () => this.ritual.length > 0 ? !this.ritualComplete : !this.loafSatisfied,
          this,
        );
      }
    }

    createActors() {
      this.actorPlan = LEVEL_ACTORS[this.level.id] || {};
      this.items = [];
      this.enemies = [];

      (this.actorPlan.items || []).forEach((definition) => {
        const item = this.physics.add.sprite(
          definition.x,
          definition.y || 438,
          "prototype-yarn",
        );
        item.setDepth(2);
        item.body.setAllowGravity(false);
        item.setImmovable(true);
        this.items.push(item);
        this.physics.add.overlap(this.player, item, () => this.collectYarn(item));
        this.tweens.add({
          targets: item,
          y: item.y - 6,
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });

      (this.actorPlan.enemies || []).forEach((definition) => {
        const enemyType = definition.type || "mouse";
        const enemy = this.physics.add.sprite(
          definition.x,
          definition.y || 438,
          `prototype-${enemyType}`,
        );
        enemy.setDepth(2);
        enemy.enemyType = enemyType;
        enemy.setBodySize(enemyType === "dog" ? 42 : 28, enemyType === "dog" ? 26 : 16);
        enemy.setOffset(enemyType === "dog" ? 4 : 3, enemyType === "dog" ? 8 : 4);
        enemy.setCollideWorldBounds(true);
        enemy.patrolMinX = definition.minX;
        enemy.patrolMaxX = definition.maxX;
        enemy.patrolSpeed = definition.speed || (enemyType === "dog" ? 42 : 62);
        enemy.spawnX = definition.x;
        enemy.spawnY = definition.y || 438;
        enemy.baseY = enemy.spawnY;
        enemy.passCooldownUntil = 0;
        if (enemyType === "pigeon") {
          enemy.body.setAllowGravity(false);
        }
        enemy.setVelocityX(enemy.patrolSpeed);
        if (enemyType !== "pigeon") {
          this.platforms.forEach((platform) => {
            this.physics.add.collider(enemy, platform);
          });
          this.crates.forEach((crate) => {
            this.physics.add.collider(enemy, crate);
          });
        }
        this.physics.add.overlap(this.player, enemy, () => this.handleEnemyContact(enemy));
        this.enemies.push(enemy);
      });
    }

    collectYarn(item) {
      if (!item.active) {
        return;
      }
      this.tweens.killTweensOf(item);
      item.destroy();
      this.yarnShield = 1;
      this.showAction("YARN SAVES 1 DEATH");
      this.updateActorHud();
    }

    handleEnemyContact(enemy) {
      if (
        !enemy.active
        || this.time.now < this.enemyHitCooldownUntil
        || this.time.now < enemy.passCooldownUntil
      ) {
        return;
      }

      const outcome = resolveThreatContact({
        type: enemy.enemyType,
        rolling: this.rolling,
        swiping: this.currentAction === "swipe",
        squeezing: this.squeezing,
        loafing: this.loafing,
      });
      const resolvedLabels = {
        "roll-hit": "ROLL HIT",
        "scratch-hit": "SCRATCH HIT",
        "pigeon-scattered": "PIGEON SCATTERED",
        "dog-calmed": "DOG LOST INTEREST",
      };
      if (outcome === "pigeon-passed") {
        enemy.passCooldownUntil = this.time.now + 700;
        this.showAction("DUCKED PIGEON");
        return;
      }
      if (resolvedLabels[outcome]) {
        this.defeatEnemy(enemy, resolvedLabels[outcome]);
        return;
      }
      this.enemyHitCooldownUntil = this.time.now + 500;
      enemy.setPosition(enemy.spawnX, enemy.spawnY - 20);
      enemy.setVelocityX(-enemy.patrolSpeed);
      this.showAction(`${enemy.enemyType.toUpperCase()} HIT`);
      this.respawn();
    }

    defeatEnemy(enemy, label) {
      if (!enemy.active) {
        return false;
      }
      enemy.destroy();
      this.showAction(label);
      this.updateActorHud();
      return true;
    }

    defeatEnemyInRange(range) {
      const enemy = this.enemies.find((candidate) => {
        if (!candidate.active || candidate.enemyType === "dog") {
          return false;
        }
        const forwardDistance = (candidate.x - this.player.x) * this.facing;
        return forwardDistance >= -12
          && forwardDistance <= range
          && Math.abs(candidate.y - this.player.y) < 70;
      });
      return enemy ? this.defeatEnemy(enemy, "SCRATCH HIT") : false;
    }

    updateEnemies() {
      this.enemies.forEach((enemy) => {
        if (!enemy.active || !enemy.body) {
          return;
        }

        if (enemy.enemyType === "pigeon") {
          enemy.y = enemy.baseY + Math.sin((this.time.now + enemy.spawnX) / 210) * 11;
        }

        if (enemy.enemyType === "dog") {
          const playerDistance = this.player.x - enemy.x;
          const playerIsMoving = Math.abs(this.player.body.velocity.x) > 24 && !this.loafing;
          if (Math.abs(playerDistance) < 170 && playerIsMoving) {
            enemy.setVelocityX(Math.sign(playerDistance) * 128);
            enemy.setFlipX(playerDistance < 0);
            return;
          }
        }

        if (enemy.x <= enemy.patrolMinX || enemy.body.blocked.left) {
          enemy.setVelocityX(enemy.patrolSpeed);
        } else if (enemy.x >= enemy.patrolMaxX || enemy.body.blocked.right) {
          enemy.setVelocityX(-enemy.patrolSpeed);
        }
        enemy.setFlipX(enemy.body.velocity.x < 0);
      });
    }

    createInterface() {
      this.instruction = this.add.text(480, 74, `#${String(this.level.id).padStart(2, "0")}  ${this.level.title}  ·  ${this.level.focus}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#eadbc7",
        backgroundColor: "#1d2929cc",
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(5).setScrollFactor(0);

      const encounterHints = {
        mouse: "Mouse: J/L.",
        pigeon: "Pigeon: K duck or J swat.",
        dog: "Dog: S loaf or jump.",
      };
      const actorCopy = this.actorPlan.enemies
        ? ` ${this.actorPlan.enemies
          .map((enemy) => encounterHints[enemy.type || "mouse"])
          .join(" ")} Yarn saves one death.`
        : " Yarn saves one death.";
      const messageCopy = this.ritual.length > 0
        ? `${this.level.hint} Follow 1→${this.ritual.length}; HOLD means keep the key down.`
        : this.level.hint;
      this.message = this.add.text(480, 115, `${messageCopy}${actorCopy}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#9aa9a7",
      }).setOrigin(0.5).setDepth(5).setScrollFactor(0);

      this.actionText = this.add.text(32, 72, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#efc487",
      }).setDepth(6).setScrollFactor(0);

      this.actorText = this.add.text(928, 76, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#d9a8bc",
        backgroundColor: "#1d2929cc",
        padding: { x: 8, y: 6 },
      }).setOrigin(1, 0).setDepth(6).setScrollFactor(0);
      this.updateActorHud();

      this.completionPanel = this.add.container(480, 260).setDepth(10).setVisible(false).setScrollFactor(0);
      const panel = this.add.rectangle(0, 0, 470, 180, 0x172120, 0.96)
        .setStrokeStyle(2, 0x96bd82, 0.8);
      const title = this.add.text(0, -42, `LEVEL #${String(this.level.id).padStart(2, "0")} CLEAR`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#dcebcf",
      }).setOrigin(0.5);
      const copy = this.add.text(0, 7, "Use Next to compare another sketch.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#b8c7b0",
      }).setOrigin(0.5);
      const reset = this.add.text(0, 55, "PRESS R TO TRY AGAIN", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#879b81",
        letterSpacing: 2,
      }).setOrigin(0.5);
      this.completionPanel.add([panel, title, copy, reset]);
    }

    createInput() {
      this.keys = this.input.keyboard.addKeys({
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        w: Phaser.Input.Keyboard.KeyCodes.W,
        j: Phaser.Input.Keyboard.KeyCodes.J,
        k: Phaser.Input.Keyboard.KeyCodes.K,
        l: Phaser.Input.Keyboard.KeyCodes.L,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
        arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      });
    }

    update(time, delta) {
      if (this.completed) {
        this.player.setVelocityX(0);
        this.publishState();
        return;
      }

      this.updateEnemies();

      const controls = resolvePrototypeInput({
        blockedKeys: this.blockedKeys,
        heldKeys: this.heldKeys,
        a: this.keys.a.isDown,
        s: this.keys.s.isDown,
        d: this.keys.d.isDown,
        w: this.keys.w.isDown,
        j: this.keys.j.isDown,
        k: this.keys.k.isDown,
        l: this.keys.l.isDown,
        space: this.keys.space.isDown,
        arrowLeft: this.keys.arrowLeft.isDown,
        arrowRight: this.keys.arrowRight.isDown,
        arrowUp: this.keys.arrowUp.isDown,
      });

      if (this.rolling && time >= this.rollEndsAt) {
        this.finishRoll();
      }

      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      const actionLocked = time < this.actionLockUntil;
      this.activeClimbZone = this.climbZones.find((zone) => (
        this.player.x >= zone.minX
        && this.player.x <= zone.maxX
        && this.player.y >= zone.minY
        && this.player.y <= zone.maxY
      ));
      const canClimb = controls.climb && Boolean(this.activeClimbZone);
      const inTunnel = this.tunnelBounds.some((bounds) => (
        this.player.x >= bounds.minX
        && this.player.x <= bounds.maxX
        && this.player.y >= bounds.minY
      ));
      const squeezeRequired = controls.squeeze || (this.squeezing && inTunnel);

      this.setSqueezing(squeezeRequired && !canClimb && !controls.anchor && !this.rolling);
      this.setLoafing(controls.anchor && !canClimb && !this.rolling);

      if (!actionLocked) {
        this.currentAction = this.loafing ? "loaf" : this.squeezing ? "squeeze" : "none";
        this.player.clearTint();
        this.player.setAngle(0);
        this.player.setVelocityX(controls.horizontal * (this.squeezing ? SQUEEZE_SPEED : MOVE_SPEED));
        if (this.squeezing) {
          this.player.setTint(0x9fcbd5);
        } else if (this.loafing) {
          this.player.setTint(this.loafSatisfied ? 0x9dcc89 : 0xe8bb76);
        }
      }

      if (controls.horizontal !== 0) {
        this.facing = controls.horizontal;
        this.player.setFlipX(this.facing < 0);
      }

      if (controls.jump && grounded && !this.previousControls.jump && !actionLocked && !this.squeezing && !this.loafing) {
        this.player.setVelocityY(-JUMP_SPEED);
        this.lastAction = "jump";
        this.showAction("W  JUMP");
        this.advanceRitual("jump");
      }

      if (controls.swipe && !this.previousControls.swipe && !actionLocked) {
        this.performSwipe();
      }

      if (controls.squeeze && !this.previousControls.squeeze) {
        this.lastAction = "squeeze";
        this.showAction("K  LIQUID CAT");
      }

      if (controls.anchor && !this.previousControls.anchor) {
        this.lastAction = "loaf";
        this.showAction("S  LOAF");
      }

      if (controls.roll
        && !this.previousControls.roll
        && grounded
        && controls.horizontal !== 0
        && !actionLocked
        && !this.squeezing
        && !this.loafing) {
        this.performRoll(controls.horizontal);
      }

      if (canClimb && !actionLocked) {
        this.performClimb(!this.previousControls.climb);
      }

      this.updateRitualHold(
        this.loafing ? "loaf" : this.squeezing ? "squeeze" : null,
        delta,
      );

      if (this.loafGoal
        && controls.anchor
        && grounded
        && this.player.x >= this.loafGoal.minX
        && this.player.x <= this.loafGoal.maxX) {
        this.loafCharge = Math.min(600, this.loafCharge + delta);
        if (!this.loafSatisfied && this.loafCharge >= 600) {
          this.loafSatisfied = true;
          this.loafPad.setFillStyle(0x79a86b, 0.86);
          this.showAction("LOAF LOCKED");
          this.message.setText("The cat has settled. The exit is open.");
        }
      } else if (!this.loafSatisfied) {
        this.loafCharge = Math.max(0, this.loafCharge - delta * 0.5);
      }

      this.previousControls = {
        jump: controls.jump,
        swipe: controls.swipe,
        squeeze: controls.squeeze,
        climb: controls.climb,
        roll: controls.roll,
        anchor: controls.anchor,
      };

      if (!this.pawStorm
        && this.level.stormAt
        && grounded
        && this.player.x >= this.level.stormAt) {
        this.triggerPawStorm();
      }

      if (shouldRespawnFromFall(this.player.y)) {
        this.respawn();
      }

      if (this.player.x > this.exitX - 24) {
        this.completePrototype();
      }

      this.publishState();
    }

    performSwipe() {
      this.lastAction = "swipe";
      this.currentAction = "swipe";
      this.actionLockUntil = this.time.now + 180;
      this.player.setTint(0xf0c985);
      this.player.setVelocityX(0);
      this.showAction("J  SCRATCH");
      this.breakCrateInRange(84);
      this.defeatEnemyInRange(90);
      this.advanceRitual("scratch");

      const slash = this.add.rectangle(
        this.player.x + this.facing * 42,
        this.player.y,
        42,
        7,
        0xf4d69f,
        0.9,
      ).setAngle(this.facing > 0 ? -22 : 22).setDepth(4);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: 1.7,
        duration: 170,
        onComplete: () => slash.destroy(),
      });
    }

    setSqueezing(squeezing) {
      if (this.squeezing === squeezing) {
        return;
      }
      this.squeezing = squeezing;
      this.syncCatTexture();
    }

    setLoafing(loafing) {
      if (this.loafing === loafing) {
        return;
      }
      this.loafing = loafing;
      this.syncCatTexture();
    }

    syncCatTexture() {
      this.player.setTexture(
        this.squeezing || this.loafing || this.rolling ? "prototype-cat-squeeze" : "prototype-cat",
      );
    }

    performRoll(direction) {
      this.setSqueezing(false);
      this.setLoafing(false);
      this.rolling = true;
      this.rollEndsAt = this.time.now + ROLL_DURATION;
      this.actionLockUntil = this.rollEndsAt;
      this.lastAction = "roll";
      this.currentAction = "roll";
      this.player.setTexture("prototype-cat-squeeze");
      this.player.setTint(0xe3a86f);
      this.player.setAngle(direction > 0 ? 12 : -12);
      this.player.setVelocity(direction * ROLL_SPEED, -ROLL_LIFT);
      this.showAction("L  LONG ROLL");
      this.advanceRitual("roll");
    }

    finishRoll() {
      this.rolling = false;
      this.player.setAngle(0);
      this.player.clearTint();
      this.syncCatTexture();
    }

    performClimb(showLabel) {
      this.setSqueezing(false);
      this.setLoafing(false);
      this.lastAction = "climb";
      this.currentAction = "climb";
      this.player.setTint(0xc8a7e8);
      this.player.setAngle(-8);
      this.player.setVelocityY(-CLIMB_SPEED);
      this.player.setVelocityX(
        this.player.y < this.activeClimbZone.topY - 20 ? MOVE_SPEED : 55,
      );
      if (showLabel) {
        this.showAction("SPACE  CLAW CLIMB");
      }
      this.advanceRitual("climb");
    }

    updateRitualHold(action, delta) {
      const step = this.ritual[this.ritualIndex];
      if (!step || step.action !== action || Math.abs(this.player.x - step.x) > 72) {
        const currentMarker = this.ritualMarkers[this.ritualIndex];
        if (currentMarker && this.ritualCharge > 0) {
          currentMarker.ring.setFillStyle(0x202d2d, 0.88);
          currentMarker.help.setText(currentMarker.helpBase);
        }
        this.ritualCharge = 0;
        return;
      }
      this.ritualCharge += delta;
      const progress = Math.min(1, this.ritualCharge / 420);
      const marker = this.ritualMarkers[this.ritualIndex];
      marker.ring.setFillStyle(0xe8bb76, 0.14 + progress * 0.56);
      marker.help.setText(`${marker.helpBase}  ${Math.round(progress * 100)}%`);
      if (this.ritualCharge >= 420) {
        this.ritualCharge = 0;
        this.advanceRitual(action);
      }
    }

    advanceRitual(action) {
      const step = this.ritual[this.ritualIndex];
      if (!step || step.action !== action || Math.abs(this.player.x - step.x) > 82) {
        return false;
      }

      const marker = this.ritualMarkers[this.ritualIndex];
      marker.ring.setFillStyle(0x416644, 0.96).setStrokeStyle(3, 0x9dcc89, 1);
      marker.label.setColor("#d7edca");
      marker.order.setColor("#9dcc89");
      marker.help.setText("DONE").setColor("#9dcc89");
      this.ritualIndex += 1;

      if (this.ritualIndex >= this.ritual.length) {
        this.ritualComplete = true;
        this.exitBarrier.setFillStyle(0x79a86b, 0.04).setStrokeStyle(2, 0x79a86b, 0.18);
        this.message.setText("Cat code complete. The lock is open.");
        this.showAction("CAT LOCK OPEN");
      } else {
        const next = this.ritualMarkers[this.ritualIndex];
        next.ring.setStrokeStyle(3, 0xe8bb76, 1);
        next.label.setColor("#f2ca8d");
        next.help.setColor("#e8bb76");
        this.message.setText(`Node ${this.ritualIndex} complete. Next: ${next.helpBase}.`);
      }
      return true;
    }

    showAction(label) {
      this.actionText.setText(label).setAlpha(1);
      this.tweens.killTweensOf(this.actionText);
      this.tweens.add({
        targets: this.actionText,
        alpha: 0,
        duration: 520,
        delay: 160,
      });
    }

    updateActorHud() {
      if (!this.actorText) {
        return;
      }
      const yarn = this.yarnShield > 0 ? "●" : "○";
      const enemiesRemaining = this.enemies.filter((enemy) => enemy.active).length;
      this.actorText.setText(`YARN ${yarn}  ·  THREATS ${enemiesRemaining}`);
    }

    breakCrateInRange(range) {
      const crate = this.crates.find((candidate) => {
        if (!candidate.active) {
          return false;
        }
        const forwardDistance = (candidate.x - this.player.x) * this.facing;
        return forwardDistance >= -12 && forwardDistance <= range
          && Math.abs(candidate.y - this.player.y) < 90;
      });

      if (!crate) {
        return false;
      }

      if (crate.playerCollider) {
        crate.playerCollider.destroy();
      }
      crate.label.destroy();
      crate.destroy();
      this.cameras.main.shake(90, 0.003);
      return true;
    }

    triggerPawStorm() {
      positionPaws();
      this.pawStorm = true;
      this.checkpoint = { x: Math.max(64, this.player.x - 24), y: this.player.y };
      this.blockedKeys = ["w", "j", "k"];
      this.heldKeys = ["d"];
      if (!this.rolling) {
        this.currentAction = "none";
        this.actionLockUntil = 0;
        this.player.setVelocityX(0);
        this.player.clearTint();
        this.player.setAngle(0);
      }

      keyboardElement.classList.add("is-storm");
      this.setKeyState("w", "is-blocked");
      this.setKeyState("j", "is-blocked");
      this.setKeyState("k", "is-blocked");
      this.setKeyState("d", "is-held");
      ["arrowleft", "arrowright", "arrowup", "l", "s", "space"].forEach((key) => {
        this.setKeyState(key, "is-available");
      });

      statusElement.textContent = "Paw Storm: W, J, and K are blocked. D is held. Arrows, L roll, S loaf, and Space climb remain.";
      this.instruction.setText("W / J / K  BLOCKED   ·   D  HELD");
      this.instruction.setColor("#efad6a");
      this.message.setText("D pushes right. Use L to roll, Space to climb, or S to loaf.");
      if (this.safeLabel) {
        this.safeLabel.setText("CHECKPOINT");
      }

      this.cameras.main.flash(260, 238, 167, 96, false);
      this.cameras.main.shake(210, 0.006);
      this.publishState();
    }

    activateForcedRight() {
      this.heldKeys = ["d"];
      this.setKeyState("d", "is-held");
      this.setKeyState("s", "is-available");
      statusElement.textContent = `Level ${this.level.id}: D is being held. Hold S to loaf and stop.`;
    }

    setKeyState(key, className) {
      const keyElement = keyboardElement.querySelector(`[data-key="${key}"]`);
      if (keyElement) {
        keyElement.classList.add(className);
      }
    }

    respawn() {
      const deathProtection = resolveYarnDeath(this.yarnShield);
      this.yarnShield = deathProtection.yarnShield;
      this.currentAction = "none";
      this.actionLockUntil = 0;
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.setSqueezing(false);
      this.setLoafing(false);
      this.rolling = false;
      this.rollEndsAt = 0;
      this.syncCatTexture();
      this.player.clearTint();
      this.player.setAngle(0);
      this.previousControls.jump = false;
      this.previousControls.swipe = false;
      this.previousControls.squeeze = false;
      this.previousControls.climb = false;
      this.previousControls.roll = false;
      this.previousControls.anchor = false;
      if (deathProtection.protected) {
        this.showAction("YARN SAVED A LIFE");
      }
      this.cameras.main.fadeIn(160, 16, 25, 27);
    }

    completePrototype() {
      this.completed = true;
      this.player.setVelocity(0, 0);
      this.completionPanel.setVisible(true);
      keyboardElement.classList.add("is-complete");
      statusElement.textContent = `Level #${String(this.level.id).padStart(2, "0")} clear. Use Previous or Next to keep screening.`;
      this.instruction.setVisible(false);
      this.message.setVisible(false);
      this.publishState();
    }

    publishState() {
      const state = {
        buildVersion: CATWALK_BUILD,
        levelIndex: this.levelIndex,
        levelId: this.level.id,
        levelTitle: this.level.title,
        gallerySize: LEVEL_GALLERY.length,
        pawStorm: this.pawStorm,
        completed: this.completed,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.y),
        velocityX: Math.round(this.player.body.velocity.x),
        velocityY: Math.round(this.player.body.velocity.y),
        cameraX: Math.round(this.cameras.main.scrollX),
        worldWidth: GAME_WIDTH,
        checkpointX: this.checkpoint.x,
        checkpointY: this.checkpoint.y,
        blockedKeys: [...this.blockedKeys],
        heldKeys: [...this.heldKeys],
        currentAction: this.currentAction,
        lastAction: this.lastAction,
        squeezing: this.squeezing,
        rolling: this.rolling,
        rollEndsAt: Math.round(this.rollEndsAt),
        loafing: this.loafing,
        loafSatisfied: this.loafSatisfied,
        loafCharge: Math.round(this.loafCharge),
        ritualStep: this.ritualIndex,
        ritualLength: this.ritual.length,
        ritualComplete: this.ritualComplete,
        ritualCharge: Math.round(this.ritualCharge),
        yarnShield: this.yarnShield,
        itemsRemaining: this.items.filter((item) => item.active).length,
        enemiesRemaining: this.enemies.filter((enemy) => enemy.active).length,
        threatTypes: this.enemies
          .filter((enemy) => enemy.active)
          .map((enemy) => enemy.enemyType),
        enemyPositions: this.enemies
          .filter((enemy) => enemy.active)
          .map((enemy) => Math.round(enemy.x)),
        inClimbZone: Boolean(this.activeClimbZone),
        cratesRemaining: this.crates.filter((crate) => crate.active).length,
      };
      window.__catwalkPrototypeState = state;
      document.documentElement.dataset.prototypeState = JSON.stringify(state);
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "catwalk-game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#10191b",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 1200 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: PrototypeScene,
  };

  new Phaser.Game(config);
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", startCatwalkPrototype);
}
