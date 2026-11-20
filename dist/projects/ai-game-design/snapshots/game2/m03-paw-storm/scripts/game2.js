"use strict";

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
      { code: "Space", label: "", units: 6.25 },
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

  return {
    horizontal: left === right ? 0 : left ? -1 : 1,
    jump: active("w") || active("arrowUp"),
    swipe: active("j"),
    roll: active("k"),
    pounce: active("l"),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FULL_KEYBOARD_LAYOUT, flattenKeyboardLayout, resolvePrototypeInput };
}

function startCatwalkPrototype() {
  const keyboardElement = document.querySelector("#prototype-keyboard");
  const keyboardLayoutElement = document.querySelector("#full-keyboard-layout");
  const statusElement = document.querySelector("#prototype-status");
  const restartButton = document.querySelector("#restart-prototype");

  if (!window.Phaser || !keyboardElement || !keyboardLayoutElement || !statusElement || !restartButton) {
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
    if (["w", "a", "s", "d", "j", "k", "l", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(definition.key)) {
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
  window.addEventListener("resize", positionPaws);

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const MOVE_SPEED = 245;
  const JUMP_SPEED = 465;

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
    }

    create() {
      this.pawStorm = false;
      this.completed = false;
      this.facing = 1;
      this.checkpoint = { x: 64, y: 430 };
      this.blockedKeys = [];
      this.heldKeys = [];
      this.lastAction = "none";
      this.actionLockUntil = 0;
      this.currentAction = "none";
      this.previousControls = {
        jump: false,
        swipe: false,
        roll: false,
        pounce: false,
      };

      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.setAttribute("aria-label", "Catwalk action platform game. Click to focus, then use the keyboard.");
      this.game.canvas.addEventListener("pointerdown", () => this.game.canvas.focus());

      keyboardElement.classList.remove("is-storm", "is-complete");
      keyboardElement.querySelectorAll("kbd").forEach((key) => {
        key.classList.remove("is-blocked", "is-held", "is-available");
      });
      statusElement.textContent = "Use WASD to move, J to scratch, K to roll, and L to pounce.";

      this.cameras.main.setBackgroundColor("#10191b");
      this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT + 160);
      this.physics.world.setBoundsCollision(true, true, true, false);

      this.createBackdrop();
      this.createCatTexture();
      this.createLevel();
      this.createPlayer();
      this.createInterface();
      this.createInput();
      this.publishState();

      restartButton.onclick = () => this.scene.restart();
      this.input.keyboard.on("keydown-R", () => this.scene.restart());
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
      this.add.text(32, 28, "PAW STORM INPUT LAB", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#77898a",
        letterSpacing: 2,
      });
    }

    createCatTexture() {
      if (this.textures.exists("prototype-cat")) {
        return;
      }

      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
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
      graphics.destroy();
    }

    createLevel() {
      this.platforms = [];
      this.crates = [];

      this.addPlatform(135, 505, 270, 70);
      this.addPlatform(565, 440, 200, 22, true);
      this.addPlatform(745, 465, 150, 22);
      this.addPlatform(900, 500, 120, 92);

      this.createCrate(202, 415, 48, 110, "J  SCRATCH");
      this.createCrate(872, 404, 52, 100, "L  POUNCE");

      this.add.text(352, 456, "K  ROLL", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#c49c67",
        letterSpacing: 2,
      }).setOrigin(0.5);
      this.add.line(0, 0, 284, 470, 450, 430, 0xc49c67, 0.42)
        .setOrigin(0);

      this.add.rectangle(565, 422, 164, 3, 0xe1b777, 0.24);
      this.safeLabel = this.add.text(565, 402, "PAW STORM ZONE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#8c7354",
        letterSpacing: 1,
      }).setOrigin(0.5);

      this.exitGlow = this.add.rectangle(930, 405, 48, 94, 0xa6c98c, 0.14);
      this.exitDoor = this.add.rectangle(930, 411, 38, 82, 0x293c32)
        .setStrokeStyle(2, 0x88af76, 0.9);
      this.add.circle(919, 415, 3, 0xcfe2bd);
      this.add.text(930, 351, "HOME?", {
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
      this.player.setBodySize(38, 36);
      this.player.setOffset(7, 7);
      this.player.body.setMaxVelocity(560, 820);

      this.platforms.forEach((platform) => {
        this.physics.add.collider(this.player, platform);
      });
      this.crates.forEach((crate) => {
        crate.playerCollider = this.physics.add.collider(this.player, crate);
      });
    }

    createInterface() {
      this.instruction = this.add.text(480, 74, "WASD MOVE  ·  J SCRATCH  ·  K ROLL  ·  L POUNCE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#eadbc7",
        backgroundColor: "#1d2929cc",
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(5);

      this.message = this.add.text(480, 115, "Break the box. Cross the gap.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#9aa9a7",
      }).setOrigin(0.5).setDepth(5);

      this.actionText = this.add.text(32, 72, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#efc487",
      }).setDepth(6);

      this.completionPanel = this.add.container(480, 260).setDepth(10).setVisible(false);
      const panel = this.add.rectangle(0, 0, 470, 180, 0x172120, 0.96)
        .setStrokeStyle(2, 0x96bd82, 0.8);
      const title = this.add.text(0, -42, "YOU KEPT CONTROL.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#dcebcf",
      }).setOrigin(0.5);
      const copy = this.add.text(0, 7, "Four paws. One keyboard. Still moving.", {
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
        d: Phaser.Input.Keyboard.KeyCodes.D,
        w: Phaser.Input.Keyboard.KeyCodes.W,
        j: Phaser.Input.Keyboard.KeyCodes.J,
        k: Phaser.Input.Keyboard.KeyCodes.K,
        l: Phaser.Input.Keyboard.KeyCodes.L,
        arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
        arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      });
    }

    update() {
      if (this.completed) {
        this.player.setVelocityX(0);
        this.publishState();
        return;
      }

      const controls = resolvePrototypeInput({
        blockedKeys: this.blockedKeys,
        heldKeys: this.heldKeys,
        a: this.keys.a.isDown,
        d: this.keys.d.isDown,
        w: this.keys.w.isDown,
        j: this.keys.j.isDown,
        k: this.keys.k.isDown,
        l: this.keys.l.isDown,
        arrowLeft: this.keys.arrowLeft.isDown,
        arrowRight: this.keys.arrowRight.isDown,
        arrowUp: this.keys.arrowUp.isDown,
      });

      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      const actionLocked = this.time.now < this.actionLockUntil;

      if (!actionLocked) {
        this.currentAction = "none";
        this.player.clearTint();
        this.player.setAngle(0);
        this.player.setVelocityX(controls.horizontal * MOVE_SPEED);
      }

      if (controls.horizontal !== 0) {
        this.facing = controls.horizontal;
        this.player.setFlipX(this.facing < 0);
      }

      if (controls.jump && grounded && !this.previousControls.jump && !actionLocked) {
        this.player.setVelocityY(-JUMP_SPEED);
        this.lastAction = "jump";
      }

      if (controls.swipe && !this.previousControls.swipe && !actionLocked) {
        this.performSwipe();
      }

      if (controls.roll && !this.previousControls.roll && grounded && !actionLocked) {
        this.performRoll();
      }

      if (controls.pounce && !this.previousControls.pounce && grounded && !actionLocked) {
        this.performPounce();
      }

      if (this.currentAction === "pounce") {
        this.breakCrateInRange(68);
      }

      this.previousControls = {
        jump: controls.jump,
        swipe: controls.swipe,
        roll: controls.roll,
        pounce: controls.pounce,
      };

      if (!this.pawStorm && grounded && this.player.x >= 500 && this.player.x <= 630) {
        this.triggerPawStorm();
      }

      if (this.player.y > GAME_HEIGHT + 70) {
        this.respawn();
      }

      if (this.player.x > 914 && this.player.y > 330) {
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

    performRoll() {
      this.lastAction = "roll";
      this.currentAction = "roll";
      this.actionLockUntil = this.time.now + 420;
      this.player.setTint(0x9fcbd5);
      this.player.setAngle(this.facing * 28);
      this.player.setVelocity(this.facing * 520, -390);
      this.showAction("K  ROLL");
    }

    performPounce() {
      this.lastAction = "pounce";
      this.currentAction = "pounce";
      this.actionLockUntil = this.time.now + 560;
      this.player.setTint(0xc8a7e8);
      this.player.setAngle(this.facing * -12);
      this.player.setVelocity(this.facing * 400, -550);
      this.showAction("L  POUNCE");
      this.breakCrateInRange(70);
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
      this.checkpoint = { x: 535, y: 390 };
      this.blockedKeys = ["w", "j", "k"];
      this.heldKeys = ["d"];
      this.currentAction = "none";
      this.actionLockUntil = 0;
      this.player.setVelocityX(0);
      this.player.clearTint();
      this.player.setAngle(0);

      keyboardElement.classList.add("is-storm");
      this.setKeyState("w", "is-blocked");
      this.setKeyState("j", "is-blocked");
      this.setKeyState("k", "is-blocked");
      this.setKeyState("d", "is-held");
      ["arrowleft", "arrowright", "arrowup", "l"].forEach((key) => {
        this.setKeyState(key, "is-available");
      });

      statusElement.textContent = "Paw Storm: W, J, and K are blocked. D is held down. Arrow keys and L remain.";
      this.instruction.setText("W / J / K  BLOCKED   ·   D  HELD");
      this.instruction.setColor("#efad6a");
      this.message.setText("Left resists. Arrow keys steer. L still pounces.");
      this.safeLabel.setText("CHECKPOINT");

      this.cameras.main.flash(260, 238, 167, 96, false);
      this.cameras.main.shake(210, 0.006);
      this.publishState();
    }

    setKeyState(key, className) {
      const keyElement = keyboardElement.querySelector(`[data-key="${key}"]`);
      if (keyElement) {
        keyElement.classList.add(className);
      }
    }

    respawn() {
      this.currentAction = "none";
      this.actionLockUntil = 0;
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.player.clearTint();
      this.player.setAngle(0);
      this.previousControls.jump = false;
      this.previousControls.swipe = false;
      this.previousControls.roll = false;
      this.previousControls.pounce = false;
      this.cameras.main.fadeIn(160, 16, 25, 27);
    }

    completePrototype() {
      this.completed = true;
      this.player.setVelocity(0, 0);
      this.completionPanel.setVisible(true);
      keyboardElement.classList.add("is-complete");
      statusElement.textContent = "Prototype complete. Press R or use Restart to play again.";
      this.instruction.setVisible(false);
      this.message.setVisible(false);
      this.publishState();
    }

    publishState() {
      const state = {
        pawStorm: this.pawStorm,
        completed: this.completed,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.y),
        velocityX: Math.round(this.player.body.velocity.x),
        checkpointX: this.checkpoint.x,
        checkpointY: this.checkpoint.y,
        blockedKeys: [...this.blockedKeys],
        heldKeys: [...this.heldKeys],
        currentAction: this.currentAction,
        lastAction: this.lastAction,
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
