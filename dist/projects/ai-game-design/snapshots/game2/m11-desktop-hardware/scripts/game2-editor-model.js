"use strict";

(function exposeCatwalkEditorModel(root, factory) {
  const levelData = typeof module !== "undefined" && module.exports
    ? require("./game2-level-data.js")
    : root.CATWALK_LEVEL_DATA;
  const model = factory(levelData);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = model;
  }
  if (root) {
    root.CATWALK_EDITOR_MODEL = model;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, (levelData) => {
  if (!levelData) {
    throw new Error("Catwalk editor model requires level data.");
  }

  const EDITOR_DATA_VERSION = 1;
  const MIN_WORLD_WIDTH = 4800;
  const WORLD_HEIGHT = 540;
  const GRID_SIZE = 20;

  const ELEMENT_LIBRARY = Object.freeze([
    { type: "platform", label: "Platform", group: "Terrain", width: 240, height: 22, y: 390 },
    { type: "gap", label: "Ground Gap", group: "Terrain", width: 100, height: 70, y: 505 },
    { type: "crate", label: "Scratch Crate", group: "Terrain", width: 48, height: 110, y: 415 },
    { type: "tunnel", label: "Low Tunnel", group: "Terrain", width: 180, height: 58, y: 418 },
    { type: "wall", label: "Climb Wall", group: "Terrain", width: 54, height: 160, y: 390 },
    { type: "loafGoal", label: "Loaf Rest Zone", group: "Goals", width: 150, height: 16, y: 464 },
    { type: "checkpoint", label: "Checkpoint", group: "Goals", width: 34, height: 56, y: 442 },
    { type: "gameStart", label: "Game Start Flag", group: "Goals", width: 42, height: 64, y: 438 },
    { type: "exit", label: "Final Exit", group: "Goals", width: 34, height: 90, y: 425 },
    { type: "ritual", label: "Cat Lock Node", group: "Goals", width: 44, height: 44, y: 420, action: "scratch", order: 1, groupId: "cat-lock-1" },
    { type: "text", label: "Instruction Text", group: "Goals", width: 260, height: 60, y: 300, content: "Your message here", fontSize: 18 },
    { type: "playerDialogue", label: "Player Dialogue", group: "Story", width: 240, height: 70, y: 110, content: "Mocha, I am trying to work here.", displaySeconds: 4 },
    { type: "yarn", label: "Yarn Shield", group: "Actors", width: 30, height: 28, y: 438 },
    { type: "enemy", enemyType: "mouse", label: "Toy Mouse", group: "Actors", width: 38, height: 24, y: 438 },
    { type: "enemy", enemyType: "pigeon", label: "Pigeon", group: "Actors", width: 38, height: 24, y: 418 },
    { type: "enemy", enemyType: "dog", label: "Guard Dog", group: "Actors", width: 50, height: 38, y: 438 },
    {
      type: "pawStorm",
      label: "Paw Storm",
      group: "Interference",
      width: 24,
      height: 390,
      y: 80,
      triggerMode: "position",
      delaySeconds: 0,
      durationSeconds: 0,
      blockedKeys: ["w", "j", "k"],
      heldKeys: ["d"],
      pawDirections: ["top", "left", "bottom", "right"],
    },
    {
      type: "pawStormEnd",
      label: "End Paw Storm",
      group: "Interference",
      width: 24,
      height: 390,
      y: 80,
    },
    {
      type: "screenBlock",
      label: "Screen Block Cat",
      group: "Interference",
      width: 24,
      height: 390,
      y: 80,
      side: "left",
      coveragePercent: 35,
      endMode: "duration",
      durationSeconds: 4,
    },
    {
      type: "screenWalk",
      label: "Screen Walk Cat",
      group: "Interference",
      width: 24,
      height: 390,
      y: 80,
      walkDirection: "left-to-right",
      durationSeconds: 4,
    },
  ]);

  function createId(prefix = "object") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function snap(value, grid = GRID_SIZE) {
    return Math.round(Number(value || 0) / grid) * grid;
  }

  function createObject(definition, x, y = definition.y) {
    const object = {
      id: createId(definition.type),
      type: definition.type,
      x: snap(x),
      y: snap(y),
      width: Number(definition.width || 40),
      height: Number(definition.height || 40),
    };

    if (definition.type === "enemy") {
      object.enemyType = definition.enemyType || "mouse";
      object.patrolMinX = object.x - 100;
      object.patrolMaxX = object.x + 100;
    }
    if (definition.type === "ritual") {
      object.action = definition.action || "scratch";
      object.order = Number(definition.order || 1);
      object.group = definition.groupId || "cat-lock-1";
    }
    if (definition.type === "text") {
      object.content = String(definition.content || "Your message here");
      object.fontSize = Number(definition.fontSize || 18);
    }
    if (definition.type === "playerDialogue") {
      object.content = String(definition.content || "Mocha, I am trying to work here.");
      object.displaySeconds = Math.max(0.5, Number(definition.displaySeconds || 4));
    }
    if (definition.type === "pawStorm") {
      object.triggerMode = definition.triggerMode || "position";
      object.triggerX = object.x;
      object.delaySeconds = Number(definition.delaySeconds || 0);
      object.durationSeconds = Number(definition.durationSeconds || 0);
      object.blockedKeys = [...(definition.blockedKeys || [])];
      object.heldKeys = [...(definition.heldKeys || [])];
      object.pawDirections = [...(definition.pawDirections || [])];
    }
    if (definition.type === "pawStormEnd") {
      object.triggerX = object.x;
    }
    if (definition.type === "screenBlock") {
      object.triggerX = object.x;
      object.side = definition.side || "left";
      object.coveragePercent = Number(definition.coveragePercent || 35);
      object.endMode = definition.endMode || "duration";
      object.durationSeconds = Number(definition.durationSeconds || 4);
      object.endX = object.x + 800;
    }
    if (definition.type === "screenWalk") {
      object.triggerX = object.x;
      object.walkDirection = definition.walkDirection || "left-to-right";
      object.durationSeconds = Number(definition.durationSeconds || 4);
    }
    return object;
  }

  function assignIds(objects, moduleInstanceId = createId("module")) {
    return objects.map((object) => ({
      ...object,
      id: createId(object.type),
      moduleInstanceId,
    }));
  }

  function createModule(levelId, originX) {
    return assignIds(levelData.expandLevelModule(levelId, snap(originX)));
  }

  function createEmptyProject() {
    const checkpoint = createObject(
      ELEMENT_LIBRARY.find((entry) => entry.type === "checkpoint"),
      120,
    );
    const exit = createObject(
      ELEMENT_LIBRARY.find((entry) => entry.type === "exit"),
      4200,
    );
    return {
      schema: "catwalk-single-route",
      version: EDITOR_DATA_VERSION,
      name: "Catwalk Single Route",
      worldHeight: WORLD_HEIGHT,
      minWorldWidth: MIN_WORLD_WIDTH,
      objects: [checkpoint, exit],
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeObject(input) {
    const type = String(input.type || "platform");
    const object = {
      ...input,
      id: String(input.id || createId(type)),
      type,
      x: Number(input.x || 0),
      y: Number(input.y || 0),
      width: Math.max(4, Number(input.width || 40)),
      height: Math.max(4, Number(input.height || 40)),
    };
    if (type === "enemy") {
      object.enemyType = ["mouse", "pigeon", "dog"].includes(input.enemyType)
        ? input.enemyType
        : "mouse";
      object.patrolMinX = Number(input.patrolMinX ?? object.x - 100);
      object.patrolMaxX = Number(input.patrolMaxX ?? object.x + 100);
    }
    if (type === "text") {
      object.content = String(input.content || "Your message here");
      object.fontSize = Math.max(8, Number(input.fontSize || 18));
    }
    if (type === "playerDialogue") {
      object.content = String(input.content || "Mocha, I am trying to work here.");
      object.displaySeconds = Math.max(0.5, Number(input.displaySeconds || 4));
    }
    if (type === "pawStorm") {
      object.triggerMode = ["position", "time", "both"].includes(input.triggerMode)
        ? input.triggerMode
        : "position";
      object.triggerX = Number(input.triggerX ?? object.x);
      object.delaySeconds = Math.max(0, Number(input.delaySeconds || 0));
      object.durationSeconds = Math.max(0, Number(input.durationSeconds || 0));
      object.blockedKeys = Array.isArray(input.blockedKeys) ? input.blockedKeys.map(String) : [];
      object.heldKeys = Array.isArray(input.heldKeys) ? input.heldKeys.map(String) : [];
      object.pawDirections = Array.isArray(input.pawDirections)
        ? input.pawDirections.map(String)
        : [];
    }
    if (type === "pawStormEnd") {
      object.triggerX = Number(input.triggerX ?? object.x);
    }
    if (type === "screenBlock") {
      object.triggerX = Number(input.triggerX ?? object.x);
      object.side = ["left", "right"].includes(input.side) ? input.side : "left";
      object.coveragePercent = Math.max(10, Math.min(90, Number(input.coveragePercent || 35)));
      object.endMode = ["duration", "position"].includes(input.endMode)
        ? input.endMode
        : "duration";
      object.durationSeconds = Math.max(0.5, Number(input.durationSeconds || 4));
      object.endX = Math.max(object.triggerX, Number(input.endX ?? object.triggerX + 800));
    }
    if (type === "screenWalk") {
      object.triggerX = Number(input.triggerX ?? object.x);
      object.walkDirection = ["left-to-right", "right-to-left"].includes(input.walkDirection)
        ? input.walkDirection
        : "left-to-right";
      object.durationSeconds = Math.max(0.5, Number(input.durationSeconds || 4));
    }
    return object;
  }

  function normalizeProject(input) {
    if (!input || input.schema !== "catwalk-single-route" || !Array.isArray(input.objects)) {
      throw new Error("This is not a Catwalk single-route project.");
    }
    return {
      schema: "catwalk-single-route",
      version: EDITOR_DATA_VERSION,
      name: String(input.name || "Catwalk Single Route"),
      worldHeight: WORLD_HEIGHT,
      minWorldWidth: Math.max(MIN_WORLD_WIDTH, Number(input.minWorldWidth || 0)),
      objects: input.objects.map(normalizeObject),
      updatedAt: new Date().toISOString(),
    };
  }

  function calculateWorldWidth(project) {
    const furthest = project.objects.reduce((max, object) => {
      const objectEdge = Number(object.x || 0) + Number(object.width || 0) / 2;
      const triggerEdge = ["pawStorm", "pawStormEnd", "screenBlock", "screenWalk"].includes(object.type)
        ? Number(object.triggerX || 0)
        : 0;
      const effectEndEdge = object.type === "screenBlock" && object.endMode === "position"
        ? Number(object.endX || 0)
        : 0;
      const patrolEdge = object.type === "enemy" ? Number(object.patrolMaxX || 0) : 0;
      return Math.max(max, objectEdge, triggerEdge, effectEndEdge, patrolEdge);
    }, 0);
    return Math.max(project.minWorldWidth || MIN_WORLD_WIDTH, Math.ceil((furthest + 800) / 400) * 400);
  }

  function duplicateObject(object, offset = GRID_SIZE) {
    const duplicate = normalizeObject({
      ...object,
      id: createId(object.type),
      x: Number(object.x) + offset,
      y: Number(object.y) + offset,
      moduleInstanceId: undefined,
    });
    if (duplicate.type === "enemy") {
      duplicate.patrolMinX += offset;
      duplicate.patrolMaxX += offset;
    }
    if (["pawStorm", "pawStormEnd", "screenBlock", "screenWalk"].includes(duplicate.type)) {
      duplicate.triggerX += offset;
    }
    if (duplicate.type === "screenBlock") {
      duplicate.endX += offset;
    }
    return duplicate;
  }

  function serializeProject(project) {
    return JSON.stringify(normalizeProject(project), null, 2);
  }

  function parseProject(text) {
    return normalizeProject(JSON.parse(text));
  }

  function viewXForAnchor(anchorX, viewportWidth, zoom, worldWidth) {
    const safeZoom = Math.max(0.01, Number(zoom) || 1);
    const visibleWorldWidth = Math.max(0, Number(viewportWidth) || 0) / safeZoom;
    const maxViewX = Math.max(0, Number(worldWidth) - visibleWorldWidth);
    const centeredViewX = Number(anchorX) - visibleWorldWidth / 2;
    return Math.max(0, Math.min(centeredViewX, maxViewX));
  }

  function buildEditorReturnHref(anchorX) {
    return Number.isFinite(anchorX)
      ? `./game2-editor.html?anchor=${Math.max(0, Math.round(anchorX))}`
      : "./game2-editor.html";
  }

  function selectionRect(start, end) {
    return {
      left: Math.min(Number(start.x), Number(end.x)),
      right: Math.max(Number(start.x), Number(end.x)),
      top: Math.min(Number(start.y), Number(end.y)),
      bottom: Math.max(Number(start.y), Number(end.y)),
    };
  }

  function objectIntersectsSelection(object, rect) {
    if (["pawStorm", "pawStormEnd", "screenBlock", "screenWalk"].includes(object.type)) {
      const triggerX = Number(object.triggerX ?? object.x);
      return triggerX >= rect.left && triggerX <= rect.right;
    }
    const halfWidth = Number(object.width || 0) / 2;
    const halfHeight = Number(object.height || 0) / 2;
    return object.x + halfWidth >= rect.left
      && object.x - halfWidth <= rect.right
      && object.y + halfHeight >= rect.top
      && object.y - halfHeight <= rect.bottom;
  }

  return Object.freeze({
    EDITOR_DATA_VERSION,
    MIN_WORLD_WIDTH,
    WORLD_HEIGHT,
    GRID_SIZE,
    ELEMENT_LIBRARY,
    createId,
    snap,
    createObject,
    createModule,
    createEmptyProject,
    normalizeObject,
    normalizeProject,
    calculateWorldWidth,
    duplicateObject,
    serializeProject,
    parseProject,
    viewXForAnchor,
    buildEditorReturnHref,
    selectionRect,
    objectIntersectsSelection,
  });
}));
