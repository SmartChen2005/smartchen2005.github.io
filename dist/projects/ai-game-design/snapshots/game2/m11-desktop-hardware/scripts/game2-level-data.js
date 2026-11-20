"use strict";

(function exposeCatwalkLevelData(root, factory) {
  const data = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  }
  if (root) {
    root.CATWALK_LEVEL_DATA = data;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const LEVEL_DATA_VERSION = 2;
  const MODULE_WIDTH = 960;

  const LEVEL_GALLERY = Object.freeze([
    { id: 1, title: "SCRATCH GATE", focus: "J", hint: "Break one box.", keys: ["j"], crates: [430] },
    { id: 2, title: "SHORT HOP", focus: "W", hint: "Clear a short gap.", keys: ["w"], gaps: [{ x: 420, width: 90 }] },
    { id: 3, title: "LONG HOP", focus: "W", hint: "Commit to a longer jump.", keys: ["w"], gaps: [{ x: 400, width: 150 }] },
    { id: 4, title: "DOUBLE HOP", focus: "W", hint: "Link two jumps.", keys: ["w"], gaps: [{ x: 300, width: 85 }, { x: 610, width: 95 }] },
    { id: 5, title: "STAIR CAT", focus: "W", hint: "Climb up, then descend toward home.", keys: ["w"], gaps: [{ x: 420, width: 610 }], platforms: [{ x: 180, y: 430, width: 100 }, { x: 310, y: 380, width: 100 }, { x: 440, y: 330, width: 100 }, { x: 570, y: 380, width: 100 }, { x: 700, y: 430, width: 100 }] },
    { id: 6, title: "BOX THEN HOP", focus: "J → W", hint: "Scratch, then jump.", keys: ["j", "w"], crates: [300], gaps: [{ x: 560, width: 110 }] },
    { id: 7, title: "LIQUID CAT", focus: "K", hint: "Hold K through the short tunnel.", keys: ["k"], tunnels: [{ x: 520, width: 170 }] },
    { id: 8, title: "LONG TUNNEL", focus: "K", hint: "Stay liquid for longer.", keys: ["k"], tunnels: [{ x: 500, width: 320 }] },
    { id: 9, title: "HOP TO TUNNEL", focus: "W → K", hint: "Jump, land, squeeze.", keys: ["w", "k"], gaps: [{ x: 300, width: 90 }], tunnels: [{ x: 650, width: 180 }] },
    { id: 10, title: "TUNNEL EXIT BOX", focus: "K → J", hint: "Stand up and scratch.", keys: ["k", "j"], tunnels: [{ x: 430, width: 200 }], crates: [710] },
    { id: 11, title: "CLAW WALL", focus: "SPACE", hint: "Hold Space against the wall.", keys: ["space"], walls: [{ x: 610, height: 135 }] },
    { id: 12, title: "TALL CLAW", focus: "SPACE", hint: "Climb a taller face.", keys: ["space"], walls: [{ x: 590, height: 205 }] },
    { id: 13, title: "WALL ROLL", focus: "SPACE → L", hint: "Climb, then roll from the high ledge.", keys: ["space", "l"], walls: [{ x: 560, height: 170 }], ritual: [{ action: "climb", x: 525 }, { action: "roll", x: 730, y: 255 }] },
    { id: 14, title: "SCRATCH AND CLIMB", focus: "J → SPACE", hint: "Clear the wall approach.", keys: ["j", "space"], crates: [330], walls: [{ x: 660, height: 160 }] },
    { id: 15, title: "LOAF BRAKE", focus: "S", hint: "Hold S on the amber pad.", keys: ["s"], autoRight: true, loafGoal: { x: 420, width: 150 } },
    { id: 16, title: "LOAF AND SCRATCH", focus: "S + J", hint: "Brake before you scratch.", keys: ["s", "j"], autoRight: true, crates: [560] },
    { id: 17, title: "PAW RELAY", focus: "J → S → SPACE", hint: "Light the three cat sigils in order.", keys: ["j", "s", "space"], crates: [220], walls: [{ x: 700, height: 145 }], stormAt: 340, ritual: [{ action: "scratch", x: 220 }, { action: "loaf", x: 500 }, { action: "climb", x: 665 }] },
    { id: 18, title: "QUIET CODE", focus: "K → S → J", hint: "Read the low, still, sharp sequence.", keys: ["k", "s", "j"], tunnels: [{ x: 250, width: 150 }], crates: [720], ritual: [{ action: "squeeze", x: 250 }, { action: "loaf", x: 500 }, { action: "scratch", x: 720 }] },
    { id: 19, title: "STORM LOCK", focus: "J → S → ↑", hint: "After the paws land, hold S at 2 and press ↑ at 3.", keys: ["j", "s", "arrowup"], crates: [220], gaps: [{ x: 650, width: 90 }], stormAt: 340, ritual: [{ action: "scratch", x: 220 }, { action: "loaf", x: 470 }, { action: "jump", x: 590, label: "↑", help: "PRESS ↑" }] },
    { id: 20, title: "OVER UNDER CODE", focus: "W → J → K", hint: "Climb above, strike the switch, return low.", keys: ["w", "j", "k"], gaps: [{ x: 330, width: 80 }], platforms: [{ x: 420, y: 375, width: 120 }, { x: 560, y: 335, width: 120 }], crates: [600], tunnels: [{ x: 735, width: 130 }], ritual: [{ action: "jump", x: 285 }, { action: "scratch", x: 600 }, { action: "squeeze", x: 735 }] },
    { id: 21, title: "NINE LIVES", focus: "J W K S", hint: "Four lives, one ordered lock.", keys: ["j", "w", "k", "s"], crates: [180], gaps: [{ x: 330, width: 75 }], tunnels: [{ x: 535, width: 120 }], ritual: [{ action: "scratch", x: 180 }, { action: "jump", x: 285 }, { action: "squeeze", x: 535 }, { action: "loaf", x: 730 }] },
    { id: 22, title: "CLAWS BEFORE CALM", focus: "SPACE → S", hint: "Climb first, then settle on the high ledge.", keys: ["space", "s"], walls: [{ x: 560, height: 180 }], ritual: [{ action: "climb", x: 525 }, { action: "loaf", x: 745, y: 245 }] },
    { id: 23, title: "STORM RITUAL", focus: "J K → STORM → S SPACE", hint: "Finish the rite with half the keyboard gone.", keys: ["j", "k", "s", "space"], crates: [170], tunnels: [{ x: 360, width: 120 }], walls: [{ x: 760, height: 135 }], stormAt: 520, ritual: [{ action: "scratch", x: 170 }, { action: "squeeze", x: 360 }, { action: "loaf", x: 600 }, { action: "climb", x: 725 }] },
    { id: 24, title: "MOCHA'S COMBINATION", focus: "J W K S L SPACE", hint: "Perform the full cat sequence before home.", keys: ["j", "w", "k", "s", "l", "space"], crates: [150], gaps: [{ x: 295, width: 70 }], tunnels: [{ x: 455, width: 110 }], walls: [{ x: 805, height: 120 }], stormAt: 655, ritual: [{ action: "scratch", x: 150 }, { action: "jump", x: 255 }, { action: "squeeze", x: 455 }, { action: "loaf", x: 600 }, { action: "roll", x: 690 }, { action: "climb", x: 770 }] },
    {
      id: 25,
      title: "NEEDLE ROOFTOPS",
      focus: "W → W → L → W → W",
      hint: "Cross five tiny roofs; roll the widest break.",
      keys: ["w", "l"],
      gaps: [{ x: 480, width: 700 }],
      platforms: [
        { x: 180, y: 430, width: 80 },
        { x: 315, y: 365, width: 72 },
        { x: 465, y: 300, width: 64 },
        { x: 635, y: 365, width: 70 },
        { x: 785, y: 430, width: 74 },
      ],
      ritual: [
        { action: "jump", x: 180, y: 400 },
        { action: "jump", x: 315, y: 335 },
        { action: "roll", x: 465, y: 270 },
        { action: "jump", x: 635, y: 335 },
        { action: "jump", x: 785, y: 400 },
      ],
    },
    {
      id: 26,
      title: "ALLEY SIXFOLD",
      focus: "J → W → K → STORM → S → L → SPACE",
      hint: "Finish three actions before Mocha removes their keys.",
      keys: ["j", "w", "k", "s", "l", "space"],
      crates: [150],
      gaps: [{ x: 275, width: 90 }],
      tunnels: [{ x: 425, width: 120 }],
      walls: [{ x: 760, height: 165 }],
      stormAt: 585,
      ritual: [
        { action: "scratch", x: 150 },
        { action: "jump", x: 255 },
        { action: "squeeze", x: 425 },
        { action: "loaf", x: 610 },
        { action: "roll", x: 675 },
        { action: "climb", x: 725 },
      ],
    },
    {
      id: 27,
      title: "RUNAWAY SWITCHBACK",
      focus: "S → W → K → S → L → W",
      hint: "Forced right never stops; make your own braking windows.",
      keys: ["s", "w", "k", "l"],
      autoRight: true,
      gaps: [{ x: 270, width: 100 }, { x: 610, width: 190 }],
      platforms: [
        { x: 555, y: 420, width: 68 },
        { x: 675, y: 385, width: 68 },
      ],
      tunnels: [{ x: 420, width: 110 }],
      ritual: [
        { action: "loaf", x: 150 },
        { action: "jump", x: 230 },
        { action: "squeeze", x: 420 },
        { action: "loaf", x: 525 },
        { action: "roll", x: 565 },
        { action: "jump", x: 690 },
      ],
    },
    {
      id: 28,
      title: "STORM NEEDLE",
      focus: "J → K → STORM → S → ↑ → L → SPACE",
      hint: "After the takeover, only the alternate route remains.",
      keys: ["j", "k", "s", "arrowup", "l", "space"],
      crates: [150],
      tunnels: [{ x: 310, width: 110 }],
      gaps: [{ x: 560, width: 200 }],
      platforms: [{ x: 560, y: 430, width: 60 }],
      walls: [{ x: 760, height: 185 }],
      stormAt: 430,
      ritual: [
        { action: "scratch", x: 150 },
        { action: "squeeze", x: 310 },
        { action: "loaf", x: 455 },
        { action: "jump", x: 485, label: "↑", help: "PRESS ↑" },
        { action: "roll", x: 560 },
        { action: "climb", x: 725 },
      ],
    },
    {
      id: 29,
      title: "MOCHA'S MASTER KEY",
      focus: "J W K J → STORM → S ↑ L SPACE",
      hint: "Clear every alley test, then finish with half a keyboard.",
      keys: ["j", "w", "k", "s", "arrowup", "l", "space"],
      crates: [140, 500],
      gaps: [{ x: 245, width: 80 }, { x: 630, width: 150 }],
      platforms: [{ x: 630, y: 420, width: 60 }],
      tunnels: [{ x: 380, width: 100 }],
      walls: [{ x: 780, height: 200 }],
      stormAt: 540,
      ritual: [
        { action: "scratch", x: 140 },
        { action: "jump", x: 220 },
        { action: "squeeze", x: 380 },
        { action: "scratch", x: 500 },
        { action: "loaf", x: 565 },
        { action: "jump", x: 600, label: "↑", help: "PRESS ↑" },
        { action: "roll", x: 640 },
        { action: "climb", x: 745 },
      ],
    },
  ]);

  const LEVEL_ACTORS = Object.freeze({
    1: { items: [{ x: 330 }] },
    2: { enemies: [{ x: 240, minX: 120, maxX: 340 }] },
    3: { items: [{ x: 240 }] },
    4: { enemies: [{ type: "pigeon", x: 160, y: 418, minX: 100, maxX: 230 }] },
    5: { items: [{ x: 440, y: 290 }] },
    6: { enemies: [{ x: 430, minX: 370, maxX: 490 }] },
    7: { items: [{ x: 280 }] },
    8: { enemies: [{ type: "pigeon", x: 220, y: 418, minX: 120, maxX: 300 }] },
    9: { items: [{ x: 480 }] },
    10: { enemies: [{ x: 230, minX: 120, maxX: 290 }] },
    11: { items: [{ x: 450 }] },
    12: { enemies: [{ type: "dog", x: 350, minX: 220, maxX: 500 }] },
    13: { items: [{ x: 700, y: 270 }] },
    14: { enemies: [{ x: 500, minX: 390, maxX: 610 }] },
    15: { items: [{ x: 650 }] },
    16: { enemies: [{ type: "dog", x: 700, minX: 620, maxX: 830 }] },
    17: { items: [{ x: 580 }] },
    18: { enemies: [{ x: 560, minX: 470, maxX: 650 }] },
    19: { items: [{ x: 520 }] },
    20: { enemies: [{ type: "dog", x: 180, minX: 100, maxX: 260 }] },
    21: { items: [{ x: 700 }] },
    22: { enemies: [{ type: "pigeon", x: 700, y: 285, minX: 600, maxX: 830 }] },
    23: { items: [{ x: 560 }] },
    24: {
      items: [{ x: 600 }],
      enemies: [{ x: 720, minX: 680, maxX: 770 }],
    },
    25: {
      items: [{ x: 315, y: 325 }],
      enemies: [{ type: "pigeon", x: 465, y: 245, minX: 405, maxX: 545 }],
    },
    26: {
      items: [{ x: 520 }],
      enemies: [
        { type: "pigeon", x: 420, y: 418, minX: 350, maxX: 490 },
        { type: "dog", x: 625, minX: 555, maxX: 690 },
      ],
    },
    27: {
      items: [{ x: 675, y: 315 }],
      enemies: [
        { type: "dog", x: 155, minX: 95, maxX: 215 },
        { type: "pigeon", x: 420, y: 418, minX: 360, maxX: 480 },
      ],
    },
    28: {
      items: [{ x: 390 }],
      enemies: [
        { type: "pigeon", x: 310, y: 418, minX: 250, maxX: 370 },
        { x: 560, y: 395, minX: 525, maxX: 595 },
        { type: "dog", x: 690, minX: 650, maxX: 730 },
      ],
    },
    29: {
      items: [{ x: 705 }],
      enemies: [
        { x: 185, minX: 150, maxX: 220 },
        { type: "pigeon", x: 380, y: 418, minX: 335, maxX: 425 },
        { type: "dog", x: 525, minX: 500, maxX: 550 },
      ],
    },
  });

  function expandLevelModule(levelId, originX = 0) {
    const level = LEVEL_GALLERY.find((candidate) => candidate.id === Number(levelId));
    if (!level) {
      return [];
    }

    const actors = LEVEL_ACTORS[level.id] || {};
    const ritualGroup = `module-${level.id}-${Math.round(originX)}`;
    const objects = [];
    const add = (object) => objects.push({
      moduleId: level.id,
      moduleTitle: level.title,
      ...object,
      x: originX + object.x,
    });

    (level.gaps || []).forEach((gap) => add({
      type: "gap",
      x: gap.x,
      y: 505,
      width: gap.width,
      height: 70,
    }));
    (level.platforms || []).forEach((platform) => add({
      type: "platform",
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: 22,
    }));
    (level.crates || []).forEach((x) => add({
      type: "crate",
      x,
      y: 415,
      width: 48,
      height: 110,
    }));
    (level.tunnels || []).forEach((tunnel) => add({
      type: "tunnel",
      x: tunnel.x,
      y: 418,
      width: tunnel.width,
      height: 58,
    }));
    (level.walls || []).forEach((wall) => add({
      type: "wall",
      x: wall.x,
      y: 470 - wall.height / 2,
      width: 54,
      height: wall.height,
    }));
    if (level.loafGoal) {
      add({
        type: "loafGoal",
        x: level.loafGoal.x,
        y: 464,
        width: level.loafGoal.width,
        height: 16,
      });
    }
    (level.ritual || []).forEach((node, index) => add({
      type: "ritual",
      x: node.x,
      y: node.y || 420,
      width: 44,
      height: 44,
      action: node.action,
      order: index + 1,
      group: ritualGroup,
      label: node.label || "",
      help: node.help || "",
    }));
    if (level.stormAt) {
      add({
        type: "pawStorm",
        x: level.stormAt,
        y: 80,
        width: 24,
        height: 390,
        triggerMode: "position",
        triggerX: originX + level.stormAt,
        delaySeconds: 0,
        durationSeconds: 0,
        blockedKeys: ["w", "j", "k"],
        heldKeys: ["d"],
        pawDirections: ["top", "left", "bottom", "right"],
      });
    }
    if (level.autoRight) {
      add({
        type: "pawStorm",
        x: 80,
        y: 80,
        width: 24,
        height: 390,
        triggerMode: "position",
        triggerX: originX + 80,
        delaySeconds: 0,
        durationSeconds: 0,
        blockedKeys: [],
        heldKeys: ["d"],
        pawDirections: ["left"],
      });
    }
    (actors.items || []).forEach((item) => add({
      type: "yarn",
      x: item.x,
      y: item.y || 438,
      width: 30,
      height: 28,
    }));
    (actors.enemies || []).forEach((enemy) => add({
      type: "enemy",
      enemyType: enemy.type || "mouse",
      x: enemy.x,
      y: enemy.y || 438,
      width: enemy.type === "dog" ? 50 : 38,
      height: enemy.type === "dog" ? 38 : 24,
      patrolMinX: originX + enemy.minX,
      patrolMaxX: originX + enemy.maxX,
    }));

    return objects;
  }

  return Object.freeze({
    LEVEL_DATA_VERSION,
    MODULE_WIDTH,
    LEVEL_GALLERY,
    LEVEL_ACTORS,
    expandLevelModule,
  });
}));
