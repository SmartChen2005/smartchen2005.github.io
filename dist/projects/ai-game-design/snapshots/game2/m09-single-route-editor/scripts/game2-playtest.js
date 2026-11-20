"use strict";

(function startCatwalkRoutePlaytest() {
  const STORAGE_KEY = "catwalk-timeline-snapshot-m09-single-route-editor";
  const editorModel = globalThis.CATWALK_EDITOR_MODEL;
  const playtestModel = globalThis.CATWALK_PLAYTEST_MODEL;
  const statusElement = document.querySelector("#prototype-status");
  const keyboardElement = document.querySelector("#prototype-keyboard");
  const keyboardLayoutElement = document.querySelector("#full-keyboard-layout");
  const dynamicPaws = document.querySelector("#dynamic-paws");
  const restartButton = document.querySelector("#restart-playtest");
  const projectNameElement = document.querySelector("#playtest-project-name");
  const missingProject = document.querySelector("#missing-project");
  const returnEditorLink = document.querySelector(".return-editor");
  const playerDialogueElement = document.querySelector("#player-dialogue");
  const playerDialogueCopy = document.querySelector("#player-dialogue-copy");
  const screenBlockCat = document.querySelector("#screen-block-cat");
  const screenWalkCat = document.querySelector("#screen-walk-cat");
  const requestedAnchorValue = new URLSearchParams(window.location.search).get("anchor");
  const requestedAnchor = requestedAnchorValue === null ? NaN : Number(requestedAnchorValue);

  if (!window.Phaser || !editorModel || !playtestModel) {
    throw new Error("Catwalk playtest dependencies failed to load.");
  }

  returnEditorLink.href = editorModel.buildEditorReturnHref(requestedAnchor);

  let project;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      throw new Error("No saved editor route.");
    }
    project = editorModel.parseProject(saved);
  } catch (error) {
    missingProject.hidden = false;
    document.querySelector(".playtest-desk").hidden = true;
    return;
  }

  const worldWidth = editorModel.calculateWorldWidth(project);
  const plan = playtestModel.buildRuntimePlan(project, worldWidth);
  const requestedCheckpoint = Number.isFinite(requestedAnchor)
    ? playtestModel.findPlaytestCheckpoint(plan.checkpoints, plan.gameStart, requestedAnchor)
    : null;
  const playtestSpawn = playtestModel.resolveCheckpointSpawn(
    requestedCheckpoint || plan.spawn,
    plan.grounds,
    plan.platforms,
  );
  projectNameElement.textContent = project.name;

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const MOVE_SPEED = 245;
  const SQUEEZE_SPEED = 145;
  const JUMP_SPEED = 465;
  const CLIMB_SPEED = 220;
  const ROLL_SPEED = 520;
  const ROLL_LIFT = 300;
  const ROLL_DURATION = 520;
  const STARTING_LIVES = 9;

  const PLAY_KEYS = new Set([
    "w", "a", "s", "d", "j", "k", "l", "space",
    "arrowup", "arrowdown", "arrowleft", "arrowright",
  ]);

  const keyboardLayout = {
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
          key: label,
        })),
        { code: "Minus", label: "- _", key: "-" },
        { code: "Equal", label: "= +", key: "=" },
        { code: "Backspace", label: "Backspace", units: 2, key: "backspace" },
      ],
      [
        { code: "Tab", label: "Tab", units: 1.5, key: "tab" },
        ...["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((label) => ({
          code: `Key${label}`,
          label,
          key: label.toLowerCase(),
        })),
        { code: "BracketLeft", label: "[ {", key: "[" },
        { code: "BracketRight", label: "] }", key: "]" },
        { code: "Backslash", label: "\\ |", units: 1.5, key: "\\" },
      ],
      [
        { code: "CapsLock", label: "Caps Lock", units: 1.75, key: "capslock" },
        ...["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((label) => ({
          code: `Key${label}`,
          label,
          key: label.toLowerCase(),
        })),
        { code: "Semicolon", label: "; :", key: ";" },
        { code: "Quote", label: "' \"", key: "'" },
        { code: "Enter", label: "Enter", units: 2.25, key: "enter" },
      ],
      [
        { code: "ShiftLeft", label: "Shift", units: 2.25, key: "shift" },
        ...["Z", "X", "C", "V", "B", "N", "M"].map((label) => ({
          code: `Key${label}`,
          label,
          key: label.toLowerCase(),
        })),
        { code: "Comma", label: ", <", key: "," },
        { code: "Period", label: ". >", key: "." },
        { code: "Slash", label: "/ ?", key: "/" },
        { code: "ShiftRight", label: "Shift", units: 2.75, key: "shift" },
      ],
      [
        { code: "ControlLeft", label: "Ctrl", units: 1.25, key: "control" },
        { code: "MetaLeft", label: "Win", units: 1.25, key: "meta" },
        { code: "AltLeft", label: "Alt", units: 1.25, key: "alt" },
        { code: "Space", label: "", units: 6.25, key: "space" },
        { code: "AltRight", label: "Alt", units: 1.25, key: "alt" },
        { code: "Fn", label: "Fn", key: "fn" },
        { code: "ContextMenu", label: "Menu", key: "menu" },
        { code: "ControlRight", label: "Ctrl", units: 1.25, key: "control" },
      ],
    ],
    navigation: {
      six: [
        { code: "Insert", label: "Insert", key: "insert" },
        { code: "Home", label: "Home", key: "home" },
        { code: "PageUp", label: "PgUp", key: "pageup" },
        { code: "Delete", label: "Delete", key: "delete" },
        { code: "End", label: "End", key: "end" },
        { code: "PageDown", label: "PgDn", key: "pagedown" },
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

  function createKeyElement(definition) {
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
    if (PLAY_KEYS.has(definition.key)) {
      key.classList.add("key-playing");
    }
    if (definition.label.length > 3) {
      key.classList.add("key-legend-corner");
    }
    return key;
  }

  function createRow(definitions, className = "keyboard-row") {
    const row = document.createElement("div");
    row.className = className;
    definitions.forEach((definition) => row.append(createKeyElement(definition)));
    return row;
  }

  function buildKeyboard() {
    const fragment = document.createDocumentFragment();
    const functionRow = document.createElement("div");
    functionRow.className = "keyboard-function-row";
    keyboardLayout.functionGroups.forEach((group) => {
      functionRow.append(createRow(group, "keyboard-function-group"));
    });
    const body = document.createElement("div");
    body.className = "keyboard-body";
    const main = document.createElement("div");
    main.className = "keyboard-main";
    keyboardLayout.mainRows.forEach((row) => main.append(createRow(row)));
    const navigation = document.createElement("div");
    navigation.className = "keyboard-navigation";
    navigation.append(createRow(keyboardLayout.navigation.six, "navigation-six"));
    navigation.append(createRow(keyboardLayout.navigation.arrows, "navigation-arrows"));
    const numpad = createRow(keyboardLayout.numpad, "keyboard-numpad");
    body.append(main, navigation, numpad);
    fragment.append(functionRow, body);
    keyboardLayoutElement.replaceChildren(fragment);
  }

  function positionPaws() {
    const keyboardRect = keyboardElement.getBoundingClientRect();
    if (!keyboardRect.width) {
      return;
    }
    const scaleX = keyboardRect.width / keyboardElement.offsetWidth;
    const scaleY = keyboardRect.height / keyboardElement.offsetHeight;
    dynamicPaws.querySelectorAll(".paw[data-paw]").forEach((paw) => {
      const key = keyboardElement.querySelector(`[data-key="${CSS.escape(paw.dataset.paw)}"]`);
      if (!key) {
        paw.hidden = true;
        return;
      }
      const keyRect = key.getBoundingClientRect();
      paw.style.setProperty("--paw-x", `${(keyRect.left - keyboardRect.left + keyRect.width / 2) / scaleX}px`);
      paw.style.setProperty("--paw-y", `${(keyRect.top - keyboardRect.top + keyRect.height / 2) / scaleY}px`);
      paw.style.setProperty("--paw-width", `${Math.max(10, keyRect.width / scaleX - 6)}px`);
      paw.style.setProperty("--paw-height", `${Math.max(8, keyRect.height / scaleY - 5)}px`);
    });
  }

  function syncKeyboard(blockedKeys, heldKeys, activeEvents) {
    keyboardElement.querySelectorAll("kbd").forEach((key) => {
      key.classList.remove("is-blocked", "is-held", "is-available");
      if (PLAY_KEYS.has(key.dataset.key)) {
        key.classList.add("is-available");
      }
    });
    blockedKeys.forEach((name) => {
      const key = keyboardElement.querySelector(`[data-key="${CSS.escape(String(name).toLowerCase())}"]`);
      key?.classList.remove("is-available", "is-held");
      key?.classList.add("is-blocked");
    });
    heldKeys.forEach((name) => {
      const key = keyboardElement.querySelector(`[data-key="${CSS.escape(String(name).toLowerCase())}"]`);
      key?.classList.remove("is-available", "is-blocked");
      key?.classList.add("is-held");
    });

    const pawTargets = [];
    activeEvents.forEach((event) => {
      const keys = [...(event.blockedKeys || []), ...(event.heldKeys || [])];
      const directions = event.pawDirections?.length ? event.pawDirections : ["top"];
      keys.forEach((key, index) => {
        pawTargets.push({
          key: String(key).toLowerCase(),
          direction: directions[index % directions.length],
        });
      });
    });
    dynamicPaws.replaceChildren(...pawTargets.map(({ key, direction }) => {
      const paw = document.createElement("div");
      const validDirection = ["top", "bottom", "left", "right"].includes(direction)
        ? direction
        : "top";
      paw.className = `paw paw-from-${validDirection}`;
      paw.dataset.paw = key;
      paw.innerHTML = '<span class="paw-arm"></span><i class="paw-pad"></i>';
      return paw;
    }));
    keyboardElement.classList.toggle("is-storm", pawTargets.length > 0);
    keyboardElement.classList.toggle("has-active-paws", pawTargets.length > 0);
    requestAnimationFrame(positionPaws);
  }

  function resolveInput(keys, blockedKeys, heldKeys) {
    const blocked = new Set(blockedKeys);
    const held = new Set(heldKeys);
    const active = (name, physical) => !blocked.has(name) && (held.has(name) || physical);
    const left = active("a", keys.a.isDown) || active("arrowleft", keys.arrowLeft.isDown);
    const right = active("d", keys.d.isDown) || active("arrowright", keys.arrowRight.isDown);
    const anchor = active("s", keys.s.isDown);
    return {
      horizontal: anchor || left === right ? 0 : left ? -1 : 1,
      jump: active("w", keys.w.isDown) || active("arrowup", keys.arrowUp.isDown),
      scratch: active("j", keys.j.isDown),
      squeeze: active("k", keys.k.isDown),
      loaf: anchor,
      roll: active("l", keys.l.isDown),
      climb: active("space", keys.space.isDown),
    };
  }

  buildKeyboard();
  window.addEventListener("resize", positionPaws);
  syncKeyboard([], [], []);

  class RoutePlaytestScene extends Phaser.Scene {
    constructor() {
      super("RoutePlaytestScene");
    }

    create() {
      this.completed = false;
      this.gameOver = false;
      this.facing = 1;
      this.checkpoint = { ...playtestSpawn };
      this.checkpointType = requestedCheckpoint?.checkpointType || "route";
      this.checkpointSourceId = playtestSpawn.id || null;
      const nineLivesState = playtestModel.createNineLivesState(plan.gameStart, playtestSpawn.x);
      this.gameStarted = nineLivesState.started;
      this.lives = nineLivesState.lives;
      this.squeezing = false;
      this.loafing = false;
      this.rolling = false;
      this.rollEndsAt = 0;
      this.actionLockUntil = 0;
      this.yarnShield = 0;
      this.enemyHitCooldownUntil = 0;
      this.elapsedSeconds = 0;
      this.pawEventStates = new Map();
      this.triggeredPawStops = new Set();
      this.triggeredScreenBlocks = new Set(
        plan.screenBlocks
          .filter((event) => (
            event.endMode === "duration"
              ? Number(event.triggerX) < Number(playtestSpawn.x)
              : Number(event.endX) <= Number(playtestSpawn.x)
          ))
          .map((event) => event.id),
      );
      this.screenBlockStates = new Map();
      this.triggeredScreenWalks = new Set(
        plan.screenWalks
          .filter((event) => Number(event.triggerX) < Number(playtestSpawn.x))
          .map((event) => event.id),
      );
      this.activeScreenWalk = null;
      this.screenWalkEndsAt = 0;
      screenBlockCat.hidden = true;
      screenWalkCat.hidden = true;
      this.triggeredPlayerDialogues = new Set(
        plan.playerDialogues
          .filter((dialogue) => Number(dialogue.x) < Number(playtestSpawn.x))
          .map((dialogue) => dialogue.id),
      );
      this.activePlayerDialogue = null;
      this.playerDialogueEndsAt = 0;
      playerDialogueElement.hidden = true;
      this.activePawEvents = [];
      this.blockedKeys = [];
      this.heldKeys = [];
      this.previousControls = {
        jump: false,
        scratch: false,
        squeeze: false,
        loaf: false,
        roll: false,
        climb: false,
      };
      this.ritualStates = Object.fromEntries(
        Object.entries(plan.ritualGroups).map(([group, nodes]) => [
          group,
          { nodes, index: 0, charge: 0 },
        ]),
      );
      this.loafStates = new Map(plan.loafGoals.map((goal) => [
        goal.id,
        { charge: 0, activated: false },
      ]));

      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.setAttribute("aria-label", "Catwalk editor route playtest. Click to focus.");
      this.game.canvas.addEventListener("pointerdown", () => this.game.canvas.focus());

      this.cameras.main.setBackgroundColor("#10191b");
      this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT + 180);
      this.physics.world.setBoundsCollision(true, true, true, false);
      this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);

      this.createBackdrop();
      this.createTextures();
      this.createTerrain();
      this.createGoals();
      this.createWorldText();
      this.createPlayer();
      this.createActors();
      this.createInterface();
      this.createInput();

      this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -160, 0);
      this.cameras.main.setDeadzone(330, 170);
      restartButton.onclick = () => this.scene.restart();
      this.input.keyboard.on("keydown-R", () => this.scene.restart());
      statusElement.textContent = `${project.name}. Editor route playtest started.`;
      window.__catwalkPlaytestState = { ready: true, projectName: project.name };
    }

    createBackdrop() {
      this.add.rectangle(worldWidth / 2, GAME_HEIGHT / 2, worldWidth, GAME_HEIGHT, 0x10191b);
      for (let x = 80; x < worldWidth; x += 320) {
        this.add.circle(x, 70 + ((x / 7) % 170), x % 3 === 0 ? 2 : 1, 0xc9ddd7, 0.28);
      }
      for (let x = 0; x < worldWidth; x += 960) {
        this.add.text(x + 32, 30, `${Math.round(x / 10)}m`, {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#536565",
          letterSpacing: 2,
        });
      }
    }

    createTextures() {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      if (!this.textures.exists("route-cat")) {
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
        graphics.generateTexture("route-cat", 56, 44);
      }
      graphics.clear();
      if (!this.textures.exists("route-cat-low")) {
        graphics.fillStyle(0xd7c2a7, 1);
        graphics.fillTriangle(8, 30, 14, 20, 19, 31);
        graphics.fillTriangle(31, 30, 37, 20, 42, 31);
        graphics.fillRoundedRect(5, 27, 43, 13, 6);
        graphics.fillStyle(0x4c3b35, 1);
        graphics.fillCircle(16, 32, 2);
        graphics.fillCircle(34, 32, 2);
        graphics.fillRoundedRect(6, 37, 10, 4, 2);
        graphics.fillRoundedRect(37, 37, 10, 4, 2);
        graphics.generateTexture("route-cat-low", 56, 44);
      }
      graphics.clear();
      if (!this.textures.exists("route-yarn")) {
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
        graphics.generateTexture("route-yarn", 30, 28);
      }
      const enemyTextures = {
        mouse: { width: 34, height: 22, color: 0x89989a },
        pigeon: { width: 38, height: 24, color: 0x83939f },
        dog: { width: 50, height: 38, color: 0x9b704f },
      };
      Object.entries(enemyTextures).forEach(([type, definition]) => {
        if (this.textures.exists(`route-${type}`)) {
          return;
        }
        graphics.clear();
        graphics.fillStyle(definition.color, 1);
        graphics.fillRoundedRect(2, 5, definition.width - 8, definition.height - 8, 6);
        graphics.fillCircle(definition.width - 8, definition.height / 2, definition.height / 3);
        graphics.fillStyle(0x29231f, 1);
        graphics.fillCircle(definition.width - 5, definition.height / 2, 2);
        graphics.generateTexture(`route-${type}`, definition.width, definition.height);
      });
      graphics.destroy();
    }

    addStaticRectangle(x, y, width, height, color, stroke = 0x668084) {
      const rectangle = this.add.rectangle(x, y, width, height, color)
        .setStrokeStyle(2, stroke, 0.72);
      this.physics.add.existing(rectangle, true);
      this.solids.push(rectangle);
      return rectangle;
    }

    createTerrain() {
      this.solids = [];
      this.crates = [];
      this.tunnelGates = [];
      this.tunnelBounds = [];
      this.climbZones = [];

      plan.grounds.forEach((ground) => {
        this.addStaticRectangle(ground.x, ground.y, ground.width, ground.height, 0x34494a);
      });
      plan.platforms.forEach((platform) => {
        this.addStaticRectangle(platform.x, platform.y, platform.width, platform.height, 0x4f6a69);
      });
      plan.crates.forEach((definition) => {
        const crate = this.addStaticRectangle(
          definition.x,
          definition.y,
          definition.width,
          definition.height,
          0x745238,
          0xc69a63,
        );
        crate.definitionId = definition.id;
        crate.isCrate = true;
        crate.label = this.add.text(definition.x, definition.y - definition.height / 2 - 14, "J", {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#d7ad77",
        }).setOrigin(0.5);
        this.crates.push(crate);
      });
      plan.tunnels.forEach((tunnel) => {
        this.add.rectangle(tunnel.x, tunnel.y, tunnel.width, tunnel.height, 0x51443b, 0.88)
          .setStrokeStyle(2, 0x9b8068, 0.72);
        const left = tunnel.x - tunnel.width / 2 - 9;
        const right = tunnel.x + tunnel.width / 2 + 9;
        [left, right].forEach((x) => {
          const gate = this.add.rectangle(x, tunnel.y, 18, tunnel.height + 70, 0x000000, 0);
          this.physics.add.existing(gate, true);
          this.tunnelGates.push(gate);
        });
        this.tunnelBounds.push({
          minX: tunnel.x - tunnel.width / 2 - 24,
          maxX: tunnel.x + tunnel.width / 2 + 24,
          minY: tunnel.y - tunnel.height / 2,
        });
        this.add.text(tunnel.x, tunnel.y, "HOLD K", {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#c49c67",
        }).setOrigin(0.5);
      });
      plan.walls.forEach((wall) => {
        this.addStaticRectangle(wall.x, wall.y, wall.width, wall.height, 0x604a3b, 0x9b8068);
        this.climbZones.push(wall);
        this.add.text(wall.x, wall.y - wall.height / 2 - 14, "SPACE", {
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#c4a1e4",
        }).setOrigin(0.5);
      });
    }

    createGoals() {
      this.checkpointMarkers = [];
      plan.checkpoints.forEach((checkpoint, index) => {
        const pole = this.add.rectangle(checkpoint.x, checkpoint.y, 4, checkpoint.height, 0x93b77f);
        const flag = this.add.triangle(
          checkpoint.x + 10,
          checkpoint.y - checkpoint.height / 2 + 9,
          0,
          0,
          20,
          8,
          0,
          16,
          0x93b77f,
        );
        const active = requestedCheckpoint
          ? requestedCheckpoint.checkpointType === "route"
            && checkpoint.id === requestedCheckpoint.id
          : index === 0;
        if (active) {
          flag.setFillStyle(0x9dcc89);
        }
        this.checkpointMarkers.push({ checkpoint, pole, flag, active });
      });

      this.gameStartMarker = null;
      if (plan.gameStart) {
        const start = plan.gameStart;
        const pole = this.add.rectangle(start.x, start.y, 5, start.height, 0xe29a62);
        const flag = this.add.triangle(
          start.x + 13,
          start.y - start.height / 2 + 12,
          0,
          0,
          28,
          11,
          0,
          22,
          this.gameStarted ? 0x9dcc89 : 0xe29a62,
        );
        const label = this.add.text(
          start.x,
          start.y - start.height / 2 - 13,
          this.gameStarted ? "RUN ACTIVE · 9 LIVES" : "GAME START · 9 LIVES",
          {
            fontFamily: "Arial, sans-serif",
            fontSize: "10px",
            fontStyle: "bold",
            color: this.gameStarted ? "#cfe8c1" : "#f2bd8e",
            backgroundColor: "#17201fdd",
            padding: { x: 7, y: 4 },
          },
        ).setOrigin(0.5).setDepth(6);
        this.gameStartMarker = { start, pole, flag, label };
      }

      this.exitObjects = [];
      plan.exits.forEach((exit) => {
        const door = this.add.rectangle(exit.x, exit.y, exit.width, exit.height, 0x293c32)
          .setStrokeStyle(2, 0x88af76, 0.9);
        const label = this.add.text(exit.x, exit.y - exit.height / 2 - 14, "HOME?", {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#9bb38b",
        }).setOrigin(0.5);
        this.exitObjects.push({ exit, door, label });
      });

      this.ritualMarkers = {};
      Object.entries(plan.ritualGroups).forEach(([group, nodes]) => {
        this.ritualMarkers[group] = nodes.map((node, index) => {
          const ring = this.add.circle(node.x, node.y, Math.max(14, node.width / 2), 0x202d2d, 0.9)
            .setStrokeStyle(3, index === 0 ? 0xe8bb76 : 0x667879, index === 0 ? 1 : 0.55);
          const label = this.add.text(node.x, node.y, this.actionKey(node.action), {
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            fontStyle: "bold",
            color: index === 0 ? "#f2ca8d" : "#819092",
          }).setOrigin(0.5);
          const order = this.add.text(node.x, node.y - node.height / 2 - 10, String(node.order || index + 1), {
            fontFamily: "Arial, sans-serif",
            fontSize: "9px",
            color: "#9c8aa7",
          }).setOrigin(0.5);
          return { node, ring, label, order };
        });
      });

      this.loafPads = plan.loafGoals.map((goal) => {
        const shape = this.add.rectangle(goal.x, goal.y, goal.width, goal.height, 0xe1b777, 0.5)
          .setStrokeStyle(2, 0xf0ca88, 0.82);
        const label = this.add.text(goal.x, goal.y - 18, "S · REST", {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#f2ca8d",
          backgroundColor: "#17201fdd",
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5).setDepth(6);
        return { goal, shape, label };
      });
    }

    createWorldText() {
      this.worldText = plan.texts.map((definition) => this.add.text(
        definition.x,
        definition.y,
        playtestModel.wrapInstructionText(
          definition.content,
          definition.width,
          definition.fontSize,
        ),
        {
          fontFamily: "Arial, sans-serif",
          fontSize: `${Math.max(8, Number(definition.fontSize || 18))}px`,
          fontStyle: "bold",
          color: "#ead7b9",
          align: "center",
          backgroundColor: "#17201fcc",
          padding: { x: 10, y: 7 },
          wordWrap: { width: Math.max(40, Number(definition.width || 260) - 20) },
        },
      ).setOrigin(0.5).setDepth(4));
    }

    actionKey(action) {
      return {
        scratch: "J",
        jump: "W",
        squeeze: "K",
        loaf: "S",
        roll: "L",
        climb: "SPC",
      }[action] || "?";
    }

    createPlayer() {
      this.player = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, "route-cat");
      this.player.setDepth(5);
      this.player.setCollideWorldBounds(true);
      this.player.setBodySize(38, 36);
      this.player.setOffset(7, 7);
      this.player.body.setMaxVelocity(560, 820);
      this.solids.forEach((solid) => {
        const collider = this.physics.add.collider(this.player, solid);
        if (solid.isCrate) {
          solid.playerCollider = collider;
        }
      });
      this.tunnelGates.forEach((gate) => {
        this.physics.add.collider(
          this.player,
          gate,
          undefined,
          () => !this.squeezing,
          this,
        );
      });
    }

    createActors() {
      this.items = [];
      this.enemies = [];
      plan.yarn.forEach((definition) => {
        const item = this.physics.add.sprite(definition.x, definition.y, "route-yarn");
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
        });
      });
      plan.enemies.forEach((definition) => {
        const type = definition.enemyType || "mouse";
        const enemy = this.physics.add.sprite(definition.x, definition.y, `route-${type}`);
        enemy.enemyType = type;
        enemy.spawnX = definition.x;
        enemy.spawnY = definition.y;
        enemy.baseY = definition.y;
        enemy.patrolMinX = Number(definition.patrolMinX ?? definition.x - 100);
        enemy.patrolMaxX = Number(definition.patrolMaxX ?? definition.x + 100);
        enemy.patrolSpeed = type === "dog" ? 42 : 62;
        enemy.passCooldownUntil = 0;
        enemy.calmProgress = 0;
        enemy.calmState = type === "dog" ? "alert" : null;
        enemy.setBodySize(type === "dog" ? 42 : 28, type === "dog" ? 26 : 16);
        if (type === "pigeon") {
          enemy.body.setAllowGravity(false);
        } else {
          this.solids.forEach((solid) => this.physics.add.collider(enemy, solid));
        }
        enemy.setVelocityX(enemy.patrolSpeed);
        if (type === "dog") {
          enemy.calmLabel = this.add.text(enemy.x, enemy.y - 38, "!", {
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#ef9b7d",
            backgroundColor: "#17201fdd",
            padding: { x: 6, y: 3 },
          }).setOrigin(0.5).setDepth(9);
          enemy.calmBarBack = this.add.rectangle(enemy.x, enemy.y - 26, 42, 5, 0x17201f, 0.88)
            .setDepth(8)
            .setVisible(false);
          enemy.calmBar = this.add.rectangle(enemy.x - 20, enemy.y - 26, 40, 3, 0xe8bb76, 1)
            .setOrigin(0, 0.5)
            .setDepth(9)
            .setScale(0, 1)
            .setVisible(false);
        }
        this.enemies.push(enemy);
        this.physics.add.overlap(this.player, enemy, () => this.handleEnemyContact(enemy));
      });
    }

    createInterface() {
      this.titleText = this.add.text(24, 22, project.name, {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#e7d7c3",
        backgroundColor: "#17201fcc",
        padding: { x: 10, y: 7 },
      }).setScrollFactor(0).setDepth(20);
      this.hudText = this.add.text(936, 22, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#d9a8bc",
        backgroundColor: "#17201fcc",
        padding: { x: 10, y: 8 },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);
      this.messageText = this.add.text(480, 505, "A/D or arrows · W jump · J scratch · K low · S loaf · L roll · Space climb", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#a9b7b4",
        backgroundColor: "#17201fdd",
        padding: { x: 12, y: 7 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
      this.actionText = this.add.text(480, 78, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#efc487",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      this.completionPanel = this.add.container(480, 260).setScrollFactor(0).setDepth(30).setVisible(false);
      const panel = this.add.rectangle(0, 0, 500, 190, 0x172120, 0.97)
        .setStrokeStyle(2, 0x96bd82, 0.8);
      const title = this.add.text(0, -48, "ROUTE PLAYTEST COMPLETE", {
        fontFamily: "Arial, sans-serif",
        fontSize: "25px",
        fontStyle: "bold",
        color: "#dcebcf",
      }).setOrigin(0.5);
      const copy = this.add.text(0, 4, "Return to the editor, adjust the route, and playtest again.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#b8c7b0",
      }).setOrigin(0.5);
      const reset = this.add.text(0, 53, "PRESS R TO RESTART", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#879b81",
        letterSpacing: 2,
      }).setOrigin(0.5);
      this.completionPanel.add([panel, title, copy, reset]);

      this.gameOverPanel = this.add.container(480, 260).setScrollFactor(0).setDepth(31).setVisible(false);
      const gameOverBack = this.add.rectangle(0, 0, 500, 190, 0x211918, 0.97)
        .setStrokeStyle(2, 0xc77d65, 0.9);
      const gameOverTitle = this.add.text(0, -48, "NINE LIVES SPENT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#efb39f",
      }).setOrigin(0.5);
      const gameOverCopy = this.add.text(0, 4, "The run ended. Use Restart above to try again.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#d4b6ad",
      }).setOrigin(0.5);
      const gameOverReset = this.add.text(0, 53, "RESTART RETURNS TO NINE LIVES", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#a9867c",
        letterSpacing: 2,
      }).setOrigin(0.5);
      this.gameOverPanel.add([gameOverBack, gameOverTitle, gameOverCopy, gameOverReset]);
      this.updateHud();
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
      if (this.completed || this.gameOver) {
        this.player.setVelocityX(0);
        this.publishState();
        return;
      }

      this.elapsedSeconds += delta / 1000;
      this.updatePawEvents(time);
      this.updatePlayerDialogue(time);
      this.updateScreenInterference(time);
      this.updateCheckpoints();
      this.updateGameStart();

      const controls = resolveInput(this.keys, this.blockedKeys, this.heldKeys);
      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      const inTunnel = this.tunnelBounds.some((bounds) => (
        this.player.x >= bounds.minX
        && this.player.x <= bounds.maxX
        && this.player.y >= bounds.minY
      ));
      const activeClimbContact = this.climbZones
        .map((wall) => ({
          wall,
          side: playtestModel.getClimbContactSide(this.player, wall),
        }))
        .find((contact) => contact.side !== 0);
      const canClimb = controls.climb && Boolean(activeClimbContact);
      const actionLocked = time < this.actionLockUntil;
      const squeezeRequired = controls.squeeze || (this.squeezing && inTunnel);

      this.setSqueezing(squeezeRequired && !canClimb && !controls.loaf && !this.rolling);
      this.setLoafing(controls.loaf && !canClimb && !this.rolling);
      this.updateEnemies(delta);

      if (this.rolling && time >= this.rollEndsAt) {
        this.finishRoll();
      }
      if (!actionLocked) {
        this.player.setVelocityX(controls.horizontal * (this.squeezing ? SQUEEZE_SPEED : MOVE_SPEED));
        this.player.clearTint();
        this.player.setAngle(0);
        if (this.squeezing) {
          this.player.setTint(0x9fcbd5);
        } else if (this.loafing) {
          this.player.setTint(0xe8bb76);
        }
      }
      if (controls.horizontal !== 0) {
        this.facing = controls.horizontal;
        this.player.setFlipX(this.facing < 0);
      }

      if (controls.jump && !this.previousControls.jump && grounded && !actionLocked && !this.squeezing && !this.loafing) {
        this.player.setVelocityY(-JUMP_SPEED);
        this.showAction("W / ↑  JUMP");
        this.advanceRitual("jump");
      }
      if (controls.scratch && !this.previousControls.scratch && !actionLocked) {
        this.performScratch();
      }
      if (controls.roll && !this.previousControls.roll && grounded && controls.horizontal !== 0 && !actionLocked) {
        this.performRoll(controls.horizontal);
      }
      if (canClimb && !actionLocked) {
        this.player.setVelocityY(-CLIMB_SPEED);
        this.player.setVelocityX(activeClimbContact.side * -55);
        this.player.setTint(0xc8a7e8);
        if (!this.previousControls.climb) {
          this.showAction("SPACE  CLAW CLIMB");
          this.advanceRitual("climb");
        }
      }

      this.updateHoldRitual(this.loafing ? "loaf" : this.squeezing ? "squeeze" : null, delta);
      this.updateLoafGoals(grounded, delta);
      this.updateExit();

      this.previousControls = {
        jump: controls.jump,
        scratch: controls.scratch,
        squeeze: controls.squeeze,
        loaf: controls.loaf,
        roll: controls.roll,
        climb: controls.climb,
      };

      if (this.player.y > GAME_HEIGHT + 45) {
        this.respawn();
      }
      this.updateHud();
      this.publishState();
    }

    updatePawEvents(time) {
      let changed = false;
      plan.pawEvents.forEach((event) => {
        let state = this.pawEventStates.get(event.id);
        if (!state && playtestModel.canTriggerPawEvent(event, this.player.x, this.elapsedSeconds)) {
          state = {
            event,
            startedAt: time,
            endsAt: Number(event.durationSeconds || 0) > 0
              ? time + Number(event.durationSeconds) * 1000
              : Infinity,
          };
          this.pawEventStates.set(event.id, state);
          changed = true;
          this.showAction("MOCHA IS ON THE KEYBOARD");
          this.cameras.main.shake(180, 0.004);
        }
      });
      plan.pawStops.forEach((stop) => {
        if (
          this.triggeredPawStops.has(stop.id)
          || this.player.x < Number(stop.triggerX ?? stop.x)
        ) {
          return;
        }
        this.triggeredPawStops.add(stop.id);
        this.pawEventStates.forEach((state) => {
          state.endsAt = Math.min(state.endsAt, time);
        });
        changed = true;
        this.showAction("MOCHA LEFT THE KEYBOARD");
      });
      const nextActive = [...this.pawEventStates.values()]
        .filter((state) => time < state.endsAt)
        .map((state) => state.event);
      if (nextActive.length !== this.activePawEvents.length) {
        changed = true;
      }
      if (changed) {
        this.activePawEvents = nextActive;
        const effects = playtestModel.mergePawEffects(nextActive);
        this.blockedKeys = effects.blockedKeys.map((key) => String(key).toLowerCase());
        this.heldKeys = effects.heldKeys.map((key) => String(key).toLowerCase());
        syncKeyboard(this.blockedKeys, this.heldKeys, nextActive);
        const blocked = this.blockedKeys.length ? `Blocked: ${this.blockedKeys.join(", ").toUpperCase()}` : "";
        const held = this.heldKeys.length ? `Held: ${this.heldKeys.join(", ").toUpperCase()}` : "";
        this.messageText.setText([blocked, held].filter(Boolean).join(" · ")
          || "A/D or arrows · W jump · J scratch · K low · S loaf · L roll · Space climb");
      }
    }

    updatePlayerDialogue(time) {
      if (this.activePlayerDialogue && time >= this.playerDialogueEndsAt) {
        this.activePlayerDialogue = null;
        playerDialogueElement.hidden = true;
      }
      if (this.activePlayerDialogue) {
        return;
      }
      const dialogue = playtestModel.findTriggeredDialogue(
        plan.playerDialogues,
        this.player.x,
        this.triggeredPlayerDialogues,
      );
      if (!dialogue) {
        return;
      }
      this.triggeredPlayerDialogues.add(dialogue.id);
      this.activePlayerDialogue = dialogue;
      this.playerDialogueEndsAt = time + Math.max(0.5, Number(dialogue.displaySeconds || 4)) * 1000;
      playerDialogueCopy.textContent = dialogue.content;
      playerDialogueElement.hidden = false;
      statusElement.textContent = `Player says: ${dialogue.content}`;
    }

    updateScreenInterference(time) {
      plan.screenBlocks.forEach((event) => {
        if (
          this.triggeredScreenBlocks.has(event.id)
          || this.player.x < Number(event.triggerX ?? event.x)
        ) {
          return;
        }
        this.triggeredScreenBlocks.add(event.id);
        this.screenBlockStates.set(event.id, {
          event,
          startedAt: time,
          active: true,
        });
      });
      this.screenBlockStates.forEach((state) => {
        if (
          state.active
          && !playtestModel.isScreenBlockActive(
            state.event,
            state.startedAt,
            time,
            this.player.x,
          )
        ) {
          state.active = false;
        }
      });
      const activeBlock = [...this.screenBlockStates.values()]
        .filter((state) => state.active)
        .at(-1);
      if (activeBlock) {
        screenBlockCat.hidden = false;
        screenBlockCat.dataset.side = activeBlock.event.side || "left";
        screenBlockCat.style.setProperty(
          "--screen-block-width",
          `${Math.max(10, Math.min(90, Number(activeBlock.event.coveragePercent || 35)))}%`,
        );
      } else {
        screenBlockCat.hidden = true;
      }

      if (this.activeScreenWalk && time >= this.screenWalkEndsAt) {
        this.activeScreenWalk = null;
        screenWalkCat.hidden = true;
        screenWalkCat.classList.remove("is-left-to-right", "is-right-to-left");
      }
      if (!this.activeScreenWalk) {
        const walk = playtestModel.findTriggeredPositionEvent(
          plan.screenWalks,
          this.player.x,
          this.triggeredScreenWalks,
        );
        if (walk) {
          this.triggeredScreenWalks.add(walk.id);
          this.activeScreenWalk = walk;
          const duration = Math.max(0.5, Number(walk.durationSeconds || 4));
          this.screenWalkEndsAt = time + duration * 1000;
          screenWalkCat.hidden = false;
          screenWalkCat.classList.remove("is-left-to-right", "is-right-to-left");
          screenWalkCat.style.setProperty("--screen-walk-duration", `${duration}s`);
          void screenWalkCat.offsetWidth;
          screenWalkCat.classList.add(
            walk.walkDirection === "right-to-left"
              ? "is-right-to-left"
              : "is-left-to-right",
          );
        }
      }
    }

    updateCheckpoints() {
      this.checkpointMarkers.forEach((marker) => {
        if (
          !marker.active
          && Math.abs(this.player.x - marker.checkpoint.x) < 30
          && Math.abs(this.player.y - marker.checkpoint.y) < 85
        ) {
          this.activateRouteCheckpoint(marker);
          this.showAction("CHECKPOINT");
        }
      });
    }

    activateRouteCheckpoint(marker) {
      this.checkpointMarkers.forEach((candidate) => {
        candidate.active = candidate === marker;
        candidate.flag.setFillStyle(candidate.active ? 0x9dcc89 : 0x52675a);
      });
      this.loafPads.forEach(({ goal, shape, label }) => {
        const state = this.loafStates.get(goal.id);
        if (state?.activated) {
          shape.setFillStyle(0x79a86b, 0.72).setStrokeStyle(2, 0x9dcc89, 0.82);
          label.setText("RESTED ✓").setColor("#cfe8c1");
        }
      });
      marker.active = true;
      this.checkpoint = playtestModel.resolveCheckpointSpawn(
        marker.checkpoint,
        plan.grounds,
        plan.platforms,
      );
      this.checkpointType = "route";
      this.checkpointSourceId = marker.checkpoint.id;
      if (this.gameStartMarker && this.gameStarted) {
        this.gameStartMarker.label.setText("RUN ACTIVE").setColor("#cfe8c1");
      }
    }

    activateLoafCheckpoint(pad) {
      this.checkpointMarkers.forEach((marker) => {
        marker.active = false;
        marker.flag.setFillStyle(0x52675a);
      });
      this.loafPads.forEach(({ goal, shape, label }) => {
        const state = this.loafStates.get(goal.id);
        if (!state?.activated) {
          return;
        }
        const current = goal.id === pad.goal.id;
        shape
          .setFillStyle(current ? 0x79a86b : 0x5f8058, current ? 0.92 : 0.68)
          .setStrokeStyle(current ? 3 : 2, current ? 0xd7edca : 0x9dcc89, 0.95);
        label
          .setText(current ? "REST CHECKPOINT" : "RESTED ✓")
          .setColor(current ? "#eff7e8" : "#cfe8c1");
      });
      this.checkpoint = {
        x: pad.goal.x,
        y: pad.goal.y - 22,
      };
      this.checkpointType = "loaf";
      this.checkpointSourceId = pad.goal.id;
      this.showAction("REST CHECKPOINT SET");
      this.cameras.main.flash(180, 207, 237, 193);
    }

    updateGameStart() {
      if (!this.gameStartMarker || this.gameStarted || this.player.x < this.gameStartMarker.start.x) {
        return;
      }
      this.gameStarted = true;
      this.lives = STARTING_LIVES;
      this.checkpointMarkers.forEach((marker) => {
        marker.active = false;
        marker.flag.setFillStyle(0x52675a);
      });
      this.loafPads.forEach(({ goal, shape, label }) => {
        const state = this.loafStates.get(goal.id);
        if (state?.activated) {
          shape.setFillStyle(0x79a86b, 0.72).setStrokeStyle(2, 0x9dcc89, 0.82);
          label.setText("RESTED ✓").setColor("#cfe8c1");
        }
      });
      this.checkpoint = playtestModel.resolveCheckpointSpawn(
        this.gameStartMarker.start,
        plan.grounds,
        plan.platforms,
      );
      this.checkpointType = "gameStart";
      this.checkpointSourceId = this.gameStartMarker.start.id;
      this.gameStartMarker.flag.setFillStyle(0x9dcc89);
      this.gameStartMarker.label.setText("RUN START · 9 LIVES").setColor("#eff7e8");
      this.showAction("TUTORIAL COMPLETE · 9 LIVES");
      this.cameras.main.flash(220, 226, 154, 98);
    }

    updateExit() {
      if (
        !plan.finalExit
        || Math.abs(this.player.x - plan.finalExit.x) > 30
        || Math.abs(this.player.y - plan.finalExit.y) > 90
      ) {
        return;
      }
      const unlocked = Object.values(this.ritualStates).every(
        (state) => state.index >= state.nodes.length,
      );
      if (unlocked) {
        this.completed = true;
        this.player.setVelocity(0, 0);
        this.completionPanel.setVisible(true);
        keyboardElement.classList.add("is-complete");
        statusElement.textContent = "Editor route playtest complete.";
      } else {
        this.player.x = plan.finalExit.x - 42;
        this.player.setVelocityX(-80);
        this.showAction("CAT LOCKS REMAIN");
      }
    }

    performScratch() {
      this.actionLockUntil = this.time.now + 180;
      this.player.setVelocityX(0);
      this.player.setTint(0xf0c985);
      this.showAction("J  SCRATCH");
      this.breakCrateInRange(84);
      this.defeatEnemyInRange(90);
      this.advanceRitual("scratch");
      const slash = this.add.rectangle(this.player.x + this.facing * 42, this.player.y, 42, 7, 0xf4d69f, 0.9)
        .setAngle(this.facing > 0 ? -22 : 22)
        .setDepth(7);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: 1.7,
        duration: 170,
        onComplete: () => slash.destroy(),
      });
    }

    performRoll(direction) {
      this.setSqueezing(false);
      this.setLoafing(false);
      this.rolling = true;
      this.rollEndsAt = this.time.now + ROLL_DURATION;
      this.actionLockUntil = this.rollEndsAt;
      this.player.setTexture("route-cat-low");
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

    setSqueezing(value) {
      if (this.squeezing === value) {
        return;
      }
      this.squeezing = value;
      if (value) {
        this.showAction("K  LIQUID CAT");
      }
      this.syncCatTexture();
    }

    setLoafing(value) {
      if (this.loafing === value) {
        return;
      }
      this.loafing = value;
      if (value) {
        this.showAction("S  LOAF");
      }
      this.syncCatTexture();
    }

    syncCatTexture() {
      this.player.setTexture(this.squeezing || this.loafing || this.rolling ? "route-cat-low" : "route-cat");
    }

    breakCrateInRange(range) {
      const crate = this.crates.find((candidate) => {
        if (!candidate.active) {
          return false;
        }
        const distance = (candidate.x - this.player.x) * this.facing;
        return distance >= -12 && distance <= range && Math.abs(candidate.y - this.player.y) < 90;
      });
      if (!crate) {
        return false;
      }
      crate.playerCollider?.destroy();
      crate.label?.destroy();
      crate.destroy();
      return true;
    }

    advanceRitual(action) {
      let advanced = false;
      Object.entries(this.ritualStates).forEach(([group, state]) => {
        const node = state.nodes[state.index];
        if (!node || node.action !== action || Math.abs(this.player.x - node.x) > 82) {
          return;
        }
        const marker = this.ritualMarkers[group][state.index];
        marker.ring.setFillStyle(0x416644, 0.96).setStrokeStyle(3, 0x9dcc89, 1);
        marker.label.setColor("#d7edca");
        state.index += 1;
        state.charge = 0;
        const next = this.ritualMarkers[group][state.index];
        next?.ring.setStrokeStyle(3, 0xe8bb76, 1);
        next?.label.setColor("#f2ca8d");
        this.showAction(state.index >= state.nodes.length ? "CAT LOCK OPEN" : `CAT LOCK ${state.index}/${state.nodes.length}`);
        advanced = true;
      });
      return advanced;
    }

    updateHoldRitual(action, delta) {
      Object.entries(this.ritualStates).forEach(([group, state]) => {
        const node = state.nodes[state.index];
        if (!node || !action || node.action !== action || Math.abs(this.player.x - node.x) > 72) {
          state.charge = 0;
          return;
        }
        state.charge += delta;
        const marker = this.ritualMarkers[group][state.index];
        marker.ring.setFillStyle(0xe8bb76, 0.2 + Math.min(0.6, state.charge / 700));
        if (state.charge >= 420) {
          this.advanceRitual(action);
        }
      });
    }

    updateLoafGoals(grounded, delta) {
      this.loafPads.forEach((pad) => {
        const { goal, shape, label } = pad;
        const previousState = this.loafStates.get(goal.id) || { charge: 0, activated: false };
        const inside = grounded
          && this.loafing
          && this.player.x >= goal.x - goal.width / 2
          && this.player.x <= goal.x + goal.width / 2;
        const nextState = playtestModel.updateLoafRestState(previousState, inside, delta);
        this.loafStates.set(goal.id, nextState);
        if (!previousState.activated && nextState.activated) {
          this.activateLoafCheckpoint(pad);
          return;
        }
        if (nextState.activated) {
          return;
        }
        const progress = nextState.charge / 600;
        shape.setFillStyle(0xe1b777, 0.5 + progress * 0.28);
        label.setText(progress > 0 ? `REST ${Math.round(progress * 100)}%` : "S · REST");
        if (inside && nextState.charge > 0) {
          label.setColor("#fff1cf");
        } else {
          label.setColor("#f2ca8d");
        }
      });
    }

    collectYarn(item) {
      if (!item.active) {
        return;
      }
      item.destroy();
      this.yarnShield = 1;
      this.showAction("YARN SHIELD");
    }

    handleEnemyContact(enemy) {
      if (!enemy.active || this.time.now < this.enemyHitCooldownUntil || this.time.now < enemy.passCooldownUntil) {
        return;
      }
      if (enemy.enemyType === "mouse" && (this.rolling || this.time.now < this.actionLockUntil)) {
        this.defeatEnemy(enemy, "MOUSE CLEARED");
        return;
      }
      if (enemy.enemyType === "pigeon" && this.squeezing) {
        enemy.passCooldownUntil = this.time.now + 700;
        this.showAction("PIGEON PASSED");
        return;
      }
      if (enemy.enemyType === "pigeon" && this.time.now < this.actionLockUntil) {
        this.defeatEnemy(enemy, "PIGEON SCARED");
        return;
      }
      if (enemy.enemyType === "dog" && this.loafing) {
        enemy.passCooldownUntil = this.time.now + 180;
        this.showAction(enemy.calmState === "calm" ? "DOG IS CALM" : "KEEP LOAFING...");
        return;
      }
      if (enemy.enemyType === "dog" && enemy.calmState === "calm") {
        return;
      }
      if (this.yarnShield > 0) {
        this.yarnShield = 0;
        this.defeatEnemy(enemy, "YARN SAVED YOU");
        return;
      }
      this.enemyHitCooldownUntil = this.time.now + 500;
      this.showAction(`${enemy.enemyType.toUpperCase()} HIT`);
      this.respawn();
    }

    defeatEnemy(enemy, label) {
      if (!enemy.active) {
        return false;
      }
      enemy.calmLabel?.destroy();
      enemy.calmBarBack?.destroy();
      enemy.calmBar?.destroy();
      enemy.destroy();
      this.showAction(label);
      return true;
    }

    defeatEnemyInRange(range) {
      const enemy = this.enemies.find((candidate) => {
        if (!candidate.active || candidate.enemyType === "dog") {
          return false;
        }
        const distance = (candidate.x - this.player.x) * this.facing;
        return distance >= -12 && distance <= range && Math.abs(candidate.y - this.player.y) < 70;
      });
      return enemy ? this.defeatEnemy(enemy, "SCRATCH HIT") : false;
    }

    updateEnemies(delta) {
      this.enemies.forEach((enemy) => {
        if (!enemy.active || !enemy.body) {
          return;
        }
        if (enemy.enemyType === "pigeon") {
          enemy.y = enemy.baseY + Math.sin((this.time.now + enemy.spawnX) / 210) * 11;
        }
        if (enemy.enemyType === "dog") {
          const distance = this.player.x - enemy.x;
          const calmUpdate = playtestModel.updateDogCalmState(
            enemy.calmProgress,
            this.loafing,
            distance,
            delta,
          );
          const stateChanged = calmUpdate.state !== enemy.calmState;
          enemy.calmProgress = calmUpdate.progress;
          enemy.calmState = calmUpdate.state;
          enemy.calmLabel.setPosition(enemy.x, enemy.y - 38);
          enemy.calmBarBack.setPosition(enemy.x, enemy.y - 26);
          enemy.calmBar
            .setPosition(enemy.x - 20, enemy.y - 26)
            .setScale(enemy.calmProgress, 1);
          enemy.calmBarBack.setVisible(enemy.calmState === "curious");
          enemy.calmBar.setVisible(enemy.calmState === "curious");
          if (enemy.calmState === "calm") {
            enemy.setVelocityX(0);
            enemy.setTint(0x9dcc89);
            enemy.setScale(1, 0.82);
            enemy.calmLabel.setText("CALM ♥").setColor("#cfe8c1");
            if (stateChanged) {
              this.showAction("DOG CALMED");
            }
            return;
          }
          if (enemy.calmState === "curious") {
            enemy.setVelocityX(0);
            enemy.setTint(0xe8bb76);
            enemy.setScale(1);
            enemy.calmLabel
              .setText(`LOAF ${Math.round(enemy.calmProgress * 100)}%`)
              .setColor("#f2ca8d");
            return;
          }
          enemy.clearTint();
          enemy.setScale(1);
          enemy.calmLabel.setText("!").setColor("#ef9b7d");
          const moving = Math.abs(this.player.body.velocity.x) > 24 && !this.loafing;
          if (Math.abs(distance) < 170 && moving) {
            enemy.setVelocityX(Math.sign(distance) * 128);
            enemy.setFlipX(distance < 0);
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

    showAction(label) {
      this.actionText.setText(label).setAlpha(1);
      this.tweens.killTweensOf(this.actionText);
      this.tweens.add({
        targets: this.actionText,
        alpha: 0,
        duration: 520,
        delay: 220,
      });
    }

    updateHud() {
      const remaining = this.enemies.filter(
        (enemy) => enemy.active && enemy.calmState !== "calm",
      ).length;
      const completedLocks = Object.values(this.ritualStates)
        .filter((state) => state.index >= state.nodes.length).length;
      const totalLocks = Object.keys(this.ritualStates).length;
      this.hudText.setText(
        `${this.gameStarted ? `LIVES ${this.lives}` : "TUTORIAL · LIVES ∞"}`
        + `  ·  X ${Math.round(this.player.x)} / ${worldWidth}  ·  YARN ${this.yarnShield ? "●" : "○"}  ·  THREATS ${remaining}`
        + (totalLocks ? `  ·  LOCKS ${completedLocks}/${totalLocks}` : ""),
      );
    }

    respawn() {
      if (this.gameStarted) {
        this.lives = playtestModel.spendLife(this.lives);
        if (this.lives <= 0) {
          this.gameOver = true;
          playtestModel.resetPhysicsActor(this.player, this.checkpoint);
          this.player.body.setAllowGravity(false);
          this.gameOverPanel.setVisible(true);
          keyboardElement.classList.add("is-complete");
          statusElement.textContent = "Catwalk run ended after nine lives.";
          this.showAction("NO LIVES LEFT");
          return;
        }
        this.showAction(`${this.lives} LIVES LEFT`);
      }
      playtestModel.resetPhysicsActor(this.player, this.checkpoint);
      this.squeezing = false;
      this.loafing = false;
      this.rolling = false;
      this.actionLockUntil = 0;
      this.rollEndsAt = 0;
      this.syncCatTexture();
      this.player.clearTint();
      this.player.setAngle(0);
      Object.keys(this.previousControls).forEach((key) => {
        this.previousControls[key] = false;
      });
      this.cameras.main.fadeIn(140, 16, 25, 27);
    }

    publishState() {
      const state = {
        ready: true,
        projectName: project.name,
        worldWidth,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.y),
        checkpointX: Math.round(this.checkpoint.x),
        checkpointY: Math.round(this.checkpoint.y),
        checkpointSupport: this.checkpoint.supportType || this.checkpointType,
        checkpointType: this.checkpointType,
        checkpointSourceId: this.checkpointSourceId,
        completed: this.completed,
        gameStarted: this.gameStarted,
        lives: this.lives,
        gameOver: this.gameOver,
        blockedKeys: [...this.blockedKeys],
        heldKeys: [...this.heldKeys],
        activePawEvents: this.activePawEvents.length,
        activeScreenBlock: [...this.screenBlockStates.values()].some((state) => state.active),
        activeScreenWalk: this.activeScreenWalk?.id || null,
        playerDialogue: this.activePlayerDialogue
          ? { id: this.activePlayerDialogue.id, content: this.activePlayerDialogue.content }
          : null,
        yarnShield: this.yarnShield,
        enemiesRemaining: this.enemies.filter(
          (enemy) => enemy.active && enemy.calmState !== "calm",
        ).length,
        dogStates: this.enemies
          .filter((enemy) => enemy.active && enemy.enemyType === "dog")
          .map((enemy) => ({
            state: enemy.calmState,
            progress: Number(enemy.calmProgress.toFixed(2)),
          })),
        loafZones: this.loafPads.map(({ goal }) => {
          const state = this.loafStates.get(goal.id);
          return {
            id: goal.id,
            activated: Boolean(state?.activated),
            currentCheckpoint: this.checkpointType === "loaf"
              && this.checkpointSourceId === goal.id,
          };
        }),
      };
      window.__catwalkPlaytestState = state;
      document.documentElement.dataset.playtestState = JSON.stringify(state);
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
    scene: RoutePlaytestScene,
  };

  new Phaser.Game(config);
}());
