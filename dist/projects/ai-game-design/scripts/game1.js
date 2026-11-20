"use strict";

const SCENE_WIDTH_METERS = 4;
const CABLE_LENGTH_TOLERANCE_METERS = 0.01;
const CABLE_NEAR_LIMIT_RATIO = 0.85;
const DEVICE_COLLISION_GAP_PX = 10;
const LEVEL_REWARD_DOLLARS = 10;
const STAGING_AREA_SLOTS = Object.freeze([
  { x: 18, y: 22 },
  { x: 82, y: 22 },
  { x: 40, y: 22 },
  { x: 62, y: 22 },
  { x: 18, y: 43 },
  { x: 82, y: 43 },
  { x: 40, y: 43 },
  { x: 62, y: 43 },
]);

const shopCatalog = Object.freeze([
  {
    id: "shop-usbc-cable",
    itemId: "cable-usbc-2m",
    name: "USB-C to USB-C",
    detail: "2m cable",
    price: 10,
  },
  {
    id: "shop-usb-a-to-usbc-cable",
    itemId: "cable-usb-a-to-usbc-1m",
    name: "USB-A to USB-C",
    detail: "1m charging cable",
    price: 5,
  },
  {
    id: "shop-audio-cable",
    itemId: "cable-audio-50cm",
    name: "3.5mm Audio",
    detail: "0.5m cable",
    price: 5,
  },
  {
    id: "shop-hdmi-cable",
    itemId: "cable-hdmi-2m",
    name: "HDMI Cable",
    detail: "5m cable",
    price: 10,
  },
  {
    id: "shop-usb-c-hub",
    itemId: "usb-c-hub-item",
    name: "USB-C Hub",
    detail: "0.3m upstream · HDMI · 2× USB-A · USB-C out",
    price: 15,
  },
  {
    id: "shop-power-strip",
    itemId: "power-strip-item",
    name: "Power Strip",
    detail: "3 outlets · fixed 1.2m AC",
    price: 20,
  },
  {
    id: "shop-adapter-30w",
    itemId: "adapter-30w-item",
    name: "30W USB-C Adapter",
    detail: "Compact · fixed 2m AC · USB-C out",
    price: 20,
  },
]);

const levelOne = Object.freeze({
  id: "level-01-power-on",
  number: 1,
  title: "Set Up Your New Desk",
  objective: "You have just moved into a small apartment as an international student. It is time to make the empty desk feel like your own.",
  availableItems: [
    {
      id: "adapter-60w",
      type: "power-adapter",
      name: "60W USB-C",
      category: "Power Adapter",
      detail: "Fixed 5m AC · USB-C output",
      quantity: 1,
    },
    {
      id: "cable-usbc-2m",
      type: "cable",
      name: "USB-C to USB-C",
      category: "Cable",
      detail: "2m · USB-C to USB-C",
      quantity: 1,
      connectorA: "USB-C",
      connectorB: "USB-C",
      lengthMeters: 2,
    },
    {
      id: "adapter-30w-item",
      type: "power-adapter",
      name: "30W USB-C Adapter",
      category: "Power Adapter",
      detail: "Compact · fixed 2m AC · USB-C output",
      quantity: 0,
      requiresPurchase: true,
    },
  ],
  devices: [
    {
      id: "macbook",
      type: "macbook",
      name: "MacBook",
      position: { x: 50, y: 53 },
      size: { width: 240, height: 160 },
      powerRequirement: "USB-C",
      isPowered: false,
      isMovable: true,
      ports: [
        {
          id: "macbook-usbc-1",
          connectorType: "USB-C",
          direction: "bidirectional",
          capabilities: ["power", "data", "signal"],
          label: "USB-C 1 · Power capable",
          side: "left",
        },
        {
          id: "macbook-usbc-2",
          connectorType: "USB-C",
          direction: "bidirectional",
          capabilities: ["power", "data", "signal"],
          label: "USB-C 2 · Power capable",
          side: "left",
        },
        {
          id: "macbook-audio",
          connectorType: "3.5mm Audio",
          direction: "output",
          capabilities: ["audio"],
          label: "3.5mm · Audio output",
          side: "right",
        },
      ],
    },
    {
      id: "adapter-60w-device",
      type: "power-adapter",
      name: "60W USB-C Power Adapter",
      shortName: "60W Adapter",
      position: { x: 82, y: 26 },
      size: { width: 88, height: 92 },
      isPowered: false,
      isMovable: true,
      fixedConnectors: [
        {
          id: "adapter-60w-ac",
          connectorType: "AC Plug",
          direction: "input",
          label: "Fixed 5m AC plug",
          lengthMeters: 5,
        },
      ],
      ports: [
        {
          id: "adapter-60w-usbc",
          connectorType: "USB-C",
          direction: "output",
          capabilities: ["power"],
          label: "USB-C · 60W output",
          side: "left",
        },
      ],
    },
  ],
  wallOutlets: [
    { id: "outlet-left", name: "Left wall outlet", position: { x: 5.5, y: 38 } },
    { id: "outlet-right", name: "Right wall outlet", position: { x: 94.5, y: 38 } },
  ],
});

const levelTwo = Object.freeze({
  id: "level-02-monitor",
  number: 2,
  title: "Bring the Monitor Online",
  objective: "A friend is coming over for movie night, but the new monitor is still showing No Signal.",
  availableItems: [
    {
      id: "adapter-60w",
      type: "power-adapter",
      name: "60W USB-C",
      category: "Power Adapter",
      detail: "AC plug · USB-C output",
      quantity: 1,
    },
    {
      id: "cable-usbc-2m",
      type: "cable",
      name: "USB-C to USB-C",
      category: "Cable",
      detail: "2m · USB-C to USB-C",
      quantity: 1,
      connectorA: "USB-C",
      connectorB: "USB-C",
      lengthMeters: 2,
    },
  ],
  devices: [
    ...levelOne.devices.map((device) => (
      device.id === "macbook"
        ? { ...device, position: { x: 55, y: 59 } }
        : { ...device, position: { x: 82, y: 26 } }
    )),
    {
      id: "monitor",
      type: "monitor",
      name: "Monitor",
      position: { x: 18, y: 28 },
      size: { width: 178, height: 132 },
      powerRequirement: "AC Plug",
      isPowered: false,
      isMovable: true,
      fixedConnectors: [
        {
          id: "monitor-ac",
          connectorType: "AC Plug",
          direction: "input",
          label: "Monitor fixed 2m AC plug",
          lengthMeters: 2,
        },
      ],
      ports: [
        {
          id: "monitor-usbc",
          connectorType: "USB-C",
          direction: "bidirectional",
          capabilities: ["signal", "power"],
          label: "USB-C · Video input / power output",
          side: "right",
        },
        {
          id: "monitor-hdmi",
          connectorType: "HDMI",
          direction: "input",
          capabilities: ["signal"],
          label: "HDMI · Video input",
          side: "right",
        },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const levelThree = Object.freeze({
  id: "level-03-audio",
  number: 3,
  title: "Play the Record",
  objective: "Your friend gave you some vinyl records, so you want to hear them on your desk setup.",
  availableItems: [
    ...levelTwo.availableItems,
    {
      id: "power-strip-item",
      type: "power-strip",
      name: "3-Outlet Power Strip",
      category: "Power Expansion",
      detail: "Fixed 1.2m AC · 3 outlets",
      quantity: 1,
      requiresPurchase: true,
    },
    {
      id: "cable-audio-50cm",
      type: "cable",
      name: "3.5mm Audio",
      category: "Audio Cable",
      detail: "0.5m · 3.5mm to 3.5mm",
      quantity: 0,
      connectorA: "3.5mm Audio",
      connectorB: "3.5mm Audio",
      lengthMeters: 0.5,
    },
  ],
  devices: [
    ...levelTwo.devices,
    {
      id: "power-strip",
      type: "power-strip",
      name: "Power Strip",
      position: { x: 68, y: 20 },
      size: { width: 180, height: 48 },
      isMovable: true,
      fixedConnectors: [
        { id: "power-strip-ac", connectorType: "AC Plug", direction: "input", label: "Power strip fixed 1.2m AC plug", lengthMeters: 1.2 },
        { id: "power-strip-outlet-1", connectorType: "AC Outlet", direction: "output", label: "Power strip outlet 1" },
        { id: "power-strip-outlet-2", connectorType: "AC Outlet", direction: "output", label: "Power strip outlet 2" },
        { id: "power-strip-outlet-3", connectorType: "AC Outlet", direction: "output", label: "Power strip outlet 3" },
      ],
      ports: [],
    },
    {
      id: "speaker",
      type: "speaker",
      name: "Speaker",
      position: { x: 13, y: 24 },
      size: { width: 72, height: 100 },
      isMovable: true,
      fixedConnectors: [
        { id: "speaker-ac", connectorType: "AC Plug", direction: "input", label: "Speaker fixed 1m AC plug", lengthMeters: 1 },
      ],
      ports: [
        { id: "speaker-audio", connectorType: "3.5mm Audio", direction: "input", capabilities: ["audio"], label: "3.5mm · Audio input", side: "right" },
      ],
    },
    {
      id: "turntable",
      type: "turntable",
      name: "Turntable",
      position: { x: 42, y: 22 },
      size: { width: 170, height: 88 },
      isMovable: true,
      fixedConnectors: [
        { id: "turntable-ac", connectorType: "AC Plug", direction: "input", label: "Turntable fixed 1m AC plug", lengthMeters: 1 },
      ],
      ports: [
        { id: "turntable-audio", connectorType: "3.5mm Audio", direction: "output", capabilities: ["audio"], label: "3.5mm · Audio output", side: "right" },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const levelFour = Object.freeze({
  id: "level-04-usb-hub",
  number: 4,
  title: "Expand the MacBook",
  objective: "Your desk has become a daily workspace, and typing on the MacBook alone is getting uncomfortable.",
  availableItems: [
    ...levelThree.availableItems.map((item) => (
      item.type === "cable" ? item : { ...item, hidden: true }
    )),
    {
      id: "usb-c-hub-item",
      type: "usb-hub",
      name: "USB-C Hub",
      category: "Interface Expansion",
      detail: "Fixed 0.3m upstream · HDMI · 2× USB-A · USB-C out",
    },
    {
      id: "cable-hdmi-2m",
      type: "cable",
      name: "HDMI Cable",
      category: "Video Cable",
      detail: "5m · HDMI to HDMI",
      connectorA: "HDMI",
      connectorB: "HDMI",
      lengthMeters: 5,
      quantity: 0,
    },
    {
      id: "keyboard-item",
      type: "keyboard",
      name: "USB Keyboard",
      category: "Input Device",
      detail: "Fixed 0.3m USB-A cable",
    },
    {
      id: "mouse-item",
      type: "mouse",
      name: "USB Mouse",
      category: "Input Device",
      detail: "Fixed 0.3m USB-A cable",
    },
    {
      id: "hub-fixed-usbc-cable",
      type: "cable",
      hidden: true,
      connectorA: "USB-C",
      connectorB: "USB-C",
      lengthMeters: 0.3,
      quantity: 1,
      fixedToPortId: "hub-usbc-upstream",
    },
    {
      id: "keyboard-fixed-usb-cable",
      type: "cable",
      hidden: true,
      connectorA: "USB-A",
      connectorB: "USB-A",
      lengthMeters: 0.3,
      quantity: 1,
      fixedToPortId: "keyboard-usb",
    },
    {
      id: "mouse-fixed-usb-cable",
      type: "cable",
      hidden: true,
      connectorA: "USB-A",
      connectorB: "USB-A",
      lengthMeters: 0.3,
      quantity: 1,
      fixedToPortId: "mouse-usb",
    },
  ],
  devices: [
    ...levelThree.devices,
    {
      id: "usb-c-hub",
      type: "usb-hub",
      name: "USB-C Hub",
      position: { x: 82, y: 20 },
      size: { width: 112, height: 58 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "hub-usbc-upstream", connectorType: "USB-C", direction: "bidirectional", capabilities: ["data", "video"], label: "Fixed 0.3m USB-C upstream", side: "right", fixedCableOnly: true },
        { id: "hub-hdmi", connectorType: "HDMI", direction: "output", capabilities: ["video"], label: "HDMI · Video output", side: "left" },
        { id: "hub-usb-a-1", connectorType: "USB-A", direction: "output", capabilities: ["data", "power"], label: "USB-A data / power port 1", side: "left" },
        { id: "hub-usb-a-2", connectorType: "USB-A", direction: "output", capabilities: ["data", "power"], label: "USB-A data / power port 2", side: "left" },
        { id: "hub-usbc-power-out", connectorType: "USB-C", direction: "output", capabilities: ["power"], label: "USB-C · Charging output only", side: "right", blockedDeviceTypes: ["macbook"] },
      ],
    },
    {
      id: "keyboard",
      type: "keyboard",
      name: "Keyboard",
      position: { x: 38, y: 20 },
      size: { width: 160, height: 32 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "keyboard-usb", connectorType: "USB-A", direction: "input", capabilities: ["data"], label: "Fixed 0.3m USB-A keyboard plug", side: "right", fixedCableOnly: true },
      ],
    },
    {
      id: "mouse",
      type: "mouse",
      name: "Mouse",
      position: { x: 62, y: 20 },
      size: { width: 48, height: 66 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "mouse-usb", connectorType: "USB-A", direction: "input", capabilities: ["data"], label: "Fixed 0.3m USB-A mouse plug", side: "right", fixedCableOnly: true },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const levelFive = Object.freeze({
  id: "level-05-camera",
  number: 5,
  title: "Charge the Camera",
  objective: "You are taking your camera out tomorrow, but its battery is nearly empty.",
  requiredCameraPortIds: ["camera-usbc"],
  availableItems: [
    ...levelFour.availableItems.map((item) => (
      item.type === "cable" ? item : { ...item, hidden: true }
    )),
    {
      id: "power-bank-item",
      type: "power-bank",
      name: "Power Bank",
      category: "Portable Power",
      detail: "2× USB-A out · USB-C in/out",
    },
    {
      id: "camera-item",
      type: "camera",
      name: "Camera",
      category: "Charge Device",
      detail: "USB-C charging input",
    },
    {
      id: "cable-usb-a-to-usbc-1m",
      type: "cable",
      name: "USB-A to USB-C",
      category: "Charging Cable",
      detail: "1m · USB-A to USB-C",
      connectorA: "USB-A",
      connectorB: "USB-C",
      lengthMeters: 1,
      quantity: 0,
    },
  ],
  devices: [
    ...levelFour.devices,
    {
      id: "power-bank",
      type: "power-bank",
      name: "Power Bank",
      position: { x: 74, y: 24 },
      size: { width: 66, height: 82 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "power-bank-usb-a-1", connectorType: "USB-A", direction: "output", capabilities: ["power"], label: "USB-A power output 1", side: "left" },
        { id: "power-bank-usb-a-2", connectorType: "USB-A", direction: "output", capabilities: ["power"], label: "USB-A power output 2", side: "left" },
        { id: "power-bank-usbc", connectorType: "USB-C", direction: "bidirectional", capabilities: ["power"], label: "USB-C · Power input / output", side: "right" },
      ],
    },
    {
      id: "camera",
      type: "camera",
      name: "Camera",
      shortName: "Camera 1",
      position: { x: 88, y: 24 },
      size: { width: 76, height: 66 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "camera-usbc", connectorType: "USB-C", direction: "input", capabilities: ["power", "data"], label: "USB-C camera charging input", side: "left" },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const levelSix = Object.freeze({
  id: "level-06-cooling-and-audio",
  number: 6,
  title: "Cool Down and Recharge",
  objective: "The room is getting warm, and your headphones are almost empty before a long listening session.",
  availableItems: [
    ...levelFive.availableItems.map((item) => (
      item.type === "cable" ? item : { ...item, hidden: true }
    )),
    {
      id: "desk-fan-item",
      type: "usb-fan",
      name: "Desk Fan",
      category: "Comfort Device",
      detail: "Fixed 1m AC power cord",
    },
    {
      id: "headphones-item",
      type: "headphones",
      name: "USB-C Headphones",
      category: "Audio Device",
      detail: "USB-C charging input",
    },
  ],
  devices: [
    ...levelFive.devices,
    {
      id: "usb-fan",
      type: "usb-fan",
      name: "Desk Fan",
      position: { x: 16, y: 24 },
      size: { width: 76, height: 82 },
      isMovable: true,
      fixedConnectors: [
        { id: "fan-ac", connectorType: "AC Plug", direction: "input", label: "Desk fan fixed 1m AC plug", lengthMeters: 1 },
      ],
      ports: [],
    },
    {
      id: "headphones",
      type: "headphones",
      name: "USB-C Headphones",
      shortName: "Headphones",
      position: { x: 88, y: 24 },
      size: { width: 92, height: 82 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "headphones-usbc", connectorType: "USB-C", direction: "input", capabilities: ["power"], label: "USB-C headphone charging input", side: "left" },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const levelSeven = Object.freeze({
  id: "level-07-broken-adapter",
  number: 7,
  title: "Power Emergency",
  objective: "A violent electrical fault has left part of your desk dark. The apartment suddenly feels much less forgiving.",
  rewardDollars: 15,
  adapterBroken: true,
  powerEmergency: true,
  powerBankEmpty: true,
  availableItems: levelSix.availableItems,
  devices: levelSix.devices.map((device) => (
    device.id === "adapter-60w-device"
      ? { ...device, name: "Broken 60W Power Adapter", isBroken: true }
      : device
  )),
  wallOutlets: levelOne.wallOutlets,
});

const levelEight = Object.freeze({
  id: "level-08-camera-overload",
  number: 8,
  title: "Camera Overload",
  objective: "Damn I got two more cameras to charge here.",
  adapterBroken: true,
  powerBankEmpty: true,
  preserveBrokenPowerSockets: true,
  requiredCameraPortIds: ["camera-usbc", "camera-two-usbc", "camera-three-usbc"],
  availableItems: levelSeven.availableItems,
  devices: [
    ...levelSeven.devices,
    {
      id: "camera-two",
      type: "camera",
      visualVariant: "compact",
      name: "Compact Camera",
      shortName: "Camera 2",
      position: { x: 18, y: 24 },
      size: { width: 70, height: 62 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "camera-two-usbc", connectorType: "USB-C", direction: "input", capabilities: ["power", "data"], label: "Compact camera USB-C charging input", side: "left" },
      ],
    },
    {
      id: "camera-three",
      type: "camera",
      visualVariant: "action",
      name: "Action Camera",
      shortName: "Camera 3",
      position: { x: 82, y: 24 },
      size: { width: 64, height: 58 },
      isMovable: true,
      fixedConnectors: [],
      ports: [
        { id: "camera-three-usbc", connectorType: "USB-C", direction: "input", capabilities: ["power", "data"], label: "Action camera USB-C charging input", side: "left" },
      ],
    },
  ],
  wallOutlets: levelOne.wallOutlets,
});

const compactAdapterTemplate = Object.freeze({
  id: "adapter-30w-device",
  type: "power-adapter",
  name: "30W USB-C Power Adapter",
  shortName: "30W Adapter",
  wattage: 30,
  compact: true,
  position: { x: 74, y: 22 },
  size: { width: 74, height: 78 },
  isMovable: true,
  fixedConnectors: [
    { id: "adapter-30w-ac", connectorType: "AC Plug", direction: "input", label: "30W adapter fixed 2m AC plug", lengthMeters: 2 },
  ],
  ports: [
    { id: "adapter-30w-usbc", connectorType: "USB-C", direction: "output", capabilities: ["power"], label: "USB-C · 30W output", side: "left" },
  ],
});

const levels = [levelOne, levelTwo, levelThree, levelFour, levelFive, levelSix, levelSeven, levelEight];
const persistentInventoryItemIds = Object.freeze([
  "adapter-60w",
  "adapter-30w-item",
  "cable-usbc-2m",
  "cable-audio-50cm",
  "cable-hdmi-2m",
  "cable-usb-a-to-usbc-1m",
  "power-strip-item",
  "usb-c-hub-item",
]);
const initialInventoryQuantities = Object.freeze({
  "adapter-60w": 1,
  "adapter-30w-item": 0,
  "cable-usbc-2m": 1,
  "cable-audio-50cm": 0,
  "cable-hdmi-2m": 0,
  "cable-usb-a-to-usbc-1m": 0,
  "power-strip-item": 0,
  "usb-c-hub-item": 0,
});
let currentLevelIndex = 0;
let currentLevel = levels[currentLevelIndex];

const gameState = {
  devicePositions: new Map(
    currentLevel.devices.map((device) => [device.id, { ...device.position }]),
  ),
  connections: [],
  fixedConnections: [],
  brokenPowerSocketIds: new Set(),
  selectedPortId: null,
  selectedPowerEndpointId: null,
  previewPointer: null,
  previewIsOverlength: false,
  lastTestResult: null,
  levelComplete: false,
};

const economyState = {
  money: 30,
  purchases: new Map(),
  purchaseHistory: [],
  rewardedLevels: new Set(),
};

let activeDrag = null;
let globalControlsBound = false;

function getPurchaseCount(itemId) {
  return economyState.purchases.get(itemId) ?? 0;
}

function findInventoryItemTemplate(itemId) {
  for (const level of levels) {
    const item = level.availableItems.find((candidate) => candidate.id === itemId);
    if (item) {
      return item;
    }
  }
  return null;
}

function getAvailableItems(level = currentLevel) {
  const persistentItems = persistentInventoryItemIds
    .map((itemId) => findInventoryItemTemplate(itemId))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      hidden: false,
      quantity: (initialInventoryQuantities[item.id] ?? 0) + getPurchaseCount(item.id),
    }));
  const levelItems = level.availableItems.filter((item) => (
    !persistentInventoryItemIds.includes(item.id)
    && item.id !== "hub-fixed-usbc-cable"
  ));
  return [...persistentItems, ...levelItems, ...getPurchasedHubCableItems()];
}

function getPurchasedHubCableItems() {
  const template = levelFour.availableItems.find((item) => item.id === "hub-fixed-usbc-cable");
  if (!template) {
    return [];
  }
  return Array.from(
    { length: getPurchaseCount("usb-c-hub-item") },
    (_, index) => {
      if (index === 0) {
        return template;
      }
      const instanceNumber = index + 1;
      return {
        ...template,
        id: `hub-${instanceNumber}-fixed-usbc-cable`,
        fixedToPortId: `hub-${instanceNumber}-usbc-upstream`,
      };
    },
  );
}

function createPowerStripInstance(index) {
  const template = levelThree.devices.find((device) => device.type === "power-strip");
  if (!template) {
    return null;
  }
  if (index === 0) {
    return template;
  }
  const instanceNumber = index + 1;
  const instanceId = `power-strip-${instanceNumber}`;
  const spawnPositions = [
    { x: 68, y: 20 },
    { x: 72, y: 25 },
    { x: 45, y: 25 },
    { x: 88, y: 25 },
  ];
  const position = spawnPositions[index] ?? {
    x: 18 + ((index * 19) % 70),
    y: 18 + ((index * 13) % 22),
  };
  return {
    ...template,
    id: instanceId,
    name: `Power Strip ${instanceNumber}`,
    position,
    fixedConnectors: template.fixedConnectors.map((connector) => ({
      ...connector,
      id: connector.id.replace("power-strip", instanceId),
      label: connector.label.replace("Power strip", `Power strip ${instanceNumber}`),
    })),
  };
}

function createHubInstance(index) {
  const template = levelFour.devices.find((device) => device.type === "usb-hub");
  if (!template) {
    return null;
  }
  if (index === 0) {
    return template;
  }
  const instanceNumber = index + 1;
  const instanceId = `usb-c-hub-${instanceNumber}`;
  const spawnPositions = [
    { x: 82, y: 20 },
    { x: 74, y: 24 },
    { x: 42, y: 24 },
    { x: 88, y: 40 },
  ];
  return {
    ...template,
    id: instanceId,
    name: `USB-C Hub ${instanceNumber}`,
    position: spawnPositions[index] ?? {
      x: 20 + ((index * 17) % 68),
      y: 18 + ((index * 11) % 28),
    },
    ports: template.ports.map((port) => ({
      ...port,
      id: port.id.replace(/^hub-/, `hub-${instanceNumber}-`),
      label: port.label.replace("USB-C", `USB-C Hub ${instanceNumber}`),
    })),
  };
}

function createCompactAdapterInstance(index) {
  if (index === 0) {
    return compactAdapterTemplate;
  }
  const instanceNumber = index + 1;
  const instanceId = `adapter-30w-device-${instanceNumber}`;
  return {
    ...compactAdapterTemplate,
    id: instanceId,
    name: `30W USB-C Power Adapter ${instanceNumber}`,
    shortName: `30W Adapter ${instanceNumber}`,
    position: {
      x: 24 + ((index * 17) % 58),
      y: 20 + ((index * 11) % 24),
    },
    fixedConnectors: compactAdapterTemplate.fixedConnectors.map((connector) => ({
      ...connector,
      id: `adapter-30w-${instanceNumber}-ac`,
      label: `30W adapter ${instanceNumber} fixed 2m AC plug`,
    })),
    ports: compactAdapterTemplate.ports.map((port) => ({
      ...port,
      id: `adapter-30w-${instanceNumber}-usbc`,
      label: `USB-C · 30W adapter ${instanceNumber} output`,
    })),
  };
}

function getRenderableDevices(level = currentLevel) {
  const regularDevices = level.devices.filter((device) => (
    device.type !== "power-strip" && device.type !== "usb-hub"
  ));
  const powerStrips = Array.from(
    { length: getPurchaseCount("power-strip-item") },
    (_, index) => createPowerStripInstance(index),
  ).filter(Boolean);
  const hubs = Array.from(
    { length: getPurchaseCount("usb-c-hub-item") },
    (_, index) => createHubInstance(index),
  ).filter(Boolean);
  const compactAdapters = Array.from(
    { length: getPurchaseCount("adapter-30w-item") },
    (_, index) => createCompactAdapterInstance(index),
  );
  return [...regularDevices, ...powerStrips, ...hubs, ...compactAdapters];
}

function ensureRenderableDevicePositions(level = currentLevel) {
  const renderableDevices = getRenderableDevices(level);
  const positionedDevices = renderableDevices
    .filter((device) => gameState.devicePositions.has(device.id))
    .map((device) => ({
      device,
      position: gameState.devicePositions.get(device.id),
    }));
  renderableDevices.forEach((device) => {
    if (!gameState.devicePositions.has(device.id)) {
      const position = findStagingPosition(device, positionedDevices);
      gameState.devicePositions.set(device.id, position);
      positionedDevices.push({ device, position });
    }
  });
}

function createInventoryIcon(type) {
  const icon = document.createElement("span");
  icon.className = `inventory-item__icon inventory-item__icon--${type}`;
  icon.setAttribute("aria-hidden", "true");

  if (type === "power-adapter") {
    icon.innerHTML = '<span class="adapter-prongs"></span><span class="adapter-port"></span>';
  } else if (type === "power-strip") {
    icon.innerHTML = '<span class="strip-mini"><i></i><i></i><i></i></span>';
  } else if (type === "usb-hub") {
    icon.innerHTML = '<span class="hub-mini"><i></i><i></i><i></i></span>';
  } else if (type === "keyboard") {
    icon.innerHTML = '<span class="keyboard-mini"></span>';
  } else if (type === "mouse") {
    icon.innerHTML = '<span class="mouse-mini"></span>';
  } else if (type === "power-bank") {
    icon.innerHTML = '<span class="power-bank-mini"><i></i><i></i><i></i></span>';
  } else if (type === "camera") {
    icon.innerHTML = '<span class="camera-mini"><i></i></span>';
  } else {
    icon.innerHTML = '<span class="cable-end cable-end--left"></span><span class="cable-line"></span><span class="cable-end cable-end--right"></span>';
  }

  return icon;
}

function renderInventory(items) {
  const list = document.querySelector("#inventory-list");
  const count = document.querySelector("#inventory-count");

  if (!list || !count) {
    return;
  }

  const inventoryTypes = new Set(["power-adapter", "cable", "power-strip", "usb-hub"]);
  const visibleItems = items.filter((item) => (
    !item.hidden
    && inventoryTypes.has(item.type)
    && (item.quantity === undefined || item.quantity > 0)
  ));
  count.textContent = String(visibleItems.length).padStart(2, "0");
  count.setAttribute("aria-label", `${visibleItems.length} available items`);

  const fragment = document.createDocumentFragment();

  visibleItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "inventory-item";
    card.dataset.itemId = item.id;
    const isBrokenAdapter = currentLevel.adapterBroken && item.id === "adapter-60w";
    card.classList.toggle("is-broken", Boolean(isBrokenAdapter));

    const copy = document.createElement("div");
    copy.className = "inventory-item__copy";

    const category = document.createElement("p");
    category.className = "inventory-item__category";
    category.textContent = item.category;

    const name = document.createElement("h3");
    name.textContent = isBrokenAdapter ? "Broken 60W USB-C" : item.name;

    const detail = document.createElement("p");
    detail.className = "inventory-item__detail";
    detail.textContent = isBrokenAdapter ? "FAULT · Cables severed" : item.detail;

    const quantity = document.createElement("span");
    quantity.className = "inventory-item__quantity";
    if (isBrokenAdapter) {
      quantity.textContent = "BROKEN";
      quantity.classList.add("inventory-item__quantity--broken");
      quantity.setAttribute("aria-label", "Broken and unusable");
    } else if (["power-strip-item", "usb-c-hub-item", "adapter-30w-item"].includes(item.id)) {
      quantity.textContent = item.quantity > 1 ? `ON DESK ×${item.quantity}` : "ON DESK";
      quantity.classList.add("inventory-item__quantity--active");
      quantity.setAttribute("aria-label", `${item.quantity} ${item.name} placed on the desk`);
    } else if (item.type !== "cable") {
      quantity.textContent = "ON DESK";
      quantity.classList.add("inventory-item__quantity--active");
      quantity.setAttribute("aria-label", "Placed on the desk");
    } else if (getCableUsageCount(item.id) > 0) {
      const usedQuantity = getCableUsageCount(item.id);
      quantity.textContent = `${usedQuantity}/${item.quantity} USED`;
      quantity.classList.add("inventory-item__quantity--active");
      quantity.setAttribute("aria-label", `${usedQuantity} of ${item.quantity} cables in use`);
    } else {
      quantity.textContent = `×${item.quantity}`;
      quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);
    }

    copy.append(category, name, detail);
    card.append(createInventoryIcon(item.type), copy, quantity);
    fragment.append(card);
  });

  list.replaceChildren(fragment);
}

function renderShop() {
  const money = document.querySelector("#shop-money");
  const list = document.querySelector("#shop-list");
  const undoButton = document.querySelector("#undo-purchase-button");
  const resetButton = document.querySelector("#reset-purchases-button");
  if (!money || !list || !undoButton || !resetButton) {
    return;
  }

  money.textContent = `$${economyState.money}`;
  money.setAttribute("aria-label", `${economyState.money} dollars available`);
  const fragment = document.createDocumentFragment();

  shopCatalog.forEach((product) => {
    const purchasedCount = getPurchaseCount(product.itemId);
    const canAfford = economyState.money >= product.price;
    const card = document.createElement("article");
    card.className = "shop-item";
    card.dataset.shopItemId = product.id;

    const copy = document.createElement("div");
    copy.className = "shop-item__copy";
    const name = document.createElement("h3");
    name.textContent = product.name;
    const detail = document.createElement("p");
    detail.textContent = `${product.detail} · Owned ${purchasedCount}`;
    copy.append(name, detail);

    const button = document.createElement("button");
    button.className = "shop-item__buy";
    button.type = "button";
    button.dataset.purchaseItemId = product.id;
    button.disabled = !canAfford;
    button.textContent = `$${product.price}`;
    button.setAttribute(
      "aria-label",
      `Buy ${product.name} for ${product.price} dollars`,
    );
    card.classList.toggle("is-unaffordable", !canAfford);
    card.append(copy, button);
    fragment.append(card);
  });

  list.replaceChildren(fragment);
  list.querySelectorAll("[data-purchase-item-id]").forEach((button) => {
    button.addEventListener("click", handleShopPurchase);
  });
  const hasPurchases = economyState.purchaseHistory.length > 0;
  undoButton.disabled = !hasPurchases;
  resetButton.disabled = !hasPurchases;
  undoButton.onclick = handleUndoPurchase;
  resetButton.onclick = handleResetPurchases;
}

function handleShopPurchase(event) {
  const product = shopCatalog.find((item) => (
    item.id === event.currentTarget.dataset.purchaseItemId
  ));
  if (!product) {
    return;
  }
  const purchasedCount = getPurchaseCount(product.itemId);
  if (economyState.money < product.price) {
    return;
  }

  economyState.money -= product.price;
  economyState.purchases.set(product.itemId, purchasedCount + 1);
  economyState.purchaseHistory.push(product.itemId);
  invalidateTestResult();
  setSystemMessage(`${product.name} purchased for $${product.price}.`, "success");

  if (["power-strip-item", "usb-c-hub-item", "adapter-30w-item"].includes(product.itemId)) {
    ensureRenderableDevicePositions();
    renderDevices(getRenderableDevices());
    bindDeviceMovement();
    bindConnectionControls();
  }
  refreshConnectionView();
  renderTestState(false);
  renderShop();
}

function reconcileStateAfterPurchaseRemoval() {
  invalidateTestResult();
  const renderableDevices = getRenderableDevices();
  const validDeviceIds = new Set(renderableDevices.map((device) => device.id));
  const validPortIds = new Set(
    renderableDevices.flatMap((device) => device.ports.map((port) => port.id)),
  );
  const validPowerEndpointIds = new Set([
    ...currentLevel.wallOutlets.map((outlet) => outlet.id),
    ...renderableDevices.flatMap((device) => (
      device.fixedConnectors?.map((connector) => connector.id) ?? []
    )),
  ]);
  const cableQuantities = new Map(
    getAvailableItems()
      .filter((item) => item.type === "cable")
      .map((item) => [item.id, item.quantity ?? 0]),
  );
  const retainedCableUsage = new Map();

  gameState.connections = gameState.connections.filter((connection) => {
    if (!validPortIds.has(connection.fromPortId) || !validPortIds.has(connection.toPortId)) {
      return false;
    }
    const quantity = cableQuantities.get(connection.cableItemId) ?? 0;
    const retainedCount = retainedCableUsage.get(connection.cableItemId) ?? 0;
    if (retainedCount >= quantity) {
      return false;
    }
    retainedCableUsage.set(connection.cableItemId, retainedCount + 1);
    return true;
  });
  gameState.fixedConnections = gameState.fixedConnections.filter((connection) => (
    validPowerEndpointIds.has(connection.portAId)
    && validPowerEndpointIds.has(connection.portBId)
  ));
  Array.from(gameState.devicePositions.keys()).forEach((deviceId) => {
    if (!validDeviceIds.has(deviceId)) {
      gameState.devicePositions.delete(deviceId);
    }
  });
  gameState.selectedPortId = null;
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  ensureRenderableDevicePositions();
  renderDevices(renderableDevices);
  bindDeviceMovement();
  bindConnectionControls();
  refreshConnectionView();
  renderTestState(false);
  renderShop();
}

function handleUndoPurchase() {
  const itemId = economyState.purchaseHistory.pop();
  const product = shopCatalog.find((item) => item.itemId === itemId);
  if (!itemId || !product) {
    return;
  }
  const purchasedCount = getPurchaseCount(itemId);
  if (purchasedCount <= 1) {
    economyState.purchases.delete(itemId);
  } else {
    economyState.purchases.set(itemId, purchasedCount - 1);
  }
  economyState.money += product.price;
  reconcileStateAfterPurchaseRemoval();
  setSystemMessage(`${product.name} purchase undone. Refunded $${product.price}.`, "success");
}

function handleResetPurchases() {
  if (economyState.purchaseHistory.length === 0) {
    return;
  }
  const refund = economyState.purchaseHistory.reduce((total, itemId) => {
    const product = shopCatalog.find((item) => item.itemId === itemId);
    return total + (product?.price ?? 0);
  }, 0);
  economyState.purchaseHistory = [];
  economyState.purchases.clear();
  economyState.money += refund;
  reconcileStateAfterPurchaseRemoval();
  setSystemMessage(`All purchases reset. Refunded $${refund}.`, "success");
}

function createPort(port, deviceId) {
  const portElement = document.createElement("button");
  const connectorClass = {
    "USB-C": "usb-c",
    "USB-A": "usb-a",
    HDMI: "hdmi",
    "3.5mm Audio": "audio",
  }[port.connectorType] ?? "generic";
  portElement.className = `device-port device-port--${connectorClass}`;
  portElement.type = "button";
  portElement.dataset.portId = port.id;
  portElement.dataset.deviceId = deviceId;
  portElement.dataset.connectorType = port.connectorType;
  portElement.dataset.direction = port.direction;
  portElement.dataset.portLabel = port.label;
  portElement.setAttribute("aria-label", port.label);
  return portElement;
}

function getDeviceMoveLabel(device) {
  if (device.shortName) {
    return device.shortName;
  }
  const instanceSuffix = device.name.match(/\s(\d+)$/)?.[1];
  const compactNames = {
    macbook: "MacBook",
    monitor: "Monitor",
    "power-strip": "Power Strip",
    speaker: "Speaker",
    turntable: "Turntable",
    "usb-hub": "USB-C Hub",
    keyboard: "Keyboard",
    mouse: "Mouse",
    "power-bank": "Power Bank",
    camera: "Camera",
    "usb-fan": "Fan",
    headphones: "Headphones",
  };
  const baseName = compactNames[device.type] ?? device.name;
  return instanceSuffix ? `${baseName} ${instanceSuffix}` : baseName;
}

function createMacBook(device) {
  const element = document.createElement("article");
  element.className = "scene-device scene-device--macbook";
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.dataset.positionX = String(position.x);
  element.dataset.positionY = String(position.y);
  element.setAttribute("aria-label", `${device.name}, currently unpowered`);

  const artwork = document.createElement("div");
  artwork.className = "macbook-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = `
    <svg viewBox="0 0 240 160" focusable="false">
      <defs>
        <linearGradient id="${device.id}-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f0f2f2"/>
          <stop offset="0.45" stop-color="#aeb3b5"/>
          <stop offset="1" stop-color="#777d80"/>
        </linearGradient>
        <linearGradient id="${device.id}-screen" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="#26323a"/>
          <stop offset="0.58" stop-color="#11171b"/>
          <stop offset="1" stop-color="#080b0d"/>
        </linearGradient>
        <linearGradient id="${device.id}-deck" x1="0.08" y1="0" x2="0.92" y2="1">
          <stop offset="0" stop-color="#f2f3f2"/>
          <stop offset="0.52" stop-color="#c7cbcc"/>
          <stop offset="1" stop-color="#969b9d"/>
        </linearGradient>
        <linearGradient id="${device.id}-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#aeb2b3"/>
          <stop offset="1" stop-color="#74797b"/>
        </linearGradient>
        <pattern id="${device.id}-keys" width="11" height="7" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="8.5" height="4.4" rx="1" fill="#555b5e"/>
          <rect x="1.8" y="1.5" width="6.9" height="0.65" rx="0.3" fill="#8d9395" opacity="0.5"/>
        </pattern>
        <filter id="${device.id}-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <clipPath id="${device.id}-screen-clip">
          <rect x="35" y="11" width="170" height="91" rx="4.5"/>
        </clipPath>
      </defs>

      <ellipse cx="120" cy="146" rx="102" ry="9" fill="#3b3934" opacity="0.2" filter="url(#${device.id}-shadow)"/>

      <rect x="28" y="4" width="184" height="105" rx="9" fill="url(#${device.id}-frame)" stroke="#767c7f" stroke-width="1"/>
      <rect class="macbook-screen" x="35" y="11" width="170" height="91" rx="4.5" fill="url(#${device.id}-screen)"/>
      <image class="macbook-running-ui" href="../assets/game1/previous-game-screen.png" x="35" y="11" width="170" height="91" preserveAspectRatio="xMidYMid slice" clip-path="url(#${device.id}-screen-clip)"/>
      <path d="M37 13 H132 L91 100 H37 Q35 100 35 98 V16 Q35 13 37 13Z" fill="#ffffff" opacity="0.05"/>
      <circle cx="120" cy="7.6" r="1.35" fill="#41484b"/>
      <circle cx="120" cy="7.6" r="0.45" fill="#71818b"/>

      <g class="macbook-power-display" transform="translate(120 56)">
        <circle r="8" fill="none" stroke="#849199" stroke-width="1.5" opacity="0.75"/>
        <path d="M0 -10 V-3" stroke="#9da8ae" stroke-width="1.7" stroke-linecap="round"/>
        <text class="macbook-power-label" y="19" text-anchor="middle" fill="#a7b0b5" font-family="ui-monospace, monospace" font-size="7" letter-spacing="1.7">NO POWER</text>
      </g>

      <rect x="80" y="106" width="80" height="5" rx="2.5" fill="#5f6466"/>
      <rect x="91" y="106" width="58" height="1.6" rx="0.8" fill="#d2d5d5" opacity="0.62"/>

      <path d="M25 108 H215 L232 144 Q234 148 228 148 H12 Q6 148 8 144Z" fill="url(#${device.id}-deck)" stroke="#8a8f91" stroke-width="1"/>
      <path d="M36 111 H204 L213 135 H27Z" fill="#aeb3b4" opacity="0.22"/>
      <path d="M52 113 H188 L194 132 H46Z" fill="url(#${device.id}-keys)" stroke="#777d7f" stroke-width="0.45" opacity="0.94"/>
      <rect x="62" y="115" width="116" height="1" rx="0.5" fill="#d4d7d7" opacity="0.2"/>
      <path d="M96 134 H144 L146 145 H94Z" fill="#c7cbcb" stroke="#969b9d" stroke-width="0.7"/>
      <path d="M97 135 H143" stroke="#eef0ef" stroke-width="0.65" opacity="0.72"/>

      <path d="M8 144 H232 V148 Q232 151 226 151 H14 Q8 151 8 148Z" fill="url(#${device.id}-edge)"/>
      <path d="M101 148 H139 Q138 152 133 152 H107 Q102 152 101 148Z" fill="#62686a" opacity="0.5"/>
      <path d="M18 145 H222" stroke="#f1f2f1" stroke-width="0.65" opacity="0.6"/>
    </svg>
  `;

  const portGroups = ["left", "right"].map((side) => {
    const group = document.createElement("div");
    group.className = `device-ports device-ports--${side}`;
    group.setAttribute("aria-label", `MacBook ${side} ports`);
    device.ports
      .filter((port) => port.side === side)
      .forEach((port) => group.append(createPort(port, device.id)));
    return group;
  });

  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device);
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);

  element.append(artwork, ...portGroups, moveBar);
  return element;
}

function createPowerAdapter(device) {
  const isBroken = Boolean(device.isBroken);
  const wattage = device.wattage ?? 60;
  const element = document.createElement("article");
  element.className = "scene-device scene-device--power-adapter";
  element.classList.toggle("is-broken", isBroken);
  element.classList.toggle("is-compact", Boolean(device.compact));
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.setAttribute(
    "aria-label",
    isBroken ? `${device.name}, broken with both cables severed` : `${device.name}, AC plug disconnected`,
  );

  const artwork = document.createElement("div");
  artwork.className = "power-adapter-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = `
    <span class="power-adapter-art__prongs"><i></i><i></i></span>
    <span class="power-adapter-art__body"><b>${wattage}W</b><small>USB-C</small></span>
    <span class="power-adapter-art__ac-note">${isBroken ? "FAULT" : "FIXED AC"}</span>
    ${isBroken ? `
      <span class="power-adapter-art__burn"></span>
      <span class="power-adapter-art__cut-cable power-adapter-art__cut-cable--ac"><i></i></span>
      <span class="power-adapter-art__cut-cable power-adapter-art__cut-cable--usb"><i></i></span>
      <span class="power-adapter-art__spark power-adapter-art__spark--one"></span>
      <span class="power-adapter-art__spark power-adapter-art__spark--two"></span>
    ` : ""}
  `;

  const fixedConnector = device.fixedConnectors[0];
  const acPlug = document.createElement("button");
  acPlug.className = "power-endpoint fixed-cord-plug power-adapter-plug";
  acPlug.type = "button";
  acPlug.dataset.powerEndpointId = fixedConnector.id;
  acPlug.dataset.powerEndpointType = "plug";
  acPlug.dataset.portLabel = fixedConnector.label;
  acPlug.disabled = isBroken;
  acPlug.setAttribute(
    "aria-label",
    isBroken ? "Severed AC cable, unusable" : `${fixedConnector.label}, click to connect to a wall outlet`,
  );
  acPlug.innerHTML = '<span data-cord-plug-anchor aria-hidden="true">AC</span>';

  const ports = document.createElement("div");
  ports.className = "device-ports device-ports--adapter";
  ports.setAttribute("aria-label", "Power adapter ports");
  device.ports.forEach((port) => {
    const portElement = createPort(port, device.id);
    portElement.disabled = isBroken;
    if (isBroken) {
      portElement.setAttribute("aria-label", `${port.label}, damaged and unusable`);
    }
    ports.append(portElement);
  });

  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device) || `${wattage}W Adapter`;
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);

  element.append(artwork, acPlug, ports, moveBar);
  return element;
}

function createMonitor(device) {
  const element = document.createElement("article");
  element.className = "scene-device scene-device--monitor";
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.setAttribute("aria-label", `${device.name}, currently showing no signal`);

  const artwork = document.createElement("div");
  artwork.className = "monitor-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = `
    <span class="monitor-art__screen">
      <img class="monitor-screen-content" src="../assets/game1/previous-game-screen.png" alt="" decoding="async">
      <b class="monitor-status-label">NO SIGNAL</b>
    </span>
    <span class="monitor-art__stand"></span>
  `;

  const fixedConnector = device.fixedConnectors[0];
  const acPlug = document.createElement("button");
  acPlug.className = "power-endpoint fixed-cord-plug monitor-power-plug";
  acPlug.type = "button";
  acPlug.dataset.powerEndpointId = fixedConnector.id;
  acPlug.dataset.powerEndpointType = "plug";
  acPlug.dataset.portLabel = fixedConnector.label;
  acPlug.setAttribute("aria-label", `${fixedConnector.label}, click to connect to an outlet`);
  acPlug.innerHTML = '<span data-cord-plug-anchor aria-hidden="true">AC</span>';

  const ports = document.createElement("div");
  ports.className = "device-ports device-ports--monitor";
  ports.setAttribute("aria-label", "Monitor ports");
  device.ports.forEach((port) => ports.append(createPort(port, device.id)));

  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device);
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);

  element.append(artwork, acPlug, ports, moveBar);
  return element;
}

function createAccessoryPowerPlug(connector, modifier) {
  const plug = document.createElement("button");
  plug.className = `power-endpoint fixed-cord-plug accessory-power-plug ${modifier}`;
  plug.type = "button";
  plug.dataset.powerEndpointId = connector.id;
  plug.dataset.powerEndpointType = "plug";
  plug.dataset.portLabel = connector.label;
  plug.setAttribute("aria-label", `${connector.label}, click to connect to an outlet`);
  plug.innerHTML = '<span data-cord-plug-anchor aria-hidden="true">AC</span>';
  return plug;
}

function createPowerStrip(device) {
  const element = document.createElement("article");
  element.className = "scene-device scene-device--power-strip";
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.setAttribute("aria-label", `${device.name}, provides three AC outlets`);

  const artwork = document.createElement("div");
  artwork.className = "power-strip-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = '<b>POWER STRIP</b>';

  const plugConnector = device.fixedConnectors.find((connector) => connector.connectorType === "AC Plug");
  const plug = createAccessoryPowerPlug(plugConnector, "power-strip-cord-plug");
  const sockets = document.createElement("div");
  sockets.className = "power-strip-sockets";
  sockets.setAttribute("aria-label", "Power strip outlets");
  device.fixedConnectors
    .filter((connector) => connector.connectorType === "AC Outlet")
    .forEach((connector) => {
      const isBroken = gameState.brokenPowerSocketIds.has(connector.id);
      const socket = document.createElement("button");
      socket.className = `power-endpoint strip-outlet${isBroken ? " is-broken" : ""}`;
      socket.type = "button";
      socket.disabled = isBroken;
      socket.dataset.powerEndpointId = connector.id;
      socket.dataset.powerEndpointType = "socket";
      socket.dataset.portLabel = connector.label;
      socket.setAttribute("aria-label", isBroken ? `${connector.label}, destroyed and unusable` : connector.label);
      socket.innerHTML = '<i></i><i></i><b></b>';
      sockets.append(socket);
    });

  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device);
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);
  element.append(artwork, sockets, plug, moveBar);
  return element;
}

function createAudioDevice(device) {
  const element = document.createElement("article");
  element.className = `scene-device scene-device--${device.type}`;
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.setAttribute("aria-label", `${device.name}, currently inactive`);

  const artwork = document.createElement("div");
  artwork.className = `${device.type}-art`;
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = device.type === "speaker"
    ? '<span class="speaker-art__driver"></span><b class="audio-status-label">SPEAKER</b>'
    : '<span class="turntable-art__record"></span><span class="turntable-art__arm"></span><b class="audio-status-label">33 RPM</b>';
  const plug = createAccessoryPowerPlug(
    device.fixedConnectors[0],
    `${device.type}-cord-plug`,
  );
  const ports = document.createElement("div");
  ports.className = `device-ports device-ports--${device.type}`;
  ports.setAttribute("aria-label", `${device.name} ports`);
  device.ports.forEach((port) => ports.append(createPort(port, device.id)));
  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device);
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);
  element.append(artwork, plug, ports, moveBar);
  return element;
}

function createPeripheralDevice(device) {
  const element = document.createElement("article");
  element.className = `scene-device scene-device--${device.type}`;
  if (device.visualVariant) {
    element.classList.add(`scene-device--${device.type}-${device.visualVariant}`);
  }
  element.dataset.deviceId = device.id;
  const position = gameState.devicePositions.get(device.id) ?? device.position;
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.style.setProperty("--device-width", `${device.size.width}px`);
  element.style.setProperty("--device-height", `${device.size.height}px`);
  element.setAttribute("aria-label", device.name);

  const artwork = document.createElement("div");
  artwork.className = `${device.type}-art`;
  artwork.setAttribute("aria-hidden", "true");
  if (device.type === "usb-hub") {
    artwork.innerHTML = '<b>USB-C HUB</b><span class="hub-status-light"></span>';
  } else if (device.type === "keyboard") {
    artwork.innerHTML = '<span class="keyboard-art__keys"></span>';
  } else if (device.type === "mouse") {
    artwork.innerHTML = '<span class="mouse-art__wheel"></span>';
  } else if (device.type === "power-bank") {
    artwork.innerHTML = '<span class="power-bank-art__cells"><i></i><i></i><i></i></span><b class="power-bank-art__level">100%</b>';
  } else if (device.type === "camera") {
    artwork.innerHTML = '<span class="camera-art__top"></span><span class="camera-art__lens"></span><span class="camera-art__screen"></span>';
  } else if (device.type === "usb-fan") {
    artwork.innerHTML = '<span class="usb-fan-art__cage"><i></i><i></i><i></i><b></b></span><small>DESK FAN</small>';
  } else if (device.type === "headphones") {
    artwork.innerHTML = '<span class="headphones-art__band"></span><i class="headphones-art__cup headphones-art__cup--left"></i><i class="headphones-art__cup headphones-art__cup--right"></i><b></b>';
  }

  const portGroups = ["left", "right"].map((side) => {
    const group = document.createElement("div");
    group.className = `device-ports device-ports--${device.type} device-ports--${side}`;
    group.setAttribute("aria-label", `${device.name} ${side} ports`);
    device.ports
      .filter((port) => port.side === side)
      .forEach((port) => group.append(createPort(port, device.id)));
    return group;
  });

  const fixedPowerConnector = device.fixedConnectors?.find(
    (connector) => connector.connectorType === "AC Plug",
  );
  const fixedPowerPlug = fixedPowerConnector
    ? createAccessoryPowerPlug(fixedPowerConnector, `${device.type}-cord-plug`)
    : null;

  const moveBar = document.createElement("button");
  moveBar.className = "device-move-bar";
  moveBar.type = "button";
  moveBar.textContent = getDeviceMoveLabel(device);
  moveBar.dataset.moveDeviceId = device.id;
  moveBar.setAttribute("aria-label", `Drag ${device.name}`);
  element.append(artwork, ...(fixedPowerPlug ? [fixedPowerPlug] : []), ...portGroups, moveBar);
  return element;
}

function renderDevices(devices) {
  const layer = document.querySelector("#device-layer");

  if (!layer) {
    return;
  }

  const fragment = document.createDocumentFragment();
  devices.forEach((device) => {
    if (device.type === "macbook") {
      fragment.append(createMacBook(device));
    } else if (device.type === "power-adapter") {
      fragment.append(createPowerAdapter(device));
    } else if (device.type === "monitor") {
      fragment.append(createMonitor(device));
    } else if (device.type === "power-strip") {
      fragment.append(createPowerStrip(device));
    } else if (device.type === "speaker" || device.type === "turntable") {
      fragment.append(createAudioDevice(device));
    } else if (["usb-hub", "keyboard", "mouse", "power-bank", "camera", "usb-fan", "headphones"].includes(device.type)) {
      fragment.append(createPeripheralDevice(device));
    }
  });
  layer.replaceChildren(fragment);
}

function renderOutlets(outlets) {
  const layer = document.querySelector("#outlet-layer");

  if (!layer) {
    return;
  }

  const fragment = document.createDocumentFragment();

  outlets.forEach((outlet) => {
    const isBroken = gameState.brokenPowerSocketIds.has(outlet.id);
    const element = document.createElement("button");
    element.className = `wall-outlet${isBroken ? " is-broken" : ""}`;
    element.type = "button";
    element.disabled = isBroken;
    element.dataset.outletId = outlet.id;
    element.dataset.powerEndpointId = outlet.id;
    element.dataset.powerEndpointType = "socket";
    element.dataset.portLabel = outlet.name;
    element.style.setProperty("--outlet-x", `${outlet.position.x}%`);
    element.style.setProperty("--outlet-y", `${outlet.position.y}%`);
    element.setAttribute("aria-label", isBroken
      ? `${outlet.name}, destroyed and unusable`
      : `${outlet.name}, click to connect a fixed AC plug`);
    element.innerHTML = `<span class="wall-outlet__socket"><i></i><i></i><b></b></span><small>${isBroken ? "FAULT" : "AC"}</small>`;
    fragment.append(element);
  });

  layer.replaceChildren(fragment);
}

function getPortRecord(portId) {
  for (const device of getRenderableDevices()) {
    const port = device.ports.find((candidate) => candidate.id === portId);
    if (port) {
      return { ...port, deviceId: device.id };
    }
  }
  return null;
}

function getConnectionForPort(portId) {
  return gameState.connections.find(
    (connection) => connection.fromPortId === portId || connection.toPortId === portId,
  );
}

function getPowerEndpointRecord(endpointId) {
  for (const device of getRenderableDevices()) {
    const connector = device.fixedConnectors?.find((candidate) => candidate.id === endpointId);
    if (connector) {
      return {
        id: connector.id,
        type: connector.connectorType === "AC Outlet" ? "socket" : "plug",
        label: connector.label,
        deviceId: device.id,
        lengthMeters: connector.lengthMeters ?? null,
        isBroken: gameState.brokenPowerSocketIds.has(connector.id),
      };
    }
  }
  const outlet = currentLevel.wallOutlets.find((candidate) => candidate.id === endpointId);
  return outlet ? {
    id: outlet.id,
    type: "socket",
    label: outlet.name,
    isBroken: gameState.brokenPowerSocketIds.has(outlet.id),
  } : null;
}

function getFixedConnectionForEndpoint(endpointId) {
  return gameState.fixedConnections.find(
    (connection) => connection.portAId === endpointId || connection.portBId === endpointId,
  );
}

function powerEndpointsAreCompatible(firstEndpoint, secondEndpoint) {
  return Boolean(
    firstEndpoint
      && secondEndpoint
      && firstEndpoint.id !== secondEndpoint.id
      && firstEndpoint.type !== secondEndpoint.type
      && !firstEndpoint.isBroken
      && !secondEndpoint.isBroken
      && (!firstEndpoint.deviceId || firstEndpoint.deviceId !== secondEndpoint.deviceId)
      && !getFixedConnectionForEndpoint(firstEndpoint.id)
      && !getFixedConnectionForEndpoint(secondEndpoint.id),
  );
}

function isPlugEnergized(plugId, visitedEndpointIds = new Set()) {
  if (visitedEndpointIds.has(plugId)) {
    return false;
  }
  visitedEndpointIds.add(plugId);
  const connection = getFixedConnectionForEndpoint(plugId);
  if (!connection) {
    return false;
  }
  const otherEndpointId = connection.portAId === plugId
    ? connection.portBId
    : connection.portAId;
  if (gameState.brokenPowerSocketIds.has(otherEndpointId)) {
    return false;
  }
  if (currentLevel.wallOutlets.some((outlet) => outlet.id === otherEndpointId)) {
    return true;
  }
  const otherEndpoint = getPowerEndpointRecord(otherEndpointId);
  if (otherEndpoint?.type === "socket" && otherEndpoint.deviceId) {
    const sourceDevice = getRenderableDevices().find((device) => (
      device.id === otherEndpoint.deviceId && device.type === "power-strip"
    ));
    const sourcePlug = sourceDevice?.fixedConnectors.find((connector) => (
      connector.connectorType === "AC Plug"
    ));
    return sourcePlug ? isPlugEnergized(sourcePlug.id, visitedEndpointIds) : false;
  }
  return false;
}

function isPowerAdapterEnergized(device) {
  if (!device || device.type !== "power-adapter" || device.isBroken) {
    return false;
  }
  const acPlug = device.fixedConnectors?.find((connector) => connector.connectorType === "AC Plug");
  return Boolean(acPlug && isPlugEnergized(acPlug.id));
}

function hasConnectionBetween(firstPortIds, secondPortIds) {
  return gameState.connections.some((connection) => {
    const endpointIds = [connection.fromPortId, connection.toPortId];
    return endpointIds.some((id) => firstPortIds.includes(id))
      && endpointIds.some((id) => secondPortIds.includes(id));
  });
}

function getHubPowerOutputPortIds(hubDevices) {
  return hubDevices.flatMap((device) => device.ports
    .filter((port) => port.direction === "output" && port.capabilities?.includes("power"))
    .map((port) => port.id));
}

function getPoweredHubDevices(hubDevices, rootPowerPortIds, hasRootPower) {
  if (!hasRootPower) {
    return [];
  }
  const poweredHubs = [];
  const poweredHubIds = new Set();
  const availableSourcePortIds = new Set(rootPowerPortIds);
  let foundAnotherHub = true;

  while (foundAnotherHub) {
    foundAnotherHub = false;
    hubDevices.forEach((device) => {
      if (poweredHubIds.has(device.id)) {
        return;
      }
      const upstreamPort = device.ports.find((port) => port.fixedCableOnly);
      if (!upstreamPort || !hasConnectionBetween([upstreamPort.id], [...availableSourcePortIds])) {
        return;
      }
      poweredHubIds.add(device.id);
      poweredHubs.push(device);
      getHubPowerOutputPortIds([device]).forEach((portId) => availableSourcePortIds.add(portId));
      foundAnotherHub = true;
    });
  }

  return poweredHubs;
}

function getPowerChainState() {
  const macbookUsbPorts = ["macbook-usbc-1", "macbook-usbc-2"];
  const hasUsbConnectionFrom = (
    targetPortId,
    sourcePortIds,
    cableItemId = null,
  ) => (
    gameState.connections.some((connection) => {
      const endpointIds = [connection.fromPortId, connection.toPortId];
      return (!cableItemId || connection.cableItemId === cableItemId)
        && endpointIds.includes(targetPortId)
        && endpointIds.some((id) => sourcePortIds.includes(id));
    })
  );
  const hubDevices = getRenderableDevices().filter((device) => device.type === "usb-hub");
  const directlyConnectedHubs = hubDevices.filter((device) => {
    const upstreamPort = device.ports.find((port) => port.fixedCableOnly);
    return upstreamPort && hasConnectionBetween([upstreamPort.id], macbookUsbPorts);
  });
  const connectedHubHdmiPorts = directlyConnectedHubs.flatMap((device) => device.ports
    .filter((port) => port.connectorType === "HDMI")
    .map((port) => port.id));
  const connectedHubUsbPorts = directlyConnectedHubs.flatMap((device) => device.ports
    .filter((port) => port.connectorType === "USB-A")
    .map((port) => port.id));
  const hasWallPower = !currentLevel.adapterBroken && isPlugEnergized("adapter-60w-ac");
  const poweredAdapterOutputPorts = getRenderableDevices()
    .filter((device) => device.type === "power-adapter" && !device.isBroken)
    .filter(isPowerAdapterEnergized)
    .flatMap((device) => device.ports
      .filter((port) => port.direction === "output" && port.capabilities?.includes("power"))
      .map((port) => port.id));
  const hasUsbPower = hasConnectionBetween(poweredAdapterOutputPorts, macbookUsbPorts);
  const hasMonitorPower = currentLevel.number < 2 || isPlugEnergized("monitor-ac");
  const powerBankUsbAPorts = ["power-bank-usb-a-1", "power-bank-usb-a-2"];
  const powerBankOutputPorts = [...powerBankUsbAPorts, "power-bank-usbc"];
  const adapterPowerOutputPorts = poweredAdapterOutputPorts;
  const monitorPowerOutputPorts = hasMonitorPower ? ["monitor-usbc"] : [];
  const storedPowerBankOutputPorts = currentLevel.powerBankEmpty ? [] : powerBankOutputPorts;
  const initialMacbookPowerSources = [
    ...adapterPowerOutputPorts,
    ...monitorPowerOutputPorts,
    ...(currentLevel.number >= 5 ? storedPowerBankOutputPorts : []),
  ];
  const hasInitialMacbookPower = hasConnectionBetween(initialMacbookPowerSources, macbookUsbPorts);
  const initiallyPoweredHubs = getPoweredHubDevices(
    hubDevices,
    macbookUsbPorts,
    hasInitialMacbookPower,
  );
  const initiallyPoweredHubChargingPorts = getHubPowerOutputPortIds(initiallyPoweredHubs);
  const powerBankChargingSourcePorts = [
    ...adapterPowerOutputPorts,
    ...monitorPowerOutputPorts,
    ...initiallyPoweredHubChargingPorts,
  ];
  const isPowerBankCharging = hasUsbConnectionFrom(
    "power-bank-usbc",
    powerBankChargingSourcePorts,
  );
  const hasPowerBankCharge = !currentLevel.powerBankEmpty || isPowerBankCharging;
  const activePowerBankOutputPorts = hasPowerBankCharge ? powerBankOutputPorts : [];
  const availableMacbookPowerSources = [
    ...adapterPowerOutputPorts,
    ...monitorPowerOutputPorts,
    ...(currentLevel.number >= 5 ? activePowerBankOutputPorts : []),
  ];
  const hasMacbookPower = hasConnectionBetween(availableMacbookPowerSources, macbookUsbPorts);
  const poweredHubs = getPoweredHubDevices(hubDevices, macbookUsbPorts, hasMacbookPower);
  const activeHubDeviceIds = poweredHubs.map((device) => device.id);
  const poweredHubUsbPorts = hasMacbookPower ? connectedHubUsbPorts : [];
  const poweredHubChargingPorts = getHubPowerOutputPortIds(poweredHubs);
  const hasHubConnection = currentLevel.number < 4 || directlyConnectedHubs.length > 0;
  const hasDirectMonitorSignal = hasConnectionBetween(["monitor-usbc"], macbookUsbPorts);
  const hasHubMonitorSignal = hasConnectionBetween(connectedHubHdmiPorts, ["monitor-hdmi"]);
  const hasMonitorSignal = currentLevel.number < 2
    || (hasMacbookPower && (hasDirectMonitorSignal || hasHubMonitorSignal));
  const hasSpeakerPower = currentLevel.number < 3 || isPlugEnergized("speaker-ac");
  const hasTurntablePower = currentLevel.number < 3 || isPlugEnergized("turntable-ac");
  const hasAudioSignal = currentLevel.number < 3
    || hasConnectionBetween(["turntable-audio"], ["speaker-audio"]);
  const hasKeyboard = currentLevel.number < 4
    || hasHubConnection
      && hasConnectionBetween(["keyboard-usb"], poweredHubUsbPorts);
  const hasMouse = currentLevel.number < 4
    || hasHubConnection
      && hasConnectionBetween(["mouse-usb"], poweredHubUsbPorts);
  const poweredChargingPorts = [
    ...activePowerBankOutputPorts,
    ...monitorPowerOutputPorts,
    ...poweredHubChargingPorts,
  ];
  const requiredCameraPortIds = currentLevel.requiredCameraPortIds ?? [];
  const chargingCameraPortIds = requiredCameraPortIds.filter((portId) => (
    hasUsbConnectionFrom(portId, poweredChargingPorts)
  ));
  const hasCameraCharge = requiredCameraPortIds.length === 0
    || chargingCameraPortIds.length === requiredCameraPortIds.length;
  const isCameraConnected = chargingCameraPortIds.includes("camera-usbc");
  const isFanConnected = isPlugEnergized("fan-ac");
  const isHeadphonesConnected = hasUsbConnectionFrom(
    "headphones-usbc",
    poweredChargingPorts,
  );
  const isPowerBankUsbASupplying = gameState.connections.some((connection) => (
    [connection.fromPortId, connection.toPortId]
      .some((portId) => powerBankUsbAPorts.includes(portId))
  ));
  const powerBankUsbCConnection = gameState.connections.find((connection) => (
    [connection.fromPortId, connection.toPortId].includes("power-bank-usbc")
  ));
  const isPowerBankUsbCSupplying = Boolean(powerBankUsbCConnection)
    && !isPowerBankCharging;
  const isPowerBankSupplying = hasPowerBankCharge
    && (isPowerBankUsbASupplying || isPowerBankUsbCSupplying);
  const isMonitorSupplyingPower = hasMonitorPower
    && gameState.connections.some((connection) => {
      const endpointIds = [connection.fromPortId, connection.toPortId];
      return endpointIds.includes("monitor-usbc")
        && endpointIds.some((portId) => (
          macbookUsbPorts.includes(portId)
          || requiredCameraPortIds.includes(portId)
          || portId === "headphones-usbc"
          || portId === "power-bank-usbc"
        ));
    });
  const hasFanPower = currentLevel.number < 6 || isFanConnected;
  const hasHeadphonesCharge = currentLevel.number < 6 || isHeadphonesConnected;
  return {
    hasWallPower,
    hasUsbPower,
    hasMacbookPower,
    hasMonitorPower,
    hasMonitorSignal,
    hasSpeakerPower,
    hasTurntablePower,
    hasAudioSignal,
    hasHubConnection,
    activeHubDeviceIds,
    hasKeyboard,
    hasMouse,
    hasCameraCharge,
    isCameraConnected,
    chargingCameraPortIds,
    requiredCameraPortIds,
    hasFanPower,
    isFanConnected,
    hasHeadphonesCharge,
    isHeadphonesConnected,
    isPowerBankSupplying,
    isPowerBankCharging,
    hasPowerBankCharge,
    isMonitorSupplyingPower,
    isComplete: hasMacbookPower
      && hasMonitorPower
      && hasMonitorSignal
      && hasSpeakerPower
      && hasTurntablePower
      && hasAudioSignal
      && hasHubConnection
      && hasKeyboard
      && hasMouse
      && hasCameraCharge
      && hasFanPower
      && hasHeadphonesCharge,
  };
}

function announcePowerChainState() {
  const powerState = getPowerChainState();
  if (powerState.isComplete) {
    setSystemMessage("The desk looks ready for a system check.", "success");
  } else {
    setSystemMessage("The setup changed. Test it when you think it is ready.", "active");
  }
}

function getSystemTestResult() {
  const powerState = getPowerChainState();
  if (!powerState.hasMacbookPower) {
    return {
      id: "missing-usb-power",
      status: "POWER FAILED",
      buttonLabel: "FAILED",
      message: "The MacBook is not receiving power from an active USB-C source.",
      tone: "error",
    };
  }
  if (!powerState.hasMonitorPower) {
    return {
      id: "missing-monitor-power",
      status: "MONITOR OFF",
      buttonLabel: "FAILED",
      message: "The monitor has no AC input, so its display cannot start.",
      tone: "error",
    };
  }
  if (!powerState.hasHubConnection) {
    return {
      id: "missing-hub-connection",
      status: "HUB OFFLINE",
      buttonLabel: "FAILED",
      message: "The USB-C hub is not connected to the MacBook.",
      tone: "error",
    };
  }
  if (!powerState.hasMonitorSignal) {
    return {
      id: "missing-monitor-signal",
      status: "NO SIGNAL",
      buttonLabel: "FAILED",
      message: "The monitor has power but is still showing No Signal.",
      tone: "error",
    };
  }
  if (!powerState.hasSpeakerPower) {
    return {
      id: "missing-speaker-power",
      status: "SPEAKER OFF",
      buttonLabel: "FAILED",
      message: "The speaker has no AC power and cannot play audio.",
      tone: "error",
    };
  }
  if (!powerState.hasTurntablePower) {
    return {
      id: "missing-turntable-power",
      status: "TURNTABLE OFF",
      buttonLabel: "FAILED",
      message: "The turntable has no AC power, so the platter is not spinning.",
      tone: "error",
    };
  }
  if (!powerState.hasAudioSignal) {
    return {
      id: "missing-audio-signal",
      status: "NO AUDIO",
      buttonLabel: "FAILED",
      message: "Both devices have power, but the speaker receives no audio signal from the turntable.",
      tone: "error",
    };
  }
  if (!powerState.hasKeyboard) {
    return {
      id: "missing-keyboard",
      status: "NO KEYBOARD",
      buttonLabel: "FAILED",
      message: "The keyboard is not connected through the USB-C hub.",
      tone: "error",
    };
  }
  if (!powerState.hasMouse) {
    return {
      id: "missing-mouse",
      status: "NO MOUSE",
      buttonLabel: "FAILED",
      message: "The mouse is not connected through the USB-C hub.",
      tone: "error",
    };
  }
  if (!powerState.hasCameraCharge) {
    return {
      id: "missing-camera-charge",
      status: currentLevel.number >= 8 ? "CAMERAS EMPTY" : "CAMERA EMPTY",
      buttonLabel: "FAILED",
      message: currentLevel.number >= 8
        ? "One or more cameras are not receiving power from an active USB output."
        : "The camera is not receiving power from an active USB output.",
      tone: "error",
    };
  }
  if (!powerState.hasFanPower) {
    return {
      id: "missing-fan-power",
      status: "FAN OFF",
      buttonLabel: "FAILED",
      message: "The desk fan has no AC power.",
      tone: "error",
    };
  }
  if (!powerState.hasHeadphonesCharge) {
    return {
      id: "missing-headphones-charge",
      status: "HEADPHONES EMPTY",
      buttonLabel: "FAILED",
      message: "The headphones are not receiving power from an active USB output.",
      tone: "error",
    };
  }
  const successMessages = {
    1: "The MacBook wakes up. Your new desk has its first sign of life.",
    2: "The monitor comes alive. Movie night is ready.",
    3: "The record begins to spin, and music fills the room.",
    4: "The desk is ready for both work and play.",
    5: "The camera is charging for tomorrow's walk.",
    6: "Cool air and music settle into the room.",
    7: "Power returns to the desk. The emergency is under control.",
    8: "All three camera batteries are finally charging.",
  };
  return {
    id: "success",
    status: currentLevel.number === 1 ? "POWERED" : "SYSTEM OK",
    buttonLabel: "COMPLETE",
    message: successMessages[currentLevel.number],
    tone: "success",
  };
}

function renderTestState(shouldAnnounce = false) {
  const result = gameState.lastTestResult;
  const button = document.querySelector("#test-button");
  const buttonState = document.querySelector("#test-button-state");
  const taskStatus = document.querySelector("#task-status");
  const macbook = document.querySelector('[data-device-id="macbook"]');
  const powerLabel = macbook?.querySelector(".macbook-power-label");
  const nextLevelButton = document.querySelector("#next-level-button");
  const endingOverlay = document.querySelector("#ending-overlay");
  if (!button || !buttonState || !taskStatus || !macbook || !powerLabel || !nextLevelButton) {
    return;
  }

  const stateId = result?.id ?? "ready";
  const powerState = getPowerChainState();
  const macbookPowered = powerState.hasMacbookPower;
  button.dataset.testState = stateId;
  buttonState.textContent = result?.buttonLabel ?? "READY";
  taskStatus.textContent = result?.status ?? "READY TO TEST";
  taskStatus.classList.toggle("status-chip--warning", !result);
  taskStatus.classList.toggle("status-chip--error", Boolean(result && result.id !== "success"));
  taskStatus.classList.toggle("status-chip--success", result?.id === "success");
  macbook.classList.toggle("is-powered", macbookPowered);
  macbook.classList.toggle("has-test-error", Boolean(result && result.id !== "success"));
  macbook.setAttribute(
    "aria-label",
    `MacBook, ${macbookPowered ? "powered" : "currently unpowered"}`,
  );
  powerLabel.textContent = macbookPowered ? "POWER ON" : "NO POWER";
  document.querySelectorAll(".scene-device--power-adapter").forEach((adapter) => {
    const adapterDevice = getRenderableDevices().find((device) => device.id === adapter.dataset.deviceId);
    adapter.classList.toggle("is-active", isPowerAdapterEnergized(adapterDevice));
  });
  const monitor = document.querySelector('[data-device-id="monitor"]');
  const monitorLabel = monitor?.querySelector(".monitor-status-label");
  if (monitor && monitorLabel) {
    const monitorSignalActive = powerState.hasMonitorPower && powerState.hasMonitorSignal;
    monitor.classList.toggle("is-powered", powerState.hasMonitorPower);
    monitor.classList.toggle("is-signal-active", monitorSignalActive);
    monitor.classList.toggle("is-supplying-power", powerState.isMonitorSupplyingPower);
    monitor.classList.toggle("has-test-error", Boolean(result && result.id !== "success"));
    monitorLabel.textContent = monitorSignalActive ? "" : "NO SIGNAL";
    monitorLabel.hidden = monitorSignalActive;
    monitor.setAttribute(
      "aria-label",
      `Monitor, ${monitorSignalActive ? "signal active" : (powerState.hasMonitorPower ? "no signal" : "unpowered")}${powerState.isMonitorSupplyingPower ? ", supplying USB-C power" : ""}`,
    );
  }
  const speaker = document.querySelector('[data-device-id="speaker"]');
  const turntable = document.querySelector('[data-device-id="turntable"]');
  const audioPlaying = powerState.hasSpeakerPower
    && powerState.hasTurntablePower
    && powerState.hasAudioSignal;
  if (speaker) {
    speaker.classList.toggle("is-powered", powerState.hasSpeakerPower);
    speaker.classList.toggle("is-playing", audioPlaying);
    speaker.setAttribute(
      "aria-label",
      `Speaker, ${audioPlaying ? "playing" : (powerState.hasSpeakerPower ? "powered but silent" : "unpowered")}`,
    );
  }
  if (turntable) {
    turntable.classList.toggle("is-powered", powerState.hasTurntablePower);
    turntable.classList.toggle("is-playing", audioPlaying);
    turntable.setAttribute(
      "aria-label",
      `Turntable, ${audioPlaying ? "playing" : (powerState.hasTurntablePower ? "powered" : "unpowered")}`,
    );
  }
  document.querySelectorAll(".scene-device--power-strip").forEach((powerStrip) => {
    const stripDevice = getRenderableDevices().find(
      (device) => device.id === powerStrip.dataset.deviceId,
    );
    const stripPlug = stripDevice?.fixedConnectors.find(
      (connector) => connector.connectorType === "AC Plug",
    );
    const isActive = stripPlug ? isPlugEnergized(stripPlug.id) : false;
    powerStrip.classList.toggle("is-active", isActive);
  });
  const hubs = document.querySelectorAll('.scene-device--usb-hub');
  const keyboard = document.querySelector('[data-device-id="keyboard"]');
  const mouse = document.querySelector('[data-device-id="mouse"]');
  hubs.forEach((hub) => {
    const isActive = powerState.activeHubDeviceIds.includes(hub.dataset.deviceId);
    const hubDevice = getRenderableDevices().find((device) => device.id === hub.dataset.deviceId);
    hub.classList.toggle("is-active", isActive);
    hub.setAttribute("aria-label", `${hubDevice?.name ?? "USB-C Hub"}, ${isActive ? "connected" : "offline"}`);
  });
  if (keyboard) {
    keyboard.classList.toggle("is-active", powerState.hasKeyboard);
    keyboard.setAttribute("aria-label", `Keyboard, ${powerState.hasKeyboard ? "connected" : "disconnected"}`);
  }
  if (mouse) {
    mouse.classList.toggle("is-active", powerState.hasMouse);
    mouse.setAttribute("aria-label", `Mouse, ${powerState.hasMouse ? "connected" : "disconnected"}`);
  }
  const powerBank = document.querySelector('[data-device-id="power-bank"]');
  const cameras = document.querySelectorAll('.scene-device--camera');
  const fan = document.querySelector('[data-device-id="usb-fan"]');
  const headphones = document.querySelector('[data-device-id="headphones"]');
  if (powerBank) {
    const isEmpty = Boolean(currentLevel.powerBankEmpty && !powerState.isPowerBankCharging);
    const batteryLevel = powerBank.querySelector(".power-bank-art__level");
    powerBank.classList.toggle("is-empty", isEmpty);
    powerBank.classList.toggle("is-charging", powerState.isPowerBankCharging);
    powerBank.classList.toggle("is-active", powerState.isPowerBankSupplying);
    if (batteryLevel) {
      batteryLevel.textContent = powerState.isPowerBankCharging ? "CHG" : (isEmpty ? "0%" : "100%");
    }
    powerBank.setAttribute("aria-label", `Power Bank, ${powerState.isPowerBankCharging ? "charging through USB-C" : (isEmpty ? "battery empty" : (powerState.isPowerBankSupplying ? "supplying portable power" : "ready"))}`);
  }
  cameras.forEach((camera) => {
    const cameraDevice = getRenderableDevices().find((device) => device.id === camera.dataset.deviceId);
    const chargingPortId = cameraDevice?.ports.find((port) => port.capabilities?.includes("power"))?.id;
    const isCharging = Boolean(chargingPortId && powerState.chargingCameraPortIds.includes(chargingPortId));
    camera.classList.toggle("is-active", isCharging);
    camera.setAttribute("aria-label", `${cameraDevice?.name ?? "Camera"}, ${isCharging ? "charging" : "not charging"}`);
  });
  if (fan) {
    fan.classList.toggle("is-active", powerState.isFanConnected);
    fan.setAttribute("aria-label", `Desk Fan, ${powerState.isFanConnected ? "running" : "off"}`);
  }
  if (headphones) {
    headphones.classList.toggle("is-active", powerState.isHeadphonesConnected);
    headphones.setAttribute("aria-label", `USB-C Headphones, ${powerState.isHeadphonesConnected ? "charging" : "not charging"}`);
  }
  nextLevelButton.hidden = result?.id !== "success" || currentLevelIndex >= levels.length - 1;
  const finalLevelComplete = result?.id === "success" && currentLevelIndex === levels.length - 1;
  const endingWasOpen = endingOverlay ? !endingOverlay.hidden : false;
  if (endingOverlay) {
    endingOverlay.hidden = !finalLevelComplete;
  }
  document.body.classList.toggle("is-ending-open", finalLevelComplete);
  document.body.dataset.testResult = stateId;
  document.body.dataset.levelComplete = String(result?.id === "success");

  if (shouldAnnounce && result) {
    setSystemMessage(result.message, result.tone);
  }
  if (shouldAnnounce && finalLevelComplete && !endingWasOpen) {
    document.querySelector("#ending-home-link")?.focus({ preventScroll: true });
  }
}

function invalidateTestResult() {
  if (!gameState.lastTestResult && !gameState.levelComplete) {
    return;
  }
  gameState.lastTestResult = null;
  gameState.levelComplete = false;
  renderTestState(false);
}

function handleSystemTest() {
  if (gameState.selectedPortId || gameState.selectedPowerEndpointId) {
    cancelConnectionSelection();
  }
  gameState.lastTestResult = getSystemTestResult();
  gameState.levelComplete = gameState.lastTestResult.id === "success";
  if (gameState.levelComplete && !economyState.rewardedLevels.has(currentLevel.id)) {
    const rewardDollars = currentLevel.rewardDollars ?? LEVEL_REWARD_DOLLARS;
    economyState.rewardedLevels.add(currentLevel.id);
    economyState.money += rewardDollars;
    gameState.lastTestResult = {
      ...gameState.lastTestResult,
      message: `${gameState.lastTestResult.message} You got $${rewardDollars} more for your budget.`,
    };
  }
  renderShop();
  renderTestState(true);
}

function portsAreCompatible(firstPort, secondPort) {
  const directionsAreCompatible = firstPort && secondPort && (
    firstPort.direction === "bidirectional"
      || secondPort.direction === "bidirectional"
      || firstPort.direction !== secondPort.direction
  );
  const cableTypesAreCompatible = firstPort && secondPort
    && getAvailableItems()
      .filter((item) => item.type === "cable")
      .some((item) => cableCanConnectPorts(item, firstPort, secondPort));
  const firstDevice = getRenderableDevices().find((device) => device.id === firstPort?.deviceId);
  const secondDevice = getRenderableDevices().find((device) => device.id === secondPort?.deviceId);
  const devicesAreAllowed = firstPort && secondPort
    && !firstPort.blockedDeviceTypes?.includes(secondDevice?.type)
    && !secondPort.blockedDeviceTypes?.includes(firstDevice?.type);
  return Boolean(
    firstPort
      && secondPort
      && firstPort.id !== secondPort.id
      && firstPort.deviceId !== secondPort.deviceId
      && cableTypesAreCompatible
      && directionsAreCompatible
      && devicesAreAllowed
      && !getConnectionForPort(firstPort.id)
      && !getConnectionForPort(secondPort.id),
  );
}

function setSystemMessage(message, tone = "neutral") {
  const container = document.querySelector(".system-message");
  const copy = container?.querySelector("p");
  if (!container || !copy) {
    return;
  }
  copy.textContent = message;
  container.dataset.tone = tone;
}

function getPortCenter(portId) {
  const scene = document.querySelector(".scene");
  const port = document.querySelector(`[data-port-id="${portId}"]`);
  if (!scene || !port) {
    return null;
  }
  const sceneRect = scene.getBoundingClientRect();
  const portRect = port.getBoundingClientRect();
  return {
    x: portRect.left + portRect.width / 2 - sceneRect.left,
    y: portRect.top + portRect.height / 2 - sceneRect.top,
  };
}

function getCableItem(cableItemId = "cable-usbc-2m") {
  return getAvailableItems().find((item) => item.id === cableItemId) ?? null;
}

function getCableUsageCount(cableItemId) {
  return gameState.connections.filter(
    (connection) => connection.cableItemId === cableItemId,
  ).length;
}

function cableCanConnectPorts(item, firstPort, secondPort = null) {
  const fixedCableOnlyPort = [firstPort, secondPort]
    .find((port) => port?.fixedCableOnly);
  if (fixedCableOnlyPort && item.fixedToPortId !== fixedCableOnlyPort.id) {
    return false;
  }
  const connectorMatches = secondPort
    ? (
      item.connectorA === firstPort.connectorType
        && item.connectorB === secondPort.connectorType
    ) || (
      item.connectorB === firstPort.connectorType
        && item.connectorA === secondPort.connectorType
    )
    : [item.connectorA, item.connectorB].includes(firstPort.connectorType);
  if (!connectorMatches) {
    return false;
  }
  if (!item.fixedToPortId) {
    return true;
  }
  if (!secondPort) {
    return true;
  }
  return firstPort.id === item.fixedToPortId || secondPort?.id === item.fixedToPortId;
}

function getAvailableCablesForPort(port) {
  if (!port) {
    return [];
  }
  return getAvailableItems()
    .filter((item) => item.type === "cable")
    .filter((item) => getCableUsageCount(item.id) < item.quantity)
    .filter((item) => cableCanConnectPorts(item, port))
    .sort((first, second) => first.lengthMeters - second.lengthMeters);
}

function getAvailableCableForPorts(firstPort, secondPort) {
  return getAvailableItems()
    .filter((item) => item.type === "cable")
    .filter((item) => getCableUsageCount(item.id) < item.quantity)
    .filter((item) => cableCanConnectPorts(item, firstPort, secondPort))
    .sort((first, second) => first.lengthMeters - second.lengthMeters)
    .find((item) => canCableReachPorts(firstPort.id, secondPort.id, item.id)) ?? null;
}

function getPortDistanceMeters(firstPortId, secondPortId) {
  const scene = document.querySelector(".scene");
  const firstCenter = getPortCenter(firstPortId);
  const secondCenter = getPortCenter(secondPortId);
  if (!scene || !firstCenter || !secondCenter || scene.clientWidth === 0) {
    return Number.POSITIVE_INFINITY;
  }
  const distancePixels = Math.hypot(
    secondCenter.x - firstCenter.x,
    secondCenter.y - firstCenter.y,
  );
  return (distancePixels / scene.clientWidth) * SCENE_WIDTH_METERS;
}

function canCableReachPorts(firstPortId, secondPortId, cableItemId = "cable-usbc-2m") {
  const cable = getCableItem(cableItemId);
  if (!cable?.lengthMeters) {
    return false;
  }
  return getPortDistanceMeters(firstPortId, secondPortId)
    <= cable.lengthMeters + CABLE_LENGTH_TOLERANCE_METERS;
}

function createLengthState(distanceMeters, limitMeters) {
  const isWithinLength = distanceMeters
    <= limitMeters + CABLE_LENGTH_TOLERANCE_METERS;
  const usageRatio = limitMeters > 0
    ? distanceMeters / limitMeters
    : Number.POSITIVE_INFINITY;
  return {
    distanceMeters,
    limitMeters,
    usageRatio,
    isWithinLength,
    isNearLimit: isWithinLength && usageRatio >= CABLE_NEAR_LIMIT_RATIO,
  };
}

function getConnectionLengthState(connection) {
  const cable = getCableItem(connection.cableItemId);
  const distanceMeters = getPortDistanceMeters(connection.fromPortId, connection.toPortId);
  const limitMeters = cable?.lengthMeters ?? 0;
  return createLengthState(distanceMeters, limitMeters);
}

function getCableDisplayName(cableItemId) {
  const cable = getCableItem(cableItemId);
  if (!cable) {
    return "Cable";
  }
  if (cable.fixedToPortId) {
    const fixedPort = getPortRecord(cable.fixedToPortId);
    return `Fixed ${fixedPort?.connectorType ?? "device"} cable`;
  }
  return cable.name ?? `${cable.connectorA} cable`;
}

function getConnectionsForDevice(deviceId) {
  return gameState.connections.filter((connection) => {
    const firstPort = getPortRecord(connection.fromPortId);
    const secondPort = getPortRecord(connection.toPortId);
    return firstPort?.deviceId === deviceId || secondPort?.deviceId === deviceId;
  });
}

function getFixedConnectionsForDevice(deviceId) {
  return gameState.fixedConnections.filter((connection) => {
    const firstEndpoint = getPowerEndpointRecord(connection.portAId);
    const secondEndpoint = getPowerEndpointRecord(connection.portBId);
    return firstEndpoint?.deviceId === deviceId || secondEndpoint?.deviceId === deviceId;
  });
}

function getPowerEndpointCenter(endpointId) {
  const scene = document.querySelector(".scene");
  const endpoint = document.querySelector(`[data-power-endpoint-id="${endpointId}"]`);
  if (!scene || !endpoint) {
    return null;
  }
  const sceneRect = scene.getBoundingClientRect();
  const endpointAnchor = endpoint.querySelector("[data-cord-plug-anchor]") ?? endpoint;
  const endpointRect = endpointAnchor.getBoundingClientRect();
  return {
    x: endpointRect.left + endpointRect.width / 2 - sceneRect.left,
    y: endpointRect.top + endpointRect.height / 2 - sceneRect.top,
  };
}

function getFixedCordOrigin(endpointId) {
  const scene = document.querySelector(".scene");
  const endpoint = getPowerEndpointRecord(endpointId);
  const device = endpoint?.deviceId
    ? document.querySelector(`[data-device-id="${endpoint.deviceId}"]`)
    : null;
  if (!scene || !device) {
    return null;
  }
  const sceneRect = scene.getBoundingClientRect();
  const deviceRect = device.getBoundingClientRect();
  if (endpointId === "monitor-ac") {
    return {
      x: deviceRect.left + 24 - sceneRect.left,
      y: deviceRect.bottom - 35 - sceneRect.top,
    };
  }
  if (endpointId !== "adapter-60w-ac") {
    return {
      x: deviceRect.left + deviceRect.width / 2 - sceneRect.left,
      y: deviceRect.bottom - 18 - sceneRect.top,
    };
  }
  return {
    x: deviceRect.left + deviceRect.width / 2 - sceneRect.left,
    y: deviceRect.top + 30 - sceneRect.top,
  };
}

function getFixedConnectionLengthState(connectionOrFirstEndpoint, secondEndpoint = null) {
  const scene = document.querySelector(".scene");
  const firstEndpoint = secondEndpoint
    ? connectionOrFirstEndpoint
    : getPowerEndpointRecord(connectionOrFirstEndpoint.portAId);
  const resolvedSecondEndpoint = secondEndpoint
    ?? getPowerEndpointRecord(connectionOrFirstEndpoint.portBId);
  const plugEndpoint = firstEndpoint?.type === "plug" ? firstEndpoint : resolvedSecondEndpoint;
  const socketEndpoint = firstEndpoint?.type === "socket" ? firstEndpoint : resolvedSecondEndpoint;
  const start = getFixedCordOrigin(plugEndpoint?.id) ?? getPowerEndpointCenter(plugEndpoint?.id);
  const end = getPowerEndpointCenter(socketEndpoint?.id);
  const distanceMeters = scene && start && end && scene.clientWidth
    ? (Math.hypot(end.x - start.x, end.y - start.y) / scene.clientWidth) * SCENE_WIDTH_METERS
    : Number.POSITIVE_INFINITY;
  const limitMeters = plugEndpoint?.lengthMeters ?? 0;
  return createLengthState(distanceMeters, limitMeters);
}

function getFixedCableDisplayName(connection) {
  const firstEndpoint = getPowerEndpointRecord(connection.portAId);
  const secondEndpoint = getPowerEndpointRecord(connection.portBId);
  const plugEndpoint = firstEndpoint?.type === "plug" ? firstEndpoint : secondEndpoint;
  return plugEndpoint?.label ?? "Fixed AC cord";
}

function getAdaptiveCableBend(start, end, options = {}) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const horizontalRatio = distance > 0
    ? Math.abs(end.x - start.x) / distance
    : 0;
  const orientationFactor = 0.55 + horizontalRatio * 0.45;
  const minimum = options.minimum ?? 12;
  const maximum = options.maximum ?? 96;
  const base = options.base ?? 8;
  const ratio = options.ratio ?? 0.14;
  return Math.min(
    maximum,
    Math.max(minimum, (base + distance * ratio) * orientationFactor),
  );
}

function createCablePath(start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const horizontalInfluence = Math.abs(deltaX)
    / Math.max(Math.abs(deltaX) + Math.abs(deltaY), 1);
  const sag = getAdaptiveCableBend(start, end);
  const horizontalSlack = 1 + horizontalInfluence * 0.55;
  const drop = sag * horizontalInfluence * horizontalSlack;
  return `M ${start.x} ${start.y} C ${start.x + deltaX * 0.28} ${start.y + deltaY * 0.28 + drop}, ${start.x + deltaX * 0.72} ${start.y + deltaY * 0.72 + drop}, ${end.x} ${end.y}`;
}

function createPowerCordPath(start, end) {
  const verticalPull = getAdaptiveCableBend(start, end, {
    minimum: 14,
    maximum: 84,
    base: 10,
    ratio: 0.16,
  });
  return `M ${start.x} ${start.y} C ${start.x} ${start.y + verticalPull}, ${end.x} ${end.y - verticalPull}, ${end.x} ${end.y}`;
}

function renderCables() {
  const layer = document.querySelector("#cable-layer");
  const scene = document.querySelector(".scene");
  if (!layer || !scene) {
    return;
  }

  layer.setAttribute("viewBox", `0 0 ${scene.clientWidth} ${scene.clientHeight}`);
  const fragment = document.createDocumentFragment();

  gameState.fixedConnections.forEach((connection) => {
    const firstEndpoint = getPowerEndpointRecord(connection.portAId);
    const secondEndpoint = getPowerEndpointRecord(connection.portBId);
    const plugEndpoint = firstEndpoint?.type === "plug" ? firstEndpoint : secondEndpoint;
    const socketEndpoint = firstEndpoint?.type === "socket" ? firstEndpoint : secondEndpoint;
    const start = getFixedCordOrigin(plugEndpoint?.id);
    const end = getPowerEndpointCenter(socketEndpoint?.id);
    if (!start || !end) {
      return;
    }
    const pathData = createPowerCordPath(start, end);
    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitArea.classList.add("cable", "cable-hit-area");
    hitArea.dataset.fixedConnectionId = connection.id;
    hitArea.setAttribute("d", pathData);
    hitArea.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const lengthState = getFixedConnectionLengthState(connection);
    path.classList.add("cable", "cable--power-cord");
    path.classList.toggle("is-overlength", !lengthState.isWithinLength);
    path.classList.toggle("is-near-limit", lengthState.isNearLimit);
    path.dataset.fixedConnectionId = connection.id;
    path.dataset.lengthMeters = lengthState.distanceMeters.toFixed(2);
    path.dataset.lengthState = !lengthState.isWithinLength
      ? "overlength"
      : (lengthState.isNearLimit ? "near-limit" : "valid");
    path.setAttribute("d", pathData);
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    path.setAttribute("aria-label", `Disconnect ${plugEndpoint?.label ?? "fixed"} power cord`);
    fragment.append(hitArea, path);
  });

  gameState.connections.forEach((connection) => {
    const start = getPortCenter(connection.fromPortId);
    const end = getPortCenter(connection.toPortId);
    if (!start || !end) {
      return;
    }
    const pathData = createCablePath(start, end);
    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitArea.classList.add("cable", "cable-hit-area");
    hitArea.dataset.connectionId = connection.id;
    hitArea.setAttribute("d", pathData);
    hitArea.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const lengthState = getConnectionLengthState(connection);
    path.classList.add("cable", "cable--connected");
    path.classList.toggle("is-overlength", !lengthState.isWithinLength);
    path.classList.toggle("is-near-limit", lengthState.isNearLimit);
    path.dataset.connectionId = connection.id;
    path.dataset.lengthMeters = lengthState.distanceMeters.toFixed(2);
    path.dataset.lengthState = !lengthState.isWithinLength
      ? "overlength"
      : (lengthState.isNearLimit ? "near-limit" : "valid");
    path.setAttribute("d", pathData);
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    const connectedPort = getPortRecord(connection.fromPortId);
    path.setAttribute("aria-label", `Disconnect ${connectedPort?.connectorType ?? "device"} cable`);
    fragment.append(hitArea, path);
  });

  if (gameState.selectedPortId && gameState.previewPointer) {
    const start = getPortCenter(gameState.selectedPortId);
    if (start) {
      const preview = document.createElementNS("http://www.w3.org/2000/svg", "path");
      preview.classList.add("cable", "cable--preview");
      preview.classList.toggle("is-overlength", gameState.previewIsOverlength);
      preview.classList.toggle(
        "is-near-limit",
        document.body.dataset.previewCableLengthState === "near-limit",
      );
      preview.setAttribute("d", createCablePath(start, gameState.previewPointer));
      fragment.append(preview);
    }
  } else if (gameState.selectedPowerEndpointId && gameState.previewPointer) {
    const selectedEndpoint = getPowerEndpointRecord(gameState.selectedPowerEndpointId);
    const start = selectedEndpoint?.type === "plug"
      ? (getFixedCordOrigin(selectedEndpoint.id) ?? getPowerEndpointCenter(selectedEndpoint.id))
      : getPowerEndpointCenter(gameState.selectedPowerEndpointId);
    if (start) {
      const preview = document.createElementNS("http://www.w3.org/2000/svg", "path");
      preview.classList.add("cable", "cable--preview", "cable--preview-power");
      preview.classList.toggle("is-overlength", gameState.previewIsOverlength);
      preview.classList.toggle(
        "is-near-limit",
        document.body.dataset.previewCableLengthState === "near-limit",
      );
      preview.setAttribute("d", createPowerCordPath(start, gameState.previewPointer));
      fragment.append(preview);
    }
  }

  layer.replaceChildren(fragment);
}

function renderPortStates() {
  const selectedPort = getPortRecord(gameState.selectedPortId);
  document.querySelectorAll("[data-port-id]").forEach((element) => {
    const port = getPortRecord(element.dataset.portId);
    const connection = getConnectionForPort(port?.id);
    const isConnected = Boolean(connection);
    const isSelected = port?.id === gameState.selectedPortId;
    const connectorMatches = selectedPort && portsAreCompatible(selectedPort, port);
    const isCompatible = connectorMatches
      && Boolean(getAvailableCableForPorts(selectedPort, port));
    const isOutOfRange = connectorMatches && !isCompatible;
    const isUnavailable = selectedPort && !isSelected && !isCompatible && !isOutOfRange;
    const isConnectedOverlength = connection
      && !getConnectionLengthState(connection).isWithinLength;
    const otherPortId = connection
      ? (connection.fromPortId === port.id ? connection.toPortId : connection.fromPortId)
      : null;
    const otherPort = getPortRecord(otherPortId);
    const connectionDescription = otherPort ? ` · Connected to ${otherPort.label}` : "";
    const activeCable = connection
      ? getCableItem(connection.cableItemId)
      : getAvailableCablesForPort(selectedPort)[0];
    const lengthDescription = isOutOfRange || isConnectedOverlength
      ? ` · Distance exceeds ${(activeCable?.lengthMeters ?? 0).toFixed(2)}m`
      : "";

    element.classList.toggle("is-connected", isConnected);
    element.classList.toggle("is-selected", isSelected);
    element.classList.toggle("is-compatible", Boolean(isCompatible));
    element.classList.toggle("is-out-of-range", Boolean(isOutOfRange || isConnectedOverlength));
    element.classList.toggle("is-unavailable", Boolean(isUnavailable));
    element.setAttribute("aria-pressed", String(isSelected || isConnected));
    element.dataset.portLabel = `${port.label}${connectionDescription}${lengthDescription}`;
    element.setAttribute("aria-label", element.dataset.portLabel);
  });
}

function renderPowerEndpointStates() {
  const selectedEndpoint = getPowerEndpointRecord(gameState.selectedPowerEndpointId);
  document.querySelectorAll("[data-power-endpoint-id]").forEach((element) => {
    const endpoint = getPowerEndpointRecord(element.dataset.powerEndpointId);
    const isBroken = Boolean(endpoint?.isBroken);
    const connection = getFixedConnectionForEndpoint(endpoint?.id);
    const isConnected = Boolean(connection);
    const isSelected = endpoint?.id === gameState.selectedPowerEndpointId;
    const connectorMatches = selectedEndpoint
      && powerEndpointsAreCompatible(selectedEndpoint, endpoint);
    const candidateLengthState = connectorMatches
      ? getFixedConnectionLengthState(selectedEndpoint, endpoint)
      : null;
    const isCompatible = connectorMatches && candidateLengthState.isWithinLength;
    const isOutOfRange = connectorMatches && !candidateLengthState.isWithinLength;
    const isUnavailable = selectedEndpoint && !isSelected && !isCompatible && !isOutOfRange;
    const connectedLengthState = connection ? getFixedConnectionLengthState(connection) : null;
    const isConnectedOverlength = connectedLengthState && !connectedLengthState.isWithinLength;
    const otherEndpointId = connection
      ? (connection.portAId === endpoint.id ? connection.portBId : connection.portAId)
      : null;
    const otherEndpoint = getPowerEndpointRecord(otherEndpointId);
    const connectionDescription = otherEndpoint ? ` · Connected to ${otherEndpoint.label}` : "";
    const activeLengthState = candidateLengthState ?? connectedLengthState;
    const lengthDescription = isOutOfRange || isConnectedOverlength
      ? ` · Distance exceeds ${(activeLengthState?.limitMeters ?? 0).toFixed(2)}m`
      : "";

    element.classList.toggle("is-connected", isConnected);
    element.classList.toggle("is-selected", isSelected);
    element.classList.toggle("is-compatible", Boolean(isCompatible));
    element.classList.toggle("is-out-of-range", Boolean(isOutOfRange || isConnectedOverlength));
    element.classList.toggle("is-unavailable", Boolean(isUnavailable));
    element.classList.toggle("is-broken", isBroken);
    if (isBroken) {
      element.disabled = true;
    }
    element.setAttribute("aria-pressed", String(isSelected || isConnected));
    element.dataset.portLabel = isBroken
      ? `${endpoint.label} · Destroyed and unusable`
      : `${endpoint.label}${connectionDescription}${lengthDescription}`;
    element.setAttribute("aria-label", element.dataset.portLabel);
  });
}

function refreshConnectionView() {
  renderPortStates();
  renderPowerEndpointStates();
  renderCables();
  renderInventory(getAvailableItems());
  const powerState = getPowerChainState();
  const usbLengthState = gameState.connections[0]
    ? getConnectionLengthState(gameState.connections[0])
    : null;
  document.body.dataset.connectionCount = String(gameState.connections.length);
  document.body.dataset.fixedConnectionCount = String(gameState.fixedConnections.length);
  document.body.dataset.powerChainComplete = String(powerState.isComplete);
  document.body.dataset.usbCableLengthMeters = usbLengthState
    ? usbLengthState.distanceMeters.toFixed(2)
    : "";
  document.body.dataset.usbCableLengthState = usbLengthState
    ? (!usbLengthState.isWithinLength
      ? "overlength"
      : (usbLengthState.isNearLimit ? "near-limit" : "valid"))
    : "unused";
  document.body.dataset.selectedPortId = gameState.selectedPortId ?? "";
  document.body.dataset.selectedPowerEndpointId = gameState.selectedPowerEndpointId ?? "";
  document.querySelectorAll(".scene-device--power-adapter").forEach((adapter) => {
    const adapterDevice = getRenderableDevices().find((device) => device.id === adapter.dataset.deviceId);
    const isBroken = Boolean(adapterDevice?.isBroken);
    const isEnergized = isPowerAdapterEnergized(adapterDevice);
    adapter.setAttribute(
      "aria-label",
      isBroken
        ? `${adapterDevice.name}, both cables severed and unusable`
        : `${adapterDevice?.name ?? "USB-C Power Adapter"}, ${isEnergized ? "connected to AC power" : "AC plug disconnected"}`,
    );
  });
  renderTestState(false);
}

function cancelConnectionSelection(message = "Connection cancelled.") {
  if (!gameState.selectedPortId && !gameState.selectedPowerEndpointId) {
    return;
  }
  gameState.selectedPortId = null;
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  document.body.dataset.previewCableLengthState = "unused";
  setSystemMessage(message);
  refreshConnectionView();
}

function disconnectConnection(connectionId) {
  const connectionIndex = gameState.connections.findIndex(
    (connection) => connection.id === connectionId,
  );
  if (connectionIndex === -1) {
    return;
  }
  invalidateTestResult();
  gameState.connections.splice(connectionIndex, 1);
  gameState.selectedPortId = null;
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  announcePowerChainState();
  refreshConnectionView();
}

function disconnectFixedConnection(connectionId) {
  const connectionIndex = gameState.fixedConnections.findIndex(
    (connection) => connection.id === connectionId,
  );
  if (connectionIndex === -1) {
    return;
  }
  invalidateTestResult();
  gameState.fixedConnections.splice(connectionIndex, 1);
  gameState.selectedPortId = null;
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  announcePowerChainState();
  refreshConnectionView();
}

function handlePortClick(event) {
  event.stopPropagation();
  const clickedPort = getPortRecord(event.currentTarget.dataset.portId);
  if (!clickedPort) {
    return;
  }

  if (gameState.selectedPowerEndpointId) {
    gameState.selectedPowerEndpointId = null;
    gameState.previewPointer = null;
    gameState.previewIsOverlength = false;
  }

  const existingConnection = getConnectionForPort(clickedPort.id);
  if (existingConnection) {
    disconnectConnection(existingConnection.id);
    return;
  }

  if (!gameState.selectedPortId) {
    if (getAvailableCablesForPort(clickedPort).length === 0) {
      setSystemMessage(`No ${clickedPort.connectorType} cable is available. Disconnect one already in use or buy another from the shop.`, "warning");
      return;
    }
    gameState.selectedPortId = clickedPort.id;
    gameState.previewPointer = getPortCenter(clickedPort.id);
    gameState.previewIsOverlength = false;
    document.body.dataset.previewCableLengthState = "valid";
    setSystemMessage(`${clickedPort.label} selected. Choose a highlighted compatible port.`, "active");
    refreshConnectionView();
    return;
  }

  if (gameState.selectedPortId === clickedPort.id) {
    cancelConnectionSelection();
    return;
  }

  const selectedPort = getPortRecord(gameState.selectedPortId);
  if (!portsAreCompatible(selectedPort, clickedPort)) {
    setSystemMessage("That port is incompatible. Choose a blue highlighted compatible port.", "warning");
    return;
  }


  const cable = getAvailableCableForPorts(selectedPort, clickedPort);
  const fallbackCable = getAvailableCablesForPort(selectedPort)[0];
  const requiredLengthMeters = getPortDistanceMeters(selectedPort.id, clickedPort.id);
  if (!cable) {
    gameState.previewPointer = getPortCenter(clickedPort.id);
    gameState.previewIsOverlength = true;
    document.body.dataset.previewCableLengthState = "overlength";
    setSystemMessage(
      `This connection needs ${requiredLengthMeters.toFixed(2)}m, but the longest available cable is ${(fallbackCable?.lengthMeters ?? 0).toFixed(2)}m.`,
      "warning",
    );
    document.body.dataset.lastConnectionResult = "rejected-overlength";
    refreshConnectionView();
    return;
  }

  invalidateTestResult();
  gameState.connections.push({
    id: `connection-${Date.now()}`,
    fromPortId: selectedPort.id,
    toPortId: clickedPort.id,
    cableItemId: cable.id,
    lengthMeters: cable.lengthMeters,
    isValid: true,
  });
  gameState.selectedPortId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  document.body.dataset.previewCableLengthState = "unused";
  document.body.dataset.lastConnectionResult = "connected";
  announcePowerChainState();
  refreshConnectionView();
}

function handlePowerEndpointClick(event) {
  event.stopPropagation();
  const clickedEndpoint = getPowerEndpointRecord(event.currentTarget.dataset.powerEndpointId);
  if (!clickedEndpoint) {
    return;
  }

  const existingConnection = getFixedConnectionForEndpoint(clickedEndpoint.id);
  if (existingConnection) {
    disconnectFixedConnection(existingConnection.id);
    return;
  }

  if (gameState.selectedPortId) {
    gameState.selectedPortId = null;
    gameState.previewPointer = null;
    gameState.previewIsOverlength = false;
  }

  if (!gameState.selectedPowerEndpointId) {
    gameState.selectedPowerEndpointId = clickedEndpoint.id;
    gameState.previewPointer = getPowerEndpointCenter(clickedEndpoint.id);
    gameState.previewIsOverlength = false;
    document.body.dataset.previewCableLengthState = "valid";
    setSystemMessage(`${clickedEndpoint.label} selected. Choose a highlighted power endpoint.`, "active");
    refreshConnectionView();
    return;
  }

  if (gameState.selectedPowerEndpointId === clickedEndpoint.id) {
    cancelConnectionSelection();
    return;
  }

  const selectedEndpoint = getPowerEndpointRecord(gameState.selectedPowerEndpointId);
  if (!powerEndpointsAreCompatible(selectedEndpoint, clickedEndpoint)) {
    setSystemMessage("That power endpoint is incompatible. Choose a highlighted AC plug or outlet.", "warning");
    return;
  }

  const plugEndpoint = selectedEndpoint.type === "plug" ? selectedEndpoint : clickedEndpoint;
  const socketEndpoint = selectedEndpoint.type === "socket" ? selectedEndpoint : clickedEndpoint;
  const lengthState = getFixedConnectionLengthState(plugEndpoint, socketEndpoint);
  if (!lengthState.isWithinLength) {
    gameState.previewPointer = getPowerEndpointCenter(socketEndpoint.id);
    gameState.previewIsOverlength = true;
    document.body.dataset.previewCableLengthState = "overlength";
    document.body.dataset.lastConnectionResult = "rejected-power-overlength";
    setSystemMessage(
      `This fixed power connection needs ${lengthState.distanceMeters.toFixed(2)}m, but the cord is ${lengthState.limitMeters.toFixed(2)}m. Move the device closer.`,
      "warning",
    );
    refreshConnectionView();
    return;
  }
  invalidateTestResult();
  gameState.fixedConnections.push({
    id: `fixed-connection-${Date.now()}`,
    type: "fixed-power",
    cableId: "adapter-60w-fixed-ac",
    portAId: plugEndpoint.id,
    portBId: socketEndpoint.id,
    lengthMeters: plugEndpoint.lengthMeters,
    isValid: true,
  });
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  document.body.dataset.previewCableLengthState = "unused";
  announcePowerChainState();
  refreshConnectionView();
}

function handleScenePointerMove(event) {
  if (!gameState.selectedPortId && !gameState.selectedPowerEndpointId) {
    return;
  }
  const sceneRect = event.currentTarget.getBoundingClientRect();
  gameState.previewPointer = {
    x: event.clientX - sceneRect.left,
    y: event.clientY - sceneRect.top,
  };
  if (gameState.selectedPortId) {
    const start = getPortCenter(gameState.selectedPortId);
    const selectedPort = getPortRecord(gameState.selectedPortId);
    const cable = getAvailableCablesForPort(selectedPort)[0];
    const previewDistanceMeters = start
      ? (Math.hypot(
        gameState.previewPointer.x - start.x,
        gameState.previewPointer.y - start.y,
      ) / sceneRect.width) * SCENE_WIDTH_METERS
      : 0;
    const previewLengthState = createLengthState(
      previewDistanceMeters,
      cable?.lengthMeters ?? 0,
    );
    gameState.previewIsOverlength = !previewLengthState.isWithinLength;
    document.body.dataset.previewCableLengthMeters = previewDistanceMeters.toFixed(2);
    document.body.dataset.previewCableLengthState = gameState.previewIsOverlength
      ? "overlength"
      : (previewLengthState.isNearLimit ? "near-limit" : "valid");
  } else if (gameState.selectedPowerEndpointId) {
    const selectedEndpoint = getPowerEndpointRecord(gameState.selectedPowerEndpointId);
    if (selectedEndpoint?.type === "plug") {
      const start = getFixedCordOrigin(selectedEndpoint.id) ?? getPowerEndpointCenter(selectedEndpoint.id);
      const previewDistanceMeters = start
        ? (Math.hypot(
          gameState.previewPointer.x - start.x,
          gameState.previewPointer.y - start.y,
        ) / sceneRect.width) * SCENE_WIDTH_METERS
        : 0;
      const previewLengthState = createLengthState(
        previewDistanceMeters,
        selectedEndpoint.lengthMeters ?? 0,
      );
      gameState.previewIsOverlength = !previewLengthState.isWithinLength;
      document.body.dataset.previewCableLengthMeters = previewDistanceMeters.toFixed(2);
      document.body.dataset.previewCableLengthState = gameState.previewIsOverlength
        ? "overlength"
        : (previewLengthState.isNearLimit ? "near-limit" : "valid");
    } else {
      gameState.previewIsOverlength = false;
      document.body.dataset.previewCableLengthState = "valid";
    }
  }
  renderCables();
}

function bindConnectionControls() {
  const scene = document.querySelector(".scene");
  const cableLayer = document.querySelector("#cable-layer");
  document.querySelectorAll("[data-port-id]").forEach((port) => {
    port.addEventListener("click", handlePortClick);
  });
  document.querySelectorAll("[data-power-endpoint-id]").forEach((endpoint) => {
    endpoint.addEventListener("click", handlePowerEndpointClick);
  });
  if (globalControlsBound) {
    return;
  }
  globalControlsBound = true;
  scene?.addEventListener("pointermove", handleScenePointerMove);
  scene?.addEventListener("click", () => cancelConnectionSelection());
  cableLayer?.addEventListener("click", (event) => {
    const cable = event.target.closest("[data-connection-id]");
    const fixedCable = event.target.closest("[data-fixed-connection-id]");
    if (cable) {
      event.stopPropagation();
      disconnectConnection(cable.dataset.connectionId);
    } else if (fixedCable) {
      event.stopPropagation();
      disconnectFixedConnection(fixedCable.dataset.fixedConnectionId);
    }
  });
  cableLayer?.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.dataset.connectionId) {
      event.preventDefault();
      disconnectConnection(event.target.dataset.connectionId);
    } else if (
      (event.key === "Enter" || event.key === " ")
      && event.target.dataset.fixedConnectionId
    ) {
      event.preventDefault();
      disconnectFixedConnection(event.target.dataset.fixedConnectionId);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cancelConnectionSelection();
    }
  });
  window.addEventListener("resize", renderCables);
}

function updateCableLengthPreviewStatus() {
  const affectedConnections = activeDrag
    ? getConnectionsForDevice(activeDrag.deviceId)
    : [];
  const affectedFixedConnections = activeDrag
    ? getFixedConnectionsForDevice(activeDrag.deviceId)
    : [];
  if (!activeDrag || (affectedConnections.length === 0 && affectedFixedConnections.length === 0)) {
    document.body.dataset.dragCableLengthState = "unused";
    return;
  }
  const candidate = [
    ...affectedConnections.map((connection) => ({
      connection,
      lengthState: getConnectionLengthState(connection),
      displayName: getCableDisplayName(connection.cableItemId),
    })),
    ...affectedFixedConnections.map((connection) => ({
      connection,
      lengthState: getFixedConnectionLengthState(connection),
      displayName: getFixedCableDisplayName(connection),
    })),
  ]
    .sort((first, second) => (
      (first.lengthState.limitMeters - first.lengthState.distanceMeters)
      - (second.lengthState.limitMeters - second.lengthState.distanceMeters)
    ))[0];
  const lengthState = candidate.lengthState;
  const state = !lengthState.isWithinLength
    ? "overlength"
    : (lengthState.isNearLimit ? "near-limit" : "valid");
  document.body.dataset.dragCableLengthMeters = lengthState.distanceMeters.toFixed(2);
  document.body.dataset.dragCableLengthState = state;
  document.body.dataset.lastDragCableLengthMeters = lengthState.distanceMeters.toFixed(2);
  document.body.dataset.lastDragCableLengthState = state;
  setSystemMessage(
    `${candidate.displayName} preview: ${lengthState.distanceMeters.toFixed(2)}m / ${lengthState.limitMeters.toFixed(2)}m${!lengthState.isWithinLength ? "; release to disconnect" : (lengthState.isNearLimit ? "; almost at its limit" : "")}.`,
    state === "valid" ? "active" : "warning",
  );
}

function disconnectOverlengthConnections() {
  const overlengthConnections = gameState.connections.filter(
    (connection) => !getConnectionLengthState(connection).isWithinLength,
  );
  const overlengthFixedConnections = gameState.fixedConnections.filter(
    (connection) => !getFixedConnectionLengthState(connection).isWithinLength,
  );
  if (overlengthConnections.length === 0 && overlengthFixedConnections.length === 0) {
    return false;
  }
  const disconnectedIds = new Set(overlengthConnections.map((connection) => connection.id));
  gameState.connections = gameState.connections.filter(
    (connection) => !disconnectedIds.has(connection.id),
  );
  const disconnectedFixedIds = new Set(
    overlengthFixedConnections.map((connection) => connection.id),
  );
  gameState.fixedConnections = gameState.fixedConnections.filter(
    (connection) => !disconnectedFixedIds.has(connection.id),
  );
  document.body.dataset.lastConnectionResult = "disconnected-overlength";
  const disconnectedNames = [...new Set([
    ...overlengthConnections.map((connection) => getCableDisplayName(connection.cableItemId)),
    ...overlengthFixedConnections.map((connection) => getFixedCableDisplayName(connection)),
  ])].join(", ");
  setSystemMessage(`Move committed: connection(s) using ${disconnectedNames} exceeded the length limit and were disconnected.`, "warning");
  return true;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function setDevicePosition(element, position) {
  element.style.setProperty("--device-x", `${position.x}%`);
  element.style.setProperty("--device-y", `${position.y}%`);
  element.dataset.positionX = position.x.toFixed(3);
  element.dataset.positionY = position.y.toFixed(3);
}

function getDragBounds(scene, desk, device) {
  const sceneRect = scene.getBoundingClientRect();
  const deskRect = desk.getBoundingClientRect();
  const halfWidth = device.offsetWidth / 2;
  const deviceHeight = device.offsetHeight;
  const deskLeft = deskRect.left - sceneRect.left;
  const deskRight = deskRect.right - sceneRect.left;
  const deskBottom = deskRect.bottom - sceneRect.top;

  return {
    sceneRect,
    minimumX: Math.max(deskLeft + halfWidth, halfWidth + 12),
    maximumX: Math.min(deskRight - halfWidth, sceneRect.width - halfWidth - 12),
    minimumY: Math.max(deviceHeight / 2 + 18, 62),
    maximumY: deskBottom - deviceHeight * 0.5,
  };
}

function wouldDeviceOverlap(device, nextCenterX, nextCenterY, sceneRect) {
  const nextRect = {
    left: sceneRect.left + nextCenterX - device.offsetWidth / 2,
    right: sceneRect.left + nextCenterX + device.offsetWidth / 2,
    top: sceneRect.top + nextCenterY - device.offsetHeight / 2,
    bottom: sceneRect.top + nextCenterY + device.offsetHeight / 2,
  };

  return [...document.querySelectorAll(".scene-device")]
    .filter((otherDevice) => otherDevice !== device)
    .some((otherDevice) => {
      const otherRect = otherDevice.getBoundingClientRect();
      return nextRect.left < otherRect.right + DEVICE_COLLISION_GAP_PX
        && nextRect.right > otherRect.left - DEVICE_COLLISION_GAP_PX
        && nextRect.top < otherRect.bottom + DEVICE_COLLISION_GAP_PX
        && nextRect.bottom > otherRect.top - DEVICE_COLLISION_GAP_PX;
    });
}

function updateDragPosition(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
    return;
  }

  const deltaX = event.clientX - activeDrag.startPointer.x;
  const deltaY = event.clientY - activeDrag.startPointer.y;
  const nextCenterX = clamp(
    activeDrag.startCenter.x + deltaX,
    activeDrag.bounds.minimumX,
    activeDrag.bounds.maximumX,
  );
  const nextCenterY = clamp(
    activeDrag.startCenter.y + deltaY,
    activeDrag.bounds.minimumY,
    activeDrag.bounds.maximumY,
  );
  const nextPosition = {
    x: (nextCenterX / activeDrag.bounds.sceneRect.width) * 100,
    y: (nextCenterY / activeDrag.bounds.sceneRect.height) * 100,
  };

  if (wouldDeviceOverlap(activeDrag.device, nextCenterX, nextCenterY, activeDrag.bounds.sceneRect)) {
    if (!activeDrag.collisionBlocked) {
      setSystemMessage("That space is occupied. Devices cannot overlap.", "warning");
    }
    activeDrag.collisionBlocked = true;
    activeDrag.device.classList.add("is-collision-blocked");
    document.body.dataset.dragCollisionState = "blocked";
    return;
  }

  activeDrag.collisionBlocked = false;
  activeDrag.device.classList.remove("is-collision-blocked");
  document.body.dataset.dragCollisionState = "clear";

  setDevicePosition(activeDrag.device, nextPosition);
  activeDrag.previewPosition = nextPosition;
  renderPortStates();
  renderCables();
  updateCableLengthPreviewStatus();
}

function finishDrag(event, shouldCommit) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
    return;
  }

  const drag = activeDrag;
  activeDrag = null;
  let disconnectedForLength = false;
  const wasCollisionBlocked = drag.collisionBlocked;

  if (shouldCommit) {
    invalidateTestResult();
    gameState.devicePositions.set(drag.deviceId, { ...drag.previewPosition });
    document.body.dataset.lastMovedDevice = drag.deviceId;
    disconnectedForLength = disconnectOverlengthConnections();
  } else {
    setDevicePosition(drag.device, drag.originalPosition);
  }

  drag.device.classList.remove("is-dragging");
  drag.device.classList.remove("is-collision-blocked");
  document.body.classList.remove("is-device-dragging");

  if (drag.handle.hasPointerCapture(event.pointerId)) {
    drag.handle.releasePointerCapture(event.pointerId);
  }

  document.body.dataset.dragCableLengthMeters = "";
  document.body.dataset.dragCableLengthState = "idle";
  document.body.dataset.dragCollisionState = "idle";
  if (!disconnectedForLength) {
    announcePowerChainState();
  }
  refreshConnectionView();
  if (wasCollisionBlocked) {
    setSystemMessage("Move committed at the nearest available position. Devices cannot overlap.", "warning");
  }
}

function startDrag(event) {
  if (event.button !== 0 || activeDrag) {
    return;
  }

  const handle = event.currentTarget;
  const deviceId = handle.dataset.moveDeviceId;
  const device = document.querySelector(`[data-device-id="${deviceId}"]`);
  const scene = document.querySelector(".scene");
  const desk = document.querySelector(".desk");
  const originalPosition = gameState.devicePositions.get(deviceId);

  if (!device || !scene || !desk || !originalPosition) {
    return;
  }

  const bounds = getDragBounds(scene, desk, device);
  activeDrag = {
    pointerId: event.pointerId,
    deviceId,
    device,
    handle,
    bounds,
    originalPosition: { ...originalPosition },
    previewPosition: { ...originalPosition },
    collisionBlocked: false,
    startPointer: { x: event.clientX, y: event.clientY },
    startCenter: {
      x: (originalPosition.x / 100) * bounds.sceneRect.width,
      y: (originalPosition.y / 100) * bounds.sceneRect.height,
    },
  };

  try {
    handle.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic or interrupted pointer sequences may not have an active pointer to capture.
  }
  device.classList.add("is-dragging");
  document.body.classList.add("is-device-dragging");
  document.body.dataset.dragCollisionState = "clear";
  event.preventDefault();
}

function bindDeviceMovement() {
  document.querySelectorAll("[data-move-device-id]").forEach((handle) => {
    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", updateDragPosition);
    handle.addEventListener("pointerup", (event) => finishDrag(event, true));
    handle.addEventListener("pointercancel", (event) => finishDrag(event, false));
  });
}

function bindSystemTest() {
  const testButton = document.querySelector("#test-button");
  const nextLevelButton = document.querySelector("#next-level-button");
  if (testButton) {
    testButton.onclick = handleSystemTest;
  }
  if (nextLevelButton) {
    nextLevelButton.onclick = () => loadLevel(currentLevelIndex + 1, true);
  }
}

function getLogicalDeviceRect(device, position, sceneWidth, sceneHeight) {
  const centerX = (position.x / 100) * sceneWidth;
  const centerY = (position.y / 100) * sceneHeight;
  return {
    left: centerX - device.size.width / 2,
    right: centerX + device.size.width / 2,
    top: centerY - device.size.height / 2,
    bottom: centerY + device.size.height / 2,
  };
}

function findStagingPosition(device, positionedDevices) {
  const scene = document.querySelector(".scene");
  const desk = document.querySelector(".desk");
  const sceneWidth = scene?.clientWidth || 720;
  const sceneHeight = scene?.clientHeight || 560;
  const deskTop = desk?.offsetTop || sceneHeight * 0.65;
  const scannedSlots = [];
  [18, 22, 26, 30, 34, 38, 42, 46, 50].forEach((y) => {
    for (let x = 12; x <= 88; x += 2) {
      scannedSlots.push({ x, y });
    }
  });
  const candidates = [device.position, ...STAGING_AREA_SLOTS, ...scannedSlots]
    .filter((candidate, index, list) => (
      list.findIndex((other) => other.x === candidate.x && other.y === candidate.y) === index
    ));

  const availablePosition = candidates.find((candidate) => {
    const candidateRect = getLogicalDeviceRect(device, candidate, sceneWidth, sceneHeight);
    const isInsideStagingArea = candidateRect.left >= 12
      && candidateRect.right <= sceneWidth - 12
      && candidateRect.top >= 48
      && candidateRect.bottom <= deskTop - 10;
    if (!isInsideStagingArea) {
      return false;
    }
    return positionedDevices.every(({ device: otherDevice, position: otherPosition }) => {
      const otherRect = getLogicalDeviceRect(otherDevice, otherPosition, sceneWidth, sceneHeight);
      return candidateRect.right + DEVICE_COLLISION_GAP_PX <= otherRect.left
        || candidateRect.left - DEVICE_COLLISION_GAP_PX >= otherRect.right
        || candidateRect.bottom + DEVICE_COLLISION_GAP_PX <= otherRect.top
        || candidateRect.top - DEVICE_COLLISION_GAP_PX >= otherRect.bottom;
    });
  });

  return availablePosition ?? { ...device.position };
}

function resetGameStateForLevel(level, preserveExisting = false) {
  const previousPositions = gameState.devicePositions;
  const previousConnections = gameState.connections;
  const previousFixedConnections = gameState.fixedConnections;
  const previousBrokenPowerSocketIds = gameState.brokenPowerSocketIds;
  const failedAdapterConnection = preserveExisting && level.powerEmergency
    ? previousFixedConnections.find((connection) => (
      [connection.portAId, connection.portBId].includes("adapter-60w-ac")
    ))
    : null;
  const failedSocketId = failedAdapterConnection
    ? [failedAdapterConnection.portAId, failedAdapterConnection.portBId]
      .find((endpointId) => endpointId !== "adapter-60w-ac")
    : null;
  gameState.brokenPowerSocketIds = level.powerEmergency
    ? new Set([failedSocketId ?? "outlet-right"])
    : (preserveExisting && level.preserveBrokenPowerSockets
      ? new Set(previousBrokenPowerSocketIds)
      : new Set());
  const renderableDevices = getRenderableDevices(level);
  const positionedDevices = [];
  gameState.devicePositions = new Map();
  renderableDevices.forEach((device) => {
    const preservedPosition = preserveExisting && previousPositions.has(device.id)
      ? { ...previousPositions.get(device.id) }
      : null;
    if (preservedPosition) {
      gameState.devicePositions.set(device.id, preservedPosition);
      positionedDevices.push({ device, position: preservedPosition });
    }
  });
  const macbook = renderableDevices.find((device) => device.type === "macbook");
  if (macbook && !gameState.devicePositions.has(macbook.id)) {
    const macbookPosition = { ...macbook.position };
    gameState.devicePositions.set(macbook.id, macbookPosition);
    positionedDevices.push({ device: macbook, position: macbookPosition });
  }
  renderableDevices.forEach((device) => {
    if (gameState.devicePositions.has(device.id)) {
      return;
    }
    const position = findStagingPosition(device, positionedDevices);
    gameState.devicePositions.set(device.id, position);
    positionedDevices.push({ device, position });
  });
  const validPortIds = new Set(renderableDevices.flatMap((device) => device.ports.map((port) => port.id)));
  const validPowerEndpointIds = new Set([
    ...level.wallOutlets.map((outlet) => outlet.id),
    ...renderableDevices.flatMap((device) => (
      device.fixedConnectors?.map((connector) => connector.id) ?? []
    )),
  ]);
  gameState.connections = preserveExisting
    ? previousConnections.filter((connection) => (
      validPortIds.has(connection.fromPortId)
      && validPortIds.has(connection.toPortId)
      && getAvailableItems(level).some((item) => item.id === connection.cableItemId)
      && (!level.adapterBroken || ![
        connection.fromPortId,
        connection.toPortId,
      ].includes("adapter-60w-usbc"))
    ))
    : [];
  gameState.fixedConnections = preserveExisting
    ? previousFixedConnections.filter((connection) => (
      validPowerEndpointIds.has(connection.portAId)
      && validPowerEndpointIds.has(connection.portBId)
      && !gameState.brokenPowerSocketIds.has(connection.portAId)
      && !gameState.brokenPowerSocketIds.has(connection.portBId)
      && (!level.adapterBroken || ![
        connection.portAId,
        connection.portBId,
      ].includes("adapter-60w-ac"))
    ))
    : [];
  gameState.selectedPortId = null;
  gameState.selectedPowerEndpointId = null;
  gameState.previewPointer = null;
  gameState.previewIsOverlength = false;
  gameState.lastTestResult = null;
  gameState.levelComplete = false;
  activeDrag = null;
}

function renderLevelCopy(level) {
  const levelLabel = document.querySelector("#level-label");
  const taskNumber = document.querySelector("#task-number");
  const taskTitle = document.querySelector("#task-title");
  const taskObjective = document.querySelector("#task-objective");
  if (levelLabel) {
    levelLabel.textContent = `LEVEL ${String(level.number).padStart(2, "0")} · PLAYABLE`;
  }
  if (taskNumber) {
    taskNumber.textContent = String(level.number).padStart(2, "0");
  }
  if (taskTitle) {
    taskTitle.textContent = level.title;
  }
  if (taskObjective) {
    taskObjective.textContent = level.objective;
  }
  const introMessages = {
    1: "You have just arrived in a new country. This empty desk is the first corner of the apartment that feels like yours.",
    2: "A friend is coming over for your first movie night in the new apartment.",
    3: "A friend left you a few vinyl records from home.",
    4: "The entertainment corner is slowly becoming your everyday workspace.",
    5: "Tomorrow looks like a good day to explore the city with your camera.",
    6: "The apartment is warm, and a long listening session is about to begin.",
    7: "A sharp pop cuts through the room. The desk goes quiet.",
    8: "Two more camera bodies land on the desk, both with empty batteries.",
  };
  setSystemMessage(introMessages[level.number], "warning");
}

function renderLevel(level) {
  document.querySelector(".scene")?.setAttribute("aria-label", `Level ${level.number} desktop scene`);
  renderLevelCopy(level);
  renderInventory(getAvailableItems(level));
  renderShop();
  renderDevices(getRenderableDevices(level));
  renderOutlets(level.wallOutlets);
  bindDeviceMovement();
  bindConnectionControls();
  bindSystemTest();
  refreshConnectionView();
  renderTestState(false);
  document.body.dataset.levelId = level.id;
  document.body.dataset.stage = "system-test";
}

function loadLevel(levelIndex, preserveExisting = false) {
  if (!levels[levelIndex]) {
    return;
  }
  currentLevelIndex = levelIndex;
  currentLevel = levels[currentLevelIndex];
  resetGameStateForLevel(currentLevel, preserveExisting);
  renderLevel(currentLevel);
}

loadLevel(0, false);
