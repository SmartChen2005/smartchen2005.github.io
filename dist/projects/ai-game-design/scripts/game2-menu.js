"use strict";

(function startCatwalkMainMenu() {
  const LOADED_ROUTE_KEY = "catwalk-loaded-route-v1";
  const editorModel = globalThis.CATWALK_EDITOR_MODEL;
  const worldCatApi = globalThis.CATWALK_WORLD_CAT;
  const keyboard = document.querySelector("#prototype-keyboard");
  const keyboardLayout = document.querySelector("#full-keyboard-layout");
  const loadButton = document.querySelector("#load-level");
  const fileInput = document.querySelector("#level-file");
  const status = document.querySelector("#menu-status");
  const desk = document.querySelector(".menu-desk");
  const monitor = document.querySelector(".menu-monitor");
  const screen = document.querySelector("#catwalk-game");
  const dynamicPaws = document.querySelector("#dynamic-paws");
  const worldCatActor = document.querySelector("#world-cat-actor");
  const menuItems = [...document.querySelectorAll("[data-menu-item]")];
  const MENU_KEYS = new Set(["arrowup", "arrowdown", "enter"]);
  const MENU_PAW_SEQUENCES = [
    [{ code: "KeyQ", direction: "top" }],
    [{ code: "F7", direction: "top" }, { code: "KeyU", direction: "top" }],
    [{ code: "Numpad8", direction: "right" }],
    [{ code: "KeyB", direction: "bottom" }, { code: "KeyN", direction: "bottom" }],
  ];

  if (!editorModel || !worldCatApi) {
    throw new Error("Catwalk menu dependencies failed to load.");
  }

  const worldCat = new worldCatApi.WorldCatController({
    actor: worldCatActor,
    paws: dynamicPaws,
    desk,
    monitor,
    screen,
  });
  let menuPawTimer = 0;
  let activePawKeys = [];
  let selectedMenuIndex = 0;

  const layout = {
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
        ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((label) => ({ code: `Digit${label}`, label })),
        { code: "Minus", label: "- _" }, { code: "Equal", label: "= +" },
        { code: "Backspace", label: "Backspace", units: 2 },
      ],
      [
        { code: "Tab", label: "Tab", units: 1.5 },
        ...["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((label) => ({ code: `Key${label}`, label })),
        { code: "BracketLeft", label: "[ {" }, { code: "BracketRight", label: "] }" },
        { code: "Backslash", label: "\\ |", units: 1.5 },
      ],
      [
        { code: "CapsLock", label: "Caps Lock", units: 1.75 },
        ...["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((label) => ({ code: `Key${label}`, label })),
        { code: "Semicolon", label: "; :" }, { code: "Quote", label: "' \"" },
        { code: "Enter", label: "Enter", units: 2.25, key: "enter" },
      ],
      [
        { code: "ShiftLeft", label: "Shift", units: 2.25 },
        ...["Z", "X", "C", "V", "B", "N", "M"].map((label) => ({ code: `Key${label}`, label })),
        { code: "Comma", label: ", <" }, { code: "Period", label: ". >" }, { code: "Slash", label: "/ ?" },
        { code: "ShiftRight", label: "Shift", units: 2.75 },
      ],
      [
        { code: "ControlLeft", label: "Ctrl", units: 1.25 }, { code: "MetaLeft", label: "Win", units: 1.25 },
        { code: "AltLeft", label: "Alt", units: 1.25 }, { code: "Space", label: "", units: 6.25 },
        { code: "AltRight", label: "Alt", units: 1.25 }, { code: "MetaRight", label: "Win", units: 1.25 },
        { code: "ContextMenu", label: "Menu", units: 1.25 }, { code: "ControlRight", label: "Ctrl", units: 1.25 },
      ],
    ],
    navigation: {
      six: [
        { code: "Insert", label: "Insert" }, { code: "Home", label: "Home" }, { code: "PageUp", label: "PgUp" },
        { code: "Delete", label: "Delete" }, { code: "End", label: "End" }, { code: "PageDown", label: "PgDn" },
      ],
      arrows: [
        { code: "ArrowUp", label: "↑", key: "arrowup", gridColumn: "2", gridRow: "1" },
        { code: "ArrowLeft", label: "←", gridColumn: "1", gridRow: "2" },
        { code: "ArrowDown", label: "↓", key: "arrowdown", gridColumn: "2", gridRow: "2" },
        { code: "ArrowRight", label: "→", gridColumn: "3", gridRow: "2" },
      ],
    },
    numpad: [
      ["NumLock", "Num", "1", "1"], ["NumpadDivide", "/", "2", "1"], ["NumpadMultiply", "*", "3", "1"], ["NumpadSubtract", "−", "4", "1"],
      ["Numpad7", "7", "1", "2"], ["Numpad8", "8", "2", "2"], ["Numpad9", "9", "3", "2"], ["NumpadAdd", "+", "4", "2 / span 2"],
      ["Numpad4", "4", "1", "3"], ["Numpad5", "5", "2", "3"], ["Numpad6", "6", "3", "3"],
      ["Numpad1", "1", "1", "4"], ["Numpad2", "2", "2", "4"], ["Numpad3", "3", "3", "4"], ["NumpadEnter", "Enter", "4", "4 / span 2"],
      ["Numpad0", "0", "1 / span 2", "5"], ["NumpadDecimal", ".", "3", "5"],
    ].map(([code, label, gridColumn, gridRow]) => ({ code, label, gridColumn, gridRow })),
  };

  function createKey(definition) {
    const key = document.createElement("kbd");
    key.dataset.code = definition.code;
    key.textContent = definition.label;
    key.setAttribute("aria-label", definition.label || "Space");
    key.style.setProperty("--key-units", definition.units || 1);
    if (definition.gridColumn) key.style.gridColumn = definition.gridColumn;
    if (definition.gridRow) key.style.gridRow = definition.gridRow;
    if (definition.key) key.dataset.key = definition.key;
    if (MENU_KEYS.has(definition.key)) key.classList.add("is-menu-key");
    if (definition.label.length > 3) key.classList.add("key-legend-corner");
    return key;
  }

  function createRow(definitions, className = "keyboard-row") {
    const row = document.createElement("div");
    row.className = className;
    definitions.forEach((definition) => row.append(createKey(definition)));
    return row;
  }

  function buildKeyboard() {
    const functionRow = document.createElement("div");
    functionRow.className = "keyboard-function-row";
    layout.functionGroups.forEach((group) => functionRow.append(createRow(group, "keyboard-function-group")));
    const body = document.createElement("div");
    body.className = "keyboard-body";
    const main = document.createElement("div");
    main.className = "keyboard-main";
    layout.mainRows.forEach((row) => main.append(createRow(row)));
    const navigation = document.createElement("div");
    navigation.className = "keyboard-navigation";
    navigation.append(createRow(layout.navigation.six, "navigation-six"));
    navigation.append(createRow(layout.navigation.arrows, "navigation-arrows"));
    body.append(main, navigation, createRow(layout.numpad, "keyboard-numpad"));
    keyboardLayout.replaceChildren(functionRow, body);
  }

  function setKeyState(code, isDown) {
    keyboard.querySelector(`[data-code="${CSS.escape(code)}"]`)?.classList.toggle("is-pressed", isDown);
  }

  function setStatus(message, state = "") {
    status.textContent = message;
    status.classList.toggle("is-error", state === "error");
    status.classList.toggle("is-loading", state === "loading");
  }

  async function loadRoute(file) {
    setStatus(`Reading ${file.name}…`, "loading");
    try {
      const project = editorModel.parseProject(await file.text());
      localStorage.setItem(LOADED_ROUTE_KEY, editorModel.serializeProject(project));
      setStatus(`Loaded “${project.name}”. Starting…`, "loading");
      window.location.assign("./game2-playtest.html?source=loaded");
    } catch (error) {
      fileInput.value = "";
      setStatus("This file is not a valid Catwalk route JSON.", "error");
    }
  }

  function selectMenuItem(index, shouldFocus = false) {
    selectedMenuIndex = (index + menuItems.length) % menuItems.length;
    menuItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-selected", itemIndex === selectedMenuIndex);
      item.setAttribute("aria-current", itemIndex === selectedMenuIndex ? "true" : "false");
    });
    if (shouldFocus) menuItems[selectedMenuIndex].focus();
  }

  function moveFocus(direction) {
    selectMenuItem(selectedMenuIndex + direction, true);
  }

  function aimWorldCatAtPaws(targets) {
    const deskRect = desk.getBoundingClientRect();
    const actorRect = worldCatActor.getBoundingClientRect();
    const targetCenters = targets.map(({ code }) => {
      const keyRect = keyboard.querySelector(`[data-code="${CSS.escape(code)}"]`)?.getBoundingClientRect();
      return keyRect?.width ? keyRect.left + keyRect.width / 2 - deskRect.left : null;
    }).filter(Number.isFinite);
    if (!targetCenters.length || !actorRect.width) return;
    const targetCenter = targetCenters.reduce((sum, value) => sum + value, 0) / targetCenters.length;
    const desiredLeft = targetCenter - actorRect.width * 0.55;
    const clampedLeft = Math.max(16, Math.min(deskRect.width - actorRect.width - 16, desiredLeft));
    worldCatActor.style.setProperty("--cat-reach-x", `${clampedLeft}px`);
  }

  function positionPaws() {
    const deskRect = desk.getBoundingClientRect();
    const monitorRect = monitor.getBoundingClientRect();
    const actorRect = worldCatActor.getBoundingClientRect();
    dynamicPaws.querySelectorAll(".paw[data-code]").forEach((paw) => {
      const keyRect = keyboard.querySelector(`[data-code="${CSS.escape(paw.dataset.code)}"]`)?.getBoundingClientRect();
      if (!keyRect?.width) return;
      const target = {
        x: keyRect.left - deskRect.left + keyRect.width / 2,
        y: keyRect.top - deskRect.top + keyRect.height / 2,
      };
      const actorIsReaching = worldCatActor.dataset.state === "reach" && actorRect.width;
      const origin = actorIsReaching ? {
        x: actorRect.left - deskRect.left + actorRect.width * 0.55,
        y: actorRect.bottom - deskRect.top - actorRect.height * 0.16,
      } : {
        x: target.x,
        y: monitorRect.bottom - deskRect.top - 8,
      };
      const dx = origin.x - target.x;
      const dy = origin.y - target.y;
      paw.style.setProperty("--paw-x", `${target.x}px`);
      paw.style.setProperty("--paw-y", `${target.y}px`);
      paw.style.setProperty("--paw-length", `${Math.hypot(dx, dy)}px`);
      paw.style.setProperty("--paw-angle", `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
    });
  }

  function clearMenuPaws() {
    activePawKeys.forEach((key) => key.classList.remove("is-held"));
    activePawKeys = [];
    dynamicPaws.classList.remove("is-active");
    worldCat.setPaws(false);
    setTimeout(() => dynamicPaws.replaceChildren(), 460);
    scheduleMenuPaws(false);
  }

  function deployMenuPaws() {
    const targets = MENU_PAW_SEQUENCES[Math.floor(Math.random() * MENU_PAW_SEQUENCES.length)];
    activePawKeys = targets.map(({ code }) => keyboard.querySelector(`[data-code="${CSS.escape(code)}"]`)).filter(Boolean);
    activePawKeys.forEach((key) => key.classList.add("is-held"));
    dynamicPaws.replaceChildren(...targets.map(({ code, direction }, index) => {
      const paw = document.createElement("div");
      paw.className = `paw paw-from-${direction}`;
      paw.dataset.code = code;
      paw.style.setProperty("--paw-delay", `${index * 80}ms`);
      paw.innerHTML = '<img class="world-paw-image" src="../assets/game2/art/mocha-pixel-paw.png" alt="">';
      return paw;
    }));
    dynamicPaws.classList.add("is-active");
    aimWorldCatAtPaws(targets);
    worldCat.setPaws(true);
    requestAnimationFrame(positionPaws);
    setTimeout(positionPaws, 760);
    menuPawTimer = setTimeout(clearMenuPaws, 3400);
  }

  function scheduleMenuPaws(initial) {
    clearTimeout(menuPawTimer);
    const delay = initial ? 6500 : 18000 + Math.floor(Math.random() * 10000);
    menuPawTimer = setTimeout(deployMenuPaws, delay);
  }

  buildKeyboard();
  selectMenuItem(0);
  menuItems.forEach((item, index) => {
    item.addEventListener("pointerenter", () => selectMenuItem(index));
    item.addEventListener("focus", () => selectMenuItem(index));
  });
  worldCat.start();
  scheduleMenuPaws(true);
  loadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files?.[0]) loadRoute(fileInput.files[0]);
  });
  window.addEventListener("keydown", (event) => {
    setKeyState(event.code, true);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(-1);
    } else if (event.key === "Enter" && !menuItems.includes(document.activeElement)) {
      event.preventDefault();
      menuItems[0].click();
    }
  });
  window.addEventListener("keyup", (event) => setKeyState(event.code, false));
  window.addEventListener("resize", () => {
    worldCat.layout();
    positionPaws();
  });
  window.addEventListener("beforeunload", () => {
    clearTimeout(menuPawTimer);
    worldCat.destroy();
  });
})();
