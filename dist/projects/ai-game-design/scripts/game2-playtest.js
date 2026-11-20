"use strict";

(async function startCatwalkRoutePlaytest() {
  const EDITOR_STORAGE_KEY = "catwalk-single-route-editor-v1";
  const LOADED_ROUTE_KEY = "catwalk-loaded-route-v1";
  const editorModel = globalThis.CATWALK_EDITOR_MODEL;
  const playtestModel = globalThis.CATWALK_PLAYTEST_MODEL;
  const worldCatApi = globalThis.CATWALK_WORLD_CAT;
  const audio = globalThis.CATWALK_AUDIO;
  const statusElement = document.querySelector("#prototype-status");
  const keyboardElement = document.querySelector("#prototype-keyboard");
  const keyboardLayoutElement = document.querySelector("#full-keyboard-layout");
  const dynamicPaws = document.querySelector("#dynamic-paws");
  const restartButton = document.querySelector("#restart-playtest");
  const projectNameElement = document.querySelector("#playtest-project-name");
  const missingProject = document.querySelector("#missing-project");
  const missingProjectCopy = document.querySelector("#missing-project-copy");
  const missingProjectLink = document.querySelector("#missing-project-link");
  const returnEditorLink = document.querySelector(".return-editor");
  const playtestMainMenuLink = document.querySelector("#playtest-main-menu");
  const endMainMenu = document.querySelector("#end-main-menu");
  const playerDialogueElement = document.querySelector("#player-dialogue");
  const playerDialogueCopy = document.querySelector("#player-dialogue-copy");
  const PLAYER_DIALOGUE_DURATION_MS = 2000;
  const worldCatActor = document.querySelector("#world-cat-actor");
  const searchParams = new URLSearchParams(window.location.search);
  const routeSource = searchParams.get("source") || "editor";
  const requestedAnchorValue = searchParams.get("anchor");
  const requestedAnchor = requestedAnchorValue === null ? NaN : Number(requestedAnchorValue);

  if (!window.Phaser || !editorModel || !playtestModel || !worldCatApi || !audio) {
    throw new Error("Catwalk playtest dependencies failed to load.");
  }

  if (routeSource === "editor") {
    returnEditorLink.href = editorModel.buildEditorReturnHref(requestedAnchor);
  } else {
    returnEditorLink.href = "./game2.html";
    returnEditorLink.textContent = "Main Menu";
    playtestMainMenuLink.hidden = true;
  }

  let project;
  try {
    let routeJson;
    if (routeSource === "campaign") {
      const response = await fetch("../data/game2/catwalk-single-route.json", { cache: "no-store" });
      if (!response.ok) throw new Error("The designed route could not be loaded.");
      routeJson = await response.text();
    } else if (routeSource === "loaded") {
      routeJson = localStorage.getItem(LOADED_ROUTE_KEY);
      if (!routeJson) throw new Error("No uploaded route is available.");
    } else {
      routeJson = localStorage.getItem(EDITOR_STORAGE_KEY);
      if (!routeJson) throw new Error("No saved editor route is available.");
    }
    project = editorModel.parseProject(routeJson);
  } catch (error) {
    missingProjectCopy.textContent = error.message || "No valid Catwalk route was found.";
    if (routeSource === "editor") {
      missingProjectLink.href = "./game2-editor.html";
      missingProjectLink.textContent = "Open the editor and save a route";
    }
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

  const worldCat = new worldCatApi.WorldCatController({
    actor: worldCatActor,
    paws: dynamicPaws,
    desk: document.querySelector(".playtest-desk"),
    monitor: document.querySelector(".monitor"),
    screen: document.querySelector("#catwalk-game"),
  });

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const MOVE_SPEED = 245;
  const SQUEEZE_SPEED = 145;
  const JUMP_SPEED = 465;
  const CLIMB_SPEED = 220;
  const ROLL_SPEED = 520;
  const ROLL_LIFT = 300;
  const ROLL_DURATION = 520;
  const STARTING_LIVES = playtestModel.getGameStartLives(plan.gameStart);
  const BACKDROP_KEYS = [
    "route-street-bg-v2",
    "route-street-bg-v3",
    "route-street-bg-v4",
    "route-street-bg-v5",
    "route-street-bg-v6",
  ];

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
        { code: "MetaRight", label: "Win", units: 1.25, key: "meta" },
        { code: "ContextMenu", label: "Menu", units: 1.25, key: "menu" },
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
        { code: "ArrowUp", label: "↑", key: "arrowup", gridColumn: "2", gridRow: "1" },
        { code: "ArrowLeft", label: "←", key: "arrowleft", gridColumn: "1", gridRow: "2" },
        { code: "ArrowDown", label: "↓", key: "arrowdown", gridColumn: "2", gridRow: "2" },
        { code: "ArrowRight", label: "→", key: "arrowright", gridColumn: "3", gridRow: "2" },
      ],
    },
    numpad: [
      { code: "NumLock", label: "Num", gridColumn: "1", gridRow: "1" },
      { code: "NumpadDivide", label: "/", gridColumn: "2", gridRow: "1" },
      { code: "NumpadMultiply", label: "*", gridColumn: "3", gridRow: "1" },
      { code: "NumpadSubtract", label: "−", gridColumn: "4", gridRow: "1" },
      { code: "Numpad7", label: "7", gridColumn: "1", gridRow: "2" },
      { code: "Numpad8", label: "8", gridColumn: "2", gridRow: "2" },
      { code: "Numpad9", label: "9", gridColumn: "3", gridRow: "2" },
      { code: "NumpadAdd", label: "+", gridColumn: "4", gridRow: "2 / span 2" },
      { code: "Numpad4", label: "4", gridColumn: "1", gridRow: "3" },
      { code: "Numpad5", label: "5", gridColumn: "2", gridRow: "3" },
      { code: "Numpad6", label: "6", gridColumn: "3", gridRow: "3" },
      { code: "Numpad1", label: "1", gridColumn: "1", gridRow: "4" },
      { code: "Numpad2", label: "2", gridColumn: "2", gridRow: "4" },
      { code: "Numpad3", label: "3", gridColumn: "3", gridRow: "4" },
      { code: "NumpadEnter", label: "Enter", gridColumn: "4", gridRow: "4 / span 2" },
      { code: "Numpad0", label: "0", gridColumn: "1 / span 2", gridRow: "5" },
      { code: "NumpadDecimal", label: ".", gridColumn: "3", gridRow: "5" },
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

  function setPhysicalKeyState(code, isDown) {
    const key = keyboardElement.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (!key) {
      return;
    }
    if (isDown && key.classList.contains("is-blocked")) {
      key.classList.remove("is-denied");
      requestAnimationFrame(() => key.classList.add("is-denied"));
      return;
    }
    key.classList.toggle("is-pressed", isDown);
  }

  function bindKeyboardFeedback() {
    window.addEventListener("keydown", (event) => {
      if (!event.repeat) {
        setPhysicalKeyState(event.code, true);
      }
    });
    window.addEventListener("keyup", (event) => setPhysicalKeyState(event.code, false));
    window.addEventListener("blur", () => {
      keyboardElement.querySelectorAll("kbd.is-pressed").forEach((key) => {
        key.classList.remove("is-pressed");
      });
    });
    keyboardElement.addEventListener("animationend", (event) => {
      event.target.closest("kbd")?.classList.remove("is-denied");
    });
  }

  function positionPaws() {
    const deskElement = document.querySelector(".playtest-desk");
    const monitorElement = document.querySelector(".monitor");
    const deskRect = deskElement.getBoundingClientRect();
    const monitorRect = monitorElement.getBoundingClientRect();
    const actorRect = worldCatActor.getBoundingClientRect();
    const keyboardRect = keyboardElement.getBoundingClientRect();
    if (!keyboardRect.width) {
      return;
    }
    dynamicPaws.querySelectorAll(".paw[data-paw]").forEach((paw) => {
      const key = keyboardElement.querySelector(`[data-key="${CSS.escape(paw.dataset.paw)}"]`);
      if (!key) {
        paw.hidden = true;
        return;
      }
      const keyRect = key.getBoundingClientRect();
      const target = {
        x: keyRect.left - deskRect.left + keyRect.width / 2,
        y: keyRect.top - deskRect.top + keyRect.height / 2,
      };
      const direction = paw.dataset.direction || "top";
      const originOffset = direction === "left" ? -18 : direction === "right" ? 18 : 0;
      const actorIsReaching = worldCatActor.dataset.state === "reach" && actorRect.width;
      const origin = actorIsReaching ? {
        x: actorRect.left - deskRect.left + actorRect.width * 0.55 + originOffset,
        y: actorRect.bottom - deskRect.top - actorRect.height * 0.16,
      } : {
        x: Math.max(
          monitorRect.left - deskRect.left + 40,
          Math.min(monitorRect.right - deskRect.left - 40, target.x + originOffset),
        ),
        y: monitorRect.bottom - deskRect.top - 8,
      };
      const dx = origin.x - target.x;
      const dy = origin.y - target.y;
      paw.style.setProperty("--paw-x", `${target.x}px`);
      paw.style.setProperty("--paw-y", `${target.y}px`);
      paw.style.setProperty("--paw-length", `${Math.hypot(dx, dy)}px`);
      paw.style.setProperty("--paw-angle", `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
      paw.style.setProperty("--paw-width", `${Math.max(22, keyRect.width - 7)}px`);
      paw.style.setProperty("--paw-height", `${Math.max(17, keyRect.height - 4)}px`);
    });
  }

  function aimWorldCatAtPaws(pawTargets) {
    const deskRect = document.querySelector(".playtest-desk").getBoundingClientRect();
    const actorRect = worldCatActor.getBoundingClientRect();
    const targetCenters = pawTargets.slice(0, 2).map(({ key }) => {
      const keyElement = keyboardElement.querySelector(`[data-key="${CSS.escape(key)}"]`);
      const keyRect = keyElement?.getBoundingClientRect();
      return keyRect?.width ? keyRect.left + keyRect.width / 2 - deskRect.left : null;
    }).filter(Number.isFinite);
    if (!targetCenters.length || !actorRect.width) {
      return;
    }
    const targetCenter = targetCenters.reduce((sum, value) => sum + value, 0) / targetCenters.length;
    const desiredLeft = targetCenter - actorRect.width * 0.55;
    const clampedLeft = Math.max(16, Math.min(deskRect.width - actorRect.width - 16, desiredLeft));
    worldCatActor.style.setProperty("--cat-reach-x", `${clampedLeft}px`);
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
      key?.classList.remove("is-pressed");
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
    const visiblePawTargets = pawTargets.slice(0, 2);
    dynamicPaws.replaceChildren(...visiblePawTargets.map(({ key, direction }, index) => {
      const paw = document.createElement("div");
      const validDirection = ["top", "bottom", "left", "right"].includes(direction)
        ? direction
        : "top";
      paw.className = `paw paw-from-${validDirection}`;
      paw.dataset.paw = key;
      paw.dataset.direction = validDirection;
      paw.style.setProperty("--paw-delay", `${Math.min(240, index * 80)}ms`);
      paw.innerHTML = '<img class="world-paw-image" src="../assets/game2/art/mocha-pixel-paw.png" alt="">';
      return paw;
    }));
    dynamicPaws.dataset.extraTargets = String(Math.max(0, pawTargets.length - visiblePawTargets.length));
    keyboardElement.classList.toggle("is-storm", pawTargets.length > 0);
    keyboardElement.classList.toggle("has-active-paws", pawTargets.length > 0);
    dynamicPaws.classList.toggle("is-active", pawTargets.length > 0);
    aimWorldCatAtPaws(visiblePawTargets);
    worldCat.setPaws(pawTargets.length > 0);
    requestAnimationFrame(positionPaws);
    setTimeout(positionPaws, 460);
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
  bindKeyboardFeedback();
  window.addEventListener("resize", () => {
    positionPaws();
    worldCat.layout();
  });
  syncKeyboard([], [], []);
  worldCat.start();

  class RoutePlaytestScene extends Phaser.Scene {
    constructor() {
      super("RoutePlaytestScene");
    }

    preload() {
      BACKDROP_KEYS.forEach((key, index) => {
        this.load.image(key, `../assets/game2/art/route-street-bg-v${index + 2}.png`);
      });
    }

    create() {
      this.completed = false;
      this.gameOver = false;
      endMainMenu.hidden = true;
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
      worldCat.setBlock(null);
      worldCat.setPaws(false);
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
      document.documentElement.dataset.playtestArt = "pixel-street-v4";

      this.cameras.main.setBackgroundColor("#07111e");
      this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT + 180);
      this.physics.world.setBoundsCollision(true, true, true, false);
      this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);

      this.createBackdrop();
      this.createTextures();
      this.createTerrain();
      this.createAlleyClutter();
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
      const panelWidth = GAME_WIDTH;
      const panelCount = Math.ceil(worldWidth / panelWidth) + 1;
      const sequence = playtestModel.createBackdropSequence(panelCount, BACKDROP_KEYS.length);
      for (let panelIndex = 0; panelIndex < panelCount; panelIndex += 1) {
        this.add.image(
          panelIndex * panelWidth + panelWidth / 2,
          GAME_HEIGHT / 2,
          BACKDROP_KEYS[sequence[panelIndex]],
        )
          .setDisplaySize(panelWidth, GAME_HEIGHT)
          .setTint(0xb8bec6)
          .setScrollFactor(1)
          .setDepth(-30);
      }
      this.add.rectangle(worldWidth / 2, GAME_HEIGHT / 2, worldWidth, GAME_HEIGHT, 0x06101b, 0.2)
        .setScrollFactor(1)
        .setDepth(-29);
      const seams = this.add.graphics().setDepth(-28);
      for (let panelIndex = 1; panelIndex < panelCount; panelIndex += 1) {
        const x = panelIndex * panelWidth;
        seams.fillStyle(0x08131d, 0.94);
        seams.fillRect(x - 6, 0, 12, 470);
        seams.fillStyle(0x405866, 0.72);
        seams.fillRect(x - 3, 0, 3, 470);
        seams.fillStyle(0x111f2a, 1);
        for (let y = 36; y < 470; y += 68) {
          seams.fillRect(x - 9, y, 18, 4);
        }
      }
      const skyline = this.add.graphics().setDepth(-10);
      for (let x = 0; x < worldWidth; x += 192) {
        const offset = (Math.floor(x / 192) % 3) * 8;
        skyline.fillStyle(0x0b1724, 0.58);
        skyline.fillRect(x, 414 - offset, 140, 56 + offset);
        skyline.fillStyle(0xc99355, 0.35);
        skyline.fillRect(x + 22, 430 - offset, 5, 7);
        skyline.fillRect(x + 84, 440 - offset, 5, 7);
      }
    }

    createAlleyClutter() {
      const layout = playtestModel.createAlleyClutterLayout(worldWidth, project.objects);
      const art = this.add.graphics().setDepth(4);
      const groundY = 470;
      layout.forEach(({ x, kind }) => {
        if (kind === "trash-bin") {
          art.fillStyle(0x243b3d, 1);
          art.fillRect(x - 18, groundY - 39, 36, 37);
          art.fillStyle(0x395457, 1);
          art.fillRect(x - 21, groundY - 43, 42, 6);
          art.fillStyle(0x132528, 1);
          art.fillRect(x - 11, groundY - 32, 4, 25);
          art.fillRect(x + 7, groundY - 32, 4, 25);
          art.fillRect(x - 14, groundY - 3, 7, 4);
          art.fillRect(x + 7, groundY - 3, 7, 4);
        } else if (kind === "garbage-bags") {
          art.fillStyle(0x101a22, 1);
          art.fillRect(x - 22, groundY - 22, 25, 20);
          art.fillRect(x + 1, groundY - 29, 24, 27);
          art.fillStyle(0x27313a, 1);
          art.fillRect(x - 17, groundY - 25, 14, 5);
          art.fillRect(x + 6, groundY - 33, 13, 6);
          art.fillStyle(0x45505a, 0.75);
          art.fillRect(x - 15, groundY - 16, 3, 7);
          art.fillRect(x + 8, groundY - 20, 3, 9);
        } else if (kind === "bicycle") {
          art.lineStyle(3, 0x26343e, 1);
          art.strokeCircle(x - 14, groundY - 11, 10);
          art.strokeCircle(x + 15, groundY - 11, 10);
          art.lineBetween(x - 14, groundY - 11, x, groundY - 28);
          art.lineBetween(x, groundY - 28, x + 15, groundY - 11);
          art.lineBetween(x - 14, groundY - 11, x + 6, groundY - 11);
          art.lineBetween(x + 6, groundY - 11, x, groundY - 28);
          art.lineBetween(x, groundY - 28, x + 4, groundY - 38);
          art.lineBetween(x - 4, groundY - 38, x + 10, groundY - 38);
          art.lineBetween(x + 4, groundY - 38, x + 14, groundY - 34);
        } else {
          art.fillStyle(0x6f4a32, 1);
          for (let y = groundY - 34; y < groundY - 4; y += 9) {
            art.fillRect(x - 24, y, 48, 5);
          }
          art.fillStyle(0x3b2b25, 1);
          art.fillRect(x - 18, groundY - 37, 5, 36);
          art.fillRect(x + 12, groundY - 37, 5, 36);
        }
      });
    }

    createTextures() {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      if (!this.textures.exists("route-cat")) {
        graphics.fillStyle(0xc6ac90, 1);
        graphics.fillRect(10, 15, 34, 22);
        graphics.fillRect(7, 20, 5, 14);
        graphics.fillRect(14, 10, 24, 10);
        graphics.fillStyle(0x3a2931, 1);
        graphics.fillTriangle(13, 12, 18, 2, 22, 13);
        graphics.fillTriangle(30, 12, 35, 2, 39, 14);
        graphics.fillRect(17, 11, 18, 14);
        graphics.fillRect(9, 33, 9, 7);
        graphics.fillRect(35, 33, 9, 7);
        graphics.fillRect(43, 18, 7, 5);
        graphics.fillRect(49, 12, 5, 10);
        graphics.fillStyle(0x7dd6e8, 1);
        graphics.fillRect(20, 16, 3, 3);
        graphics.fillRect(30, 16, 3, 3);
        graphics.fillStyle(0xf0d9ba, 1);
        graphics.fillRect(24, 21, 5, 3);
        graphics.generateTexture("route-cat", 56, 44);
      }
      graphics.clear();
      if (!this.textures.exists("route-cat-low")) {
        graphics.fillStyle(0xc6ac90, 1);
        graphics.fillRect(5, 27, 43, 11);
        graphics.fillRect(12, 21, 29, 10);
        graphics.fillStyle(0x3a2931, 1);
        graphics.fillTriangle(11, 24, 16, 16, 20, 26);
        graphics.fillTriangle(32, 24, 37, 16, 41, 27);
        graphics.fillRect(16, 23, 21, 9);
        graphics.fillRect(7, 36, 10, 5);
        graphics.fillRect(38, 36, 10, 5);
        graphics.fillStyle(0x7dd6e8, 1);
        graphics.fillRect(20, 27, 3, 2);
        graphics.fillRect(31, 27, 3, 2);
        graphics.generateTexture("route-cat-low", 56, 44);
      }
      graphics.clear();
      if (!this.textures.exists("route-yarn")) {
        graphics.fillStyle(0xf4a8bd, 1);
        graphics.fillRect(8, 4, 12, 3);
        graphics.fillRect(5, 7, 18, 15);
        graphics.fillRect(8, 22, 12, 3);
        graphics.fillStyle(0xb94d78, 1);
        graphics.fillRect(7, 9, 14, 3);
        graphics.fillRect(11, 6, 3, 16);
        graphics.fillRect(15, 12, 8, 3);
        graphics.fillRect(20, 20, 8, 3);
        graphics.fillRect(26, 22, 3, 4);
        graphics.generateTexture("route-yarn", 30, 28);
      }
      graphics.clear();
      if (!this.textures.exists("route-mouse")) {
        // Warm, ground-hugging silhouette: long pink tail, round ears, and a pointed nose.
        graphics.lineStyle(3, 0xd19793, 1);
        graphics.lineBetween(9, 15, 3, 15);
        graphics.lineBetween(3, 15, 1, 11);
        graphics.lineBetween(1, 11, 4, 7);
        graphics.fillStyle(0x3a292d, 1);
        graphics.fillRect(8, 8, 22, 13);
        graphics.fillRect(13, 5, 12, 18);
        graphics.fillRect(27, 10, 8, 10);
        graphics.fillRect(34, 14, 4, 4);
        graphics.fillStyle(0x8f7169, 1);
        graphics.fillRect(9, 9, 21, 10);
        graphics.fillRect(13, 6, 12, 14);
        graphics.fillRect(27, 11, 7, 8);
        graphics.fillStyle(0xd7a5a0, 1);
        graphics.fillRect(15, 2, 7, 7);
        graphics.fillStyle(0x6f504f, 1);
        graphics.fillRect(17, 4, 4, 4);
        graphics.fillStyle(0xf4dfc7, 1);
        graphics.fillRect(29, 12, 2, 2);
        graphics.fillStyle(0x161316, 1);
        graphics.fillRect(37, 15, 3, 3);
        graphics.fillRect(12, 20, 6, 3);
        graphics.fillRect(25, 20, 6, 3);
        graphics.generateTexture("route-mouse", 40, 24);
      }
      graphics.clear();
      if (!this.textures.exists("route-pigeon")) {
        // Cool, airborne silhouette: spread wings, bright wing bars, neck flash, and orange beak.
        graphics.fillStyle(0x263443, 1);
        graphics.fillTriangle(20, 11, 1, 2, 8, 22);
        graphics.fillTriangle(23, 11, 39, 2, 35, 22);
        graphics.fillRect(14, 10, 22, 14);
        graphics.fillRect(29, 5, 10, 11);
        graphics.fillStyle(0x73879b, 1);
        graphics.fillTriangle(19, 12, 4, 5, 10, 19);
        graphics.fillTriangle(24, 12, 37, 5, 33, 19);
        graphics.fillRect(15, 11, 19, 11);
        graphics.fillRect(30, 6, 8, 9);
        graphics.fillStyle(0xd6e0e5, 1);
        graphics.fillRect(7, 9, 9, 3);
        graphics.fillRect(29, 9, 8, 3);
        graphics.fillStyle(0x3fa091, 1);
        graphics.fillRect(29, 12, 6, 4);
        graphics.fillStyle(0xd7a24d, 1);
        graphics.fillTriangle(38, 10, 44, 13, 38, 15);
        graphics.fillRect(18, 23, 3, 5);
        graphics.fillRect(27, 23, 3, 5);
        graphics.fillStyle(0xf3efe4, 1);
        graphics.fillRect(34, 8, 2, 2);
        graphics.fillStyle(0x121820, 1);
        graphics.fillRect(35, 8, 1, 1);
        graphics.generateTexture("route-pigeon", 45, 29);
      }
      graphics.clear();
      if (!this.textures.exists("route-dog")) {
        graphics.fillStyle(0x9e6747, 1);
        graphics.fillRect(6, 13, 33, 18);
        graphics.fillRect(31, 7, 14, 19);
        graphics.fillTriangle(32, 9, 34, 0, 39, 9);
        graphics.fillTriangle(40, 8, 47, 2, 45, 14);
        graphics.fillRect(8, 29, 8, 8);
        graphics.fillRect(31, 29, 8, 8);
        graphics.fillStyle(0x3a2522, 1);
        graphics.fillRect(40, 14, 8, 6);
        graphics.fillRect(36, 11, 3, 3);
        graphics.fillRect(11, 10, 8, 5);
        graphics.generateTexture("route-dog", 50, 38);
      }
      graphics.destroy();
    }

    addStaticRectangle(x, y, width, height, color, stroke = 0x668084) {
      const rectangle = this.add.rectangle(x, y, width, height, color)
        .setStrokeStyle(2, stroke, 0.9)
        .setDepth(1);
      this.physics.add.existing(rectangle, true);
      this.solids.push(rectangle);
      return rectangle;
    }

    drawStreetGround(ground) {
      const solid = this.addStaticRectangle(
        ground.x,
        ground.y,
        ground.width,
        ground.height,
        0x151d25,
        0x3f5663,
      );
      const art = this.add.graphics().setDepth(2);
      const left = ground.x - ground.width / 2;
      const top = ground.y - ground.height / 2;
      art.fillStyle(0x65717a, 1);
      art.fillRect(left, top, ground.width, 7);
      art.fillStyle(0x9a8972, 1);
      art.fillRect(left, top + 7, ground.width, 5);
      art.fillStyle(0x27313a, 1);
      art.fillRect(left, top + 12, ground.width, 10);
      for (let x = left + 8; x < left + ground.width; x += 42) {
        art.fillStyle(0x414a51, 1);
        art.fillRect(x, top + 1, 2, 6);
        art.fillStyle(0x0d141c, 0.9);
        art.fillRect(x + 11, top + 34 + (Math.floor(x / 42) % 2) * 9, 13, 2);
        art.fillRect(x + 17, top + 36 + (Math.floor(x / 42) % 2) * 9, 2, 5);
      }
      return solid;
    }

    drawGap(gap) {
      const art = this.add.graphics().setDepth(0);
      const left = gap.x - gap.width / 2;
      art.fillStyle(0x03070c, 1);
      art.fillRect(left, 470, gap.width, 110);
      art.fillStyle(0x1e3039, 1);
      art.fillRect(left + 7, 512, Math.max(0, gap.width - 14), 8);
      art.fillStyle(0x38515c, 1);
      art.fillRect(left + 12, 516, Math.max(0, gap.width - 24), 3);
      [left, left + gap.width - 8].forEach((edge) => {
        art.fillStyle(0xd29a50, 1);
        art.fillRect(edge, 466, 8, 8);
        art.fillStyle(0x23262a, 1);
        art.fillRect(edge, 474, 8, 8);
      });
      if (gap.width > 90) {
        this.add.text(gap.x, 507, "SEWER", {
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#4b6570",
        }).setOrigin(0.5).setDepth(1);
      }
    }

    drawPlatform(platform) {
      const width = Number(platform.width);
      const left = platform.x - width / 2;
      const top = platform.y - platform.height / 2;
      const solid = this.addStaticRectangle(
        platform.x,
        platform.y,
        width,
        platform.height,
        width < 100 ? 0x53636c : width < 220 ? 0x7f4852 : 0x25333c,
        0x9aa6a6,
      );
      const art = this.add.graphics().setDepth(2);
      if (width < 100) {
        art.fillStyle(0x87939a, 1);
        art.fillRect(left + 5, top + 4, width - 10, Math.max(8, platform.height - 8));
        art.fillStyle(0x27343d, 1);
        for (let x = left + 12; x < left + width - 8; x += 8) {
          art.fillRect(x, top + 8, 3, Math.max(4, platform.height - 16));
        }
        art.fillRect(left + 8, top - 4, width - 16, 4);
      } else if (width < 220) {
        art.fillStyle(0xd6b46c, 1);
        art.fillRect(left, top, width, 6);
        for (let x = left + 4; x < left + width; x += 18) {
          art.fillStyle(Math.floor((x - left) / 18) % 2 ? 0x874653 : 0xc46f62, 1);
          art.fillRect(x, top + 6, Math.min(12, left + width - x), Math.max(8, platform.height - 6));
        }
      } else {
        art.fillStyle(0x71828a, 1);
        art.fillRect(left, top, width, 6);
        art.fillStyle(0x33454f, 1);
        for (let x = left + 8; x < left + width; x += 18) {
          art.fillRect(x, top + 7, 4, Math.max(6, platform.height - 7));
          art.fillRect(x, top - 24, 3, 24);
        }
        art.fillRect(left, top - 25, width, 3);
      }
      return solid;
    }

    drawCardboardCrate(definition) {
      const crate = this.addStaticRectangle(
        definition.x,
        definition.y,
        definition.width,
        definition.height,
        0x9d7048,
        0xd2a36b,
      );
      crate.setFillStyle(0x000000, 0).setStrokeStyle(0);
      const left = definition.x - definition.width / 2;
      const top = definition.y - definition.height / 2;
      const art = this.add.graphics().setDepth(2);
      const rows = Math.max(1, Math.round(definition.height / 54));
      const columns = Math.max(1, Math.round(definition.width / 52));
      const gap = 3;
      const boxWidth = (definition.width - gap * (columns - 1)) / columns;
      const boxHeight = (definition.height - gap * (rows - 1)) / rows;
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const boxLeft = left + column * (boxWidth + gap);
          const boxTop = top + row * (boxHeight + gap);
          const colorIndex = (row + column) % 3;
          const cardboard = [0xb77d4e, 0xc58d58, 0xa96f45][colorIndex];
          art.fillStyle(cardboard, 1);
          art.fillRect(boxLeft, boxTop, boxWidth, boxHeight);
          art.lineStyle(2, 0x70462f, 1);
          art.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);
          art.fillStyle(0xe0b06f, 1);
          art.fillRect(boxLeft + boxWidth / 2 - 3, boxTop + 2, 6, boxHeight - 4);
          art.fillStyle(0x6d4430, 0.9);
          art.fillRect(boxLeft + 5, boxTop + 8, Math.max(5, boxWidth * 0.22), 3);
          art.fillRect(boxLeft + 5, boxTop + 13, Math.max(3, boxWidth * 0.13), 2);
          art.fillStyle(0xd8a166, 1);
          art.fillRect(boxLeft + 2, boxTop + 2, boxWidth / 2 - 5, 3);
          art.fillRect(boxLeft + boxWidth / 2 + 3, boxTop + 2, boxWidth / 2 - 5, 3);
        }
      }
      crate.definitionId = definition.id;
      crate.isCrate = true;
      crate.streetArt = art;
      return crate;
    }

    createTerrain() {
      this.solids = [];
      this.crates = [];
      this.tunnelGates = [];
      this.tunnelBounds = [];
      this.climbZones = [];

      plan.gaps.forEach((gap) => this.drawGap(gap));
      plan.grounds.forEach((ground) => {
        this.drawStreetGround(ground);
      });
      plan.platforms.forEach((platform) => {
        this.drawPlatform(platform);
      });
      plan.crates.forEach((definition) => {
        const crate = this.drawCardboardCrate(definition);
        this.crates.push(crate);
      });
      plan.tunnels.forEach((tunnel) => {
        const art = this.add.graphics().setDepth(3);
        const leftEdge = tunnel.x - tunnel.width / 2;
        const topEdge = tunnel.y - tunnel.height / 2;
        // The editor rectangle represents the complete hanging obstruction.
        // Drawing only its upper half made the visible clearance much taller
        // than the authored clearance, so the cat appeared able to walk under it.
        const ductHeight = tunnel.height;
        const ductBottom = topEdge + ductHeight;
        art.fillStyle(0x394a52, 1);
        art.fillRect(leftEdge, topEdge, tunnel.width, ductHeight);
        art.fillStyle(0x71828a, 1);
        art.fillRect(leftEdge + 4, topEdge + 4, tunnel.width - 8, 5);
        art.fillStyle(0x24343c, 1);
        for (let x = leftEdge + 12; x < leftEdge + tunnel.width - 5; x += 28) {
          art.fillRect(x, topEdge + 5, 4, ductHeight - 10);
        }
        art.fillStyle(0x1c282f, 1);
        art.fillRect(leftEdge - 11, topEdge - 14, 11, ductHeight + 14);
        art.fillRect(leftEdge + tunnel.width, topEdge - 14, 11, ductHeight + 14);
        art.fillStyle(0xa7b1b4, 1);
        art.fillRect(leftEdge - 15, topEdge - 17, 19, 6);
        art.fillRect(leftEdge + tunnel.width - 4, topEdge - 17, 19, 6);
        for (let x = leftEdge; x < leftEdge + tunnel.width; x += 16) {
          art.fillStyle(Math.floor((x - leftEdge) / 16) % 2 ? 0x20262b : 0xe1ad4f, 1);
          art.fillRect(x, ductBottom - 6, Math.min(16, leftEdge + tunnel.width - x), 6);
        }
        art.fillStyle(0xf1c45c, 1);
        art.fillRect(leftEdge, ductBottom, tunnel.width, 3);
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
      });
      plan.walls.forEach((wall) => {
        const solid = this.addStaticRectangle(wall.x, wall.y, wall.width, wall.height, 0x53353b, 0x93606a);
        const art = this.add.graphics().setDepth(2);
        const left = wall.x - wall.width / 2;
        const top = wall.y - wall.height / 2;
        for (let y = top + 5, row = 0; y < top + wall.height; y += 12, row += 1) {
          const offset = row % 2 ? 8 : 0;
          for (let x = left - offset; x < left + wall.width; x += 24) {
            art.lineStyle(2, 0x2a2228, 0.8);
            art.strokeRect(x, y, 22, 10);
          }
        }
        art.fillStyle(0x7b8990, 1);
        art.fillRect(wall.x + wall.width * 0.18, top, 6, wall.height);
        for (let y = top + 12; y < top + wall.height; y += 28) {
          art.fillStyle(0x29343a, 1);
          art.fillRect(wall.x + wall.width * 0.18 - 3, y, 12, 4);
        }
        this.climbZones.push(solid);
      });
    }

    createGoals() {
      this.checkpointMarkers = [];
      plan.checkpoints.forEach((checkpoint, index) => {
        const pole = this.add.rectangle(checkpoint.x, checkpoint.y, 5, checkpoint.height, 0x607782).setDepth(3);
        const flag = this.add.rectangle(
          checkpoint.x + 13,
          checkpoint.y - checkpoint.height / 2 + 9,
          27,
          18,
          0x93b77f,
        ).setStrokeStyle(3, 0x1a2830, 1).setDepth(4);
        this.add.text(checkpoint.x + 13, checkpoint.y - checkpoint.height / 2 + 9, "CP", {
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#102018",
        }).setOrigin(0.5).setDepth(5);
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
        const pole = this.add.rectangle(start.x, start.y, 7, start.height, 0xc89256).setDepth(3);
        const flag = this.add.rectangle(
          start.x + 17,
          start.y - start.height / 2 + 12,
          36,
          24,
          this.gameStarted ? 0x9dcc89 : 0xe29a62,
        ).setStrokeStyle(3, 0x231b1a, 1).setDepth(4);
        this.add.text(start.x + 17, start.y - start.height / 2 + 12, `${STARTING_LIVES}×`, {
          fontFamily: "'Courier New', monospace",
          fontSize: "11px",
          fontStyle: "bold",
          color: "#241813",
        }).setOrigin(0.5).setDepth(5);
        const label = this.add.text(
          start.x,
          start.y - start.height / 2 - 13,
          this.gameStarted ? `RUN ACTIVE · ${STARTING_LIVES} LIVES` : `GAME START · ${STARTING_LIVES} LIVES`,
          {
            fontFamily: "'Courier New', monospace",
            fontSize: "10px",
            fontStyle: "bold",
            color: this.gameStarted ? "#cfe8c1" : "#f2bd8e",
            backgroundColor: "#0c151ddd",
            padding: { x: 7, y: 4 },
          },
        ).setOrigin(0.5).setDepth(6);
        this.gameStartMarker = { start, pole, flag, label };
      }

      this.exitObjects = [];
      plan.exits.forEach((exit) => {
        const door = this.add.rectangle(exit.x, exit.y, exit.width, exit.height, 0x31433e)
          .setStrokeStyle(4, 0x9f7650, 1).setDepth(2);
        this.add.rectangle(exit.x, exit.y - 7, Math.max(12, exit.width - 18), Math.max(18, exit.height - 24), 0xc99a58, 0.34)
          .setStrokeStyle(2, 0xe0bd75, 0.7).setDepth(3);
        this.add.rectangle(exit.x + exit.width * 0.28, exit.y + 7, 4, 4, 0xe4c77c).setDepth(4);
        this.add.rectangle(exit.x, exit.y - exit.height / 2 - 5, exit.width + 18, 8, 0x24313a).setDepth(3);
        const label = this.add.text(exit.x, exit.y - exit.height / 2 - 18, "HOME · WARM LIGHT", {
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#f0cf8e",
          backgroundColor: "#0c151ddd",
          padding: { x: 5, y: 3 },
        }).setOrigin(0.5).setDepth(6);
        this.exitObjects.push({ exit, door, label });
      });

      this.ritualMarkers = {};
      Object.entries(plan.ritualGroups).forEach(([group, nodes]) => {
        this.ritualMarkers[group] = nodes.map((node, index) => {
          const ring = this.add.rectangle(
            node.x,
            node.y,
            Math.max(28, node.width),
            Math.max(28, node.height),
            0x16232a,
            0.92,
          ).setStrokeStyle(3, index === 0 ? 0xe8bb76 : 0x667879, index === 0 ? 1 : 0.55).setDepth(3);
          const label = this.add.text(node.x, node.y, this.actionKey(node.action), {
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            fontStyle: "bold",
            color: index === 0 ? "#f2ca8d" : "#819092",
          }).setOrigin(0.5).setDepth(4);
          const order = this.add.text(node.x, node.y - node.height / 2 - 10, String(node.order || index + 1), {
            fontFamily: "'Courier New', monospace",
            fontSize: "9px",
            color: "#9c8aa7",
          }).setOrigin(0.5).setDepth(4);
          return { node, ring, label, order };
        });
      });

      this.loafPads = plan.loafGoals.map((goal) => {
        const shape = this.add.rectangle(goal.x, goal.y, goal.width, goal.height, 0xa8774e, 0.95)
          .setStrokeStyle(3, 0xe2b978, 0.9).setDepth(2);
        const padArt = this.add.graphics().setDepth(3);
        for (let x = goal.x - goal.width / 2 + 7; x < goal.x + goal.width / 2 - 4; x += 10) {
          padArt.fillStyle(0x6f4b39, 1);
          padArt.fillRect(x, goal.y - goal.height / 2 + 5, 4, Math.max(4, goal.height - 10));
        }
        const label = this.add.text(goal.x, goal.y - 20, "S · CARDBOARD REST", {
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#f2ca8d",
          backgroundColor: "#0c151ddd",
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5).setDepth(6);
        return { goal, shape, label, padArt };
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
          fontFamily: "'Courier New', monospace",
          fontSize: `${Math.max(8, Number(definition.fontSize || 18))}px`,
          fontStyle: "bold",
          color: "#ead7b9",
          align: "center",
          backgroundColor: "#0c151dee",
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
        item.setDepth(5);
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
        enemy.setDepth(5);
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
      const copy = this.add.text(0, 4, "You made it home. Return to the main menu or restart.", {
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
      const gameOverTitle = this.add.text(0, -48, `${STARTING_LIVES} LIVES SPENT`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#efb39f",
      }).setOrigin(0.5);
      const gameOverCopy = this.add.text(0, 4, "The run ended. Return to the main menu or restart.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#d4b6ad",
      }).setOrigin(0.5);
      const gameOverReset = this.add.text(0, 53, `RESTART RETURNS TO ${STARTING_LIVES} LIVES`, {
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
        audio.play("jump");
        this.player.setVelocityY(-JUMP_SPEED);
        this.showAction("W / ↑  JUMP");
        this.advanceRitual("jump");
      }
      if (controls.scratch && !this.previousControls.scratch && !actionLocked) {
        this.performScratch();
      }
      if (playtestModel.canStartRoll({
        rollPressed: controls.roll,
        previousRollPressed: this.previousControls.roll,
        grounded,
        horizontal: controls.horizontal,
        actionLocked,
        squeezing: this.squeezing,
        inTunnel,
      })) {
        this.performRoll(controls.horizontal);
      }
      if (canClimb && !actionLocked) {
        this.player.setVelocityY(-CLIMB_SPEED);
        this.player.setVelocityX(activeClimbContact.side * -55);
        this.player.setTint(0xc8a7e8);
        if (!this.previousControls.climb) {
          audio.play("climb");
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
      this.playerDialogueEndsAt = time + PLAYER_DIALOGUE_DURATION_MS;
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
        worldCat.setBlock(activeBlock.event);
      } else {
        worldCat.setBlock(null);
      }

      if (this.activeScreenWalk && time >= this.screenWalkEndsAt) {
        this.activeScreenWalk = null;
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
          worldCat.walk({
            direction: walk.walkDirection,
            durationSeconds: duration,
          });
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
      this.gameStartMarker.label.setText(`RUN START · ${STARTING_LIVES} LIVES`).setColor("#eff7e8");
      this.showAction(`TUTORIAL COMPLETE · ${STARTING_LIVES} LIVES`);
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
        endMainMenu.hidden = false;
        keyboardElement.classList.add("is-complete");
        statusElement.textContent = "Catwalk route complete.";
      } else {
        this.player.x = plan.finalExit.x - 42;
        this.player.setVelocityX(-80);
        this.showAction("CAT LOCKS REMAIN");
      }
    }

    performScratch() {
      audio.play("scratch");
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
      audio.play("roll");
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
        audio.play("squeeze");
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
        audio.play("loaf");
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
      crate.streetArt?.destroy();
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
      this.showAction("YARN SAVES 1 DEATH");
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
      this.enemyHitCooldownUntil = this.time.now + 500;
      audio.play("playerHit");
      this.showAction(`${enemy.enemyType.toUpperCase()} HIT`);
      this.respawn();
    }

    defeatEnemy(enemy, label) {
      if (!enemy.active) {
        return false;
      }
      const defeatSound = {
        mouse: "mouseDefeat",
        pigeon: "pigeonDefeat",
      }[enemy.enemyType];
      if (defeatSound) {
        audio.play(defeatSound);
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
              audio.play("dogCalm");
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
      const death = playtestModel.resolveDeath({
        yarnShield: this.yarnShield,
        gameStarted: this.gameStarted,
        lives: this.lives,
      });
      this.yarnShield = death.yarnShield;
      this.lives = death.lives;
      if (this.gameStarted && !death.protected) {
        audio.play("lifeLost");
      }
      if (death.gameOver) {
        this.gameOver = true;
        playtestModel.resetPhysicsActor(this.player, this.checkpoint);
        this.player.body.setAllowGravity(false);
        this.gameOverPanel.setVisible(true);
        endMainMenu.hidden = false;
        keyboardElement.classList.add("is-complete");
        statusElement.textContent = `Catwalk run ended after ${STARTING_LIVES} lives.`;
        this.showAction("NO LIVES LEFT");
        return;
      }
      if (death.protected) {
        this.showAction("YARN SAVED A LIFE");
      } else if (this.gameStarted) {
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
        artStyle: "pixel-street-v4",
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
    backgroundColor: "#07111e",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
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
