"use strict";

(function exposeCatwalkPlaytestModel(root, factory) {
  const model = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = model;
  }
  if (root) {
    root.CATWALK_PLAYTEST_MODEL = model;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const GROUND_TOP = 470;
  const GROUND_HEIGHT = 70;
  const PLAYER_BODY_BOTTOM_OFFSET = 21;

  function sortByX(objects) {
    return [...objects].sort((left, right) => Number(left.x) - Number(right.x));
  }

  function createBackdropSequence(panelCount, variantCount, random = Math.random) {
    const count = Math.max(0, Math.floor(Number(panelCount) || 0));
    const variants = Math.max(1, Math.floor(Number(variantCount) || 1));
    if (variants === 1) {
      return Array(count).fill(0);
    }
    const sequence = [];
    let previous = -1;
    for (let index = 0; index < count; index += 1) {
      const choices = Array.from({ length: variants }, (_, choice) => choice)
        .filter((choice) => choice !== previous);
      const randomIndex = Math.min(
        choices.length - 1,
        Math.floor(Math.max(0, Math.min(0.999999, Number(random()))) * choices.length),
      );
      previous = choices[randomIndex] ?? 0;
      sequence.push(previous);
    }
    return sequence;
  }

  function createAlleyClutterLayout(worldWidth, objects = [], random = Math.random) {
    const physicalTypes = new Set([
      "platform", "gap", "crate", "tunnel", "wall", "loafGoal",
      "checkpoint", "gameStart", "exit", "ritual", "yarn", "enemy",
    ]);
    const occupied = objects.filter((object) => physicalTypes.has(object.type));
    const kinds = ["trash-bin", "garbage-bags", "bicycle", "pallet"];
    const layout = [];
    for (let x = 360; x < Number(worldWidth) - 120; x += 520) {
      const safe = occupied.every((object) => (
        Math.abs(Number(object.x) - x) >= 100 + Number(object.width || 0) / 2
      ));
      if (!safe || Number(random()) >= 0.72) {
        continue;
      }
      const kindIndex = Math.min(kinds.length - 1, Math.floor(Number(random()) * kinds.length));
      layout.push({ x, kind: kinds[Math.max(0, kindIndex)] });
    }
    return layout;
  }

  function canStartRoll({
    rollPressed,
    previousRollPressed,
    grounded,
    horizontal,
    actionLocked,
    squeezing,
    inTunnel,
  }) {
    return Boolean(
      rollPressed
      && !previousRollPressed
      && grounded
      && Number(horizontal) !== 0
      && !actionLocked
      && !squeezing
      && !inTunnel
    );
  }

  function createGroundSegments(worldWidth, gaps = []) {
    const intervals = sortByX(gaps)
      .map((gap) => ({
        start: Math.max(0, Number(gap.x) - Number(gap.width) / 2),
        end: Math.min(worldWidth, Number(gap.x) + Number(gap.width) / 2),
      }))
      .filter((gap) => gap.end > gap.start);
    const merged = [];
    intervals.forEach((gap) => {
      const previous = merged[merged.length - 1];
      if (previous && gap.start <= previous.end) {
        previous.end = Math.max(previous.end, gap.end);
      } else {
        merged.push({ ...gap });
      }
    });

    const segments = [];
    let cursor = 0;
    merged.forEach((gap) => {
      if (gap.start > cursor) {
        segments.push({
          x: cursor + (gap.start - cursor) / 2,
          y: GROUND_TOP + GROUND_HEIGHT / 2,
          width: gap.start - cursor,
          height: GROUND_HEIGHT,
        });
      }
      cursor = Math.max(cursor, gap.end);
    });
    if (cursor < worldWidth) {
      segments.push({
        x: cursor + (worldWidth - cursor) / 2,
        y: GROUND_TOP + GROUND_HEIGHT / 2,
        width: worldWidth - cursor,
        height: GROUND_HEIGHT,
      });
    }
    return segments;
  }

  function buildRuntimePlan(project, worldWidth) {
    const byType = {};
    project.objects.forEach((object) => {
      (byType[object.type] ||= []).push(object);
    });
    const checkpoints = sortByX(byType.checkpoint || []);
    const gameStarts = sortByX(byType.gameStart || []);
    const exits = sortByX(byType.exit || []);
    const ritualGroups = {};
    sortByX(byType.ritual || []).forEach((node) => {
      const group = String(node.group || "cat-lock-1");
      (ritualGroups[group] ||= []).push(node);
    });
    Object.values(ritualGroups).forEach((nodes) => {
      nodes.sort((left, right) => Number(left.order || 1) - Number(right.order || 1));
    });

    return {
      worldWidth,
      gaps: byType.gap || [],
      grounds: createGroundSegments(worldWidth, byType.gap || []),
      platforms: byType.platform || [],
      crates: byType.crate || [],
      tunnels: byType.tunnel || [],
      walls: byType.wall || [],
      loafGoals: byType.loafGoal || [],
      texts: byType.text || [],
      playerDialogues: sortByX(byType.playerDialogue || []),
      checkpoints,
      gameStarts,
      gameStart: gameStarts[0] || null,
      exits,
      finalExit: exits[exits.length - 1] || null,
      spawn: checkpoints[0]
        ? { x: checkpoints[0].x, y: checkpoints[0].y }
        : { x: 80, y: 430 },
      ritualGroups,
      yarn: byType.yarn || [],
      enemies: byType.enemy || [],
      pawEvents: byType.pawStorm || [],
      pawStops: sortByX(byType.pawStormEnd || []),
      screenBlocks: sortByX(byType.screenBlock || []),
      screenWalks: sortByX(byType.screenWalk || []),
    };
  }

  function findCheckpointBefore(checkpoints, anchorX) {
    const ordered = sortByX(checkpoints || []);
    if (ordered.length === 0) {
      return null;
    }
    const anchor = Number(anchorX);
    return [...ordered].reverse().find((checkpoint) => Number(checkpoint.x) <= anchor)
      || ordered[0];
  }

  function findPlaytestCheckpoint(checkpoints, gameStart, anchorX) {
    const routeCheckpoints = sortByX(checkpoints || []).map((checkpoint) => ({
      ...checkpoint,
      checkpointType: "route",
    }));
    const candidates = [
      ...routeCheckpoints,
      ...(gameStart ? [{ ...gameStart, checkpointType: "gameStart" }] : []),
    ];
    const anchor = Number(anchorX);
    const eligible = candidates.filter((candidate) => Number(candidate.x) <= anchor);
    if (eligible.length > 0) {
      return eligible.reduce((nearest, candidate) => {
        if (!nearest || Number(candidate.x) > Number(nearest.x)) {
          return candidate;
        }
        if (
          Number(candidate.x) === Number(nearest.x)
          && candidate.checkpointType === "gameStart"
        ) {
          return candidate;
        }
        return nearest;
      }, null);
    }
    return routeCheckpoints[0] || null;
  }

  function resolveCheckpointSpawn(checkpoint, grounds = [], platforms = []) {
    if (!checkpoint) {
      return null;
    }
    const checkpointX = Number(checkpoint.x);
    const checkpointY = Number(checkpoint.y);
    const markerBottom = checkpointY + Number(checkpoint.height || 0) / 2;
    const surfaces = [...grounds, ...platforms]
      .filter((surface) => {
        const halfWidth = Number(surface.width || 0) / 2;
        return checkpointX >= Number(surface.x) - halfWidth
          && checkpointX <= Number(surface.x) + halfWidth;
      })
      .map((surface) => ({
        surface,
        top: Number(surface.y) - Number(surface.height || 0) / 2,
      }));
    if (surfaces.length === 0) {
      return { ...checkpoint, x: checkpointX, y: checkpointY };
    }
    const nearest = surfaces.reduce((current, candidate) => (
      !current
      || Math.abs(candidate.top - markerBottom) < Math.abs(current.top - markerBottom)
        ? candidate
        : current
    ), null);
    return {
      ...checkpoint,
      x: checkpointX,
      y: nearest.top - PLAYER_BODY_BOTTOM_OFFSET,
      supportType: platforms.includes(nearest.surface) ? "platform" : "ground",
      supportTop: nearest.top,
    };
  }

  function resetPhysicsActor(actor, checkpoint) {
    const x = Number(checkpoint.x);
    const y = Number(checkpoint.y);
    actor.body.reset(x, y);
    actor.setVelocity(0, 0);
    return { x, y };
  }

  function canTriggerPawEvent(event, playerX, elapsedSeconds) {
    const positionReady = playerX >= Number(event.triggerX ?? event.x ?? 0);
    const timeReady = elapsedSeconds >= Number(event.delaySeconds || 0);
    if (event.triggerMode === "time") {
      return timeReady;
    }
    if (event.triggerMode === "both") {
      return positionReady && timeReady;
    }
    return positionReady;
  }

  function mergePawEffects(activeEvents) {
    return {
      blockedKeys: [...new Set(activeEvents.flatMap((event) => event.blockedKeys || []))],
      heldKeys: [...new Set(activeEvents.flatMap((event) => event.heldKeys || []))],
    };
  }

  function getClimbContactSide(player, wall, options = {}) {
    const playerWidth = Number(options.playerWidth || 38);
    const playerHeight = Number(options.playerHeight || 36);
    const contactTolerance = Number(options.contactTolerance ?? 8);
    const crestTolerance = Number(options.crestTolerance ?? 48);
    const overlapInset = Number(options.overlapInset ?? 6);
    const horizontalDistance = Number(player.x) - Number(wall.x);
    const absoluteDistance = Math.abs(horizontalDistance);
    const touchingDistance = Number(wall.width) / 2 + playerWidth / 2;
    const closeEnough = absoluteDistance >= touchingDistance - overlapInset
      && absoluteDistance <= touchingDistance + contactTolerance;

    const playerTop = Number(player.y) - playerHeight / 2;
    const playerBottom = Number(player.y) + playerHeight / 2;
    const wallTop = Number(wall.y) - Number(wall.height) / 2;
    const wallBottom = Number(wall.y) + Number(wall.height) / 2;
    const verticallyAligned = playerBottom >= wallTop - crestTolerance
      && playerTop <= wallBottom + contactTolerance;

    if (!closeEnough || !verticallyAligned || horizontalDistance === 0) {
      return 0;
    }
    return horizontalDistance < 0 ? -1 : 1;
  }

  function wrapInstructionText(content, width, fontSize) {
    const maxCharacters = Math.max(1, Math.floor(
      Math.max(40, Number(width || 260) - 20) / (Math.max(8, Number(fontSize || 18)) * 0.62),
    ));
    return String(content || "Your message here")
      .split("\n")
      .flatMap((paragraph) => {
        if (!paragraph) {
          return [""];
        }
        const lines = [];
        let remaining = paragraph;
        while (remaining.length > maxCharacters) {
          let breakAt = remaining.lastIndexOf(" ", maxCharacters);
          if (breakAt <= 0) {
            breakAt = maxCharacters;
          }
          lines.push(remaining.slice(0, breakAt).trimEnd());
          remaining = remaining.slice(breakAt).trimStart();
        }
        lines.push(remaining);
        return lines;
      })
      .join("\n");
  }

  function updateDogCalmState(currentProgress, loafing, distance, delta, options = {}) {
    const calmDistance = Number(options.calmDistance ?? 150);
    const calmDuration = Number(options.calmDuration ?? 1100);
    const decayRate = Number(options.decayRate ?? 0.45);
    const progress = Math.max(0, Math.min(1, Number(currentProgress) || 0));
    if (progress >= 1) {
      return { progress: 1, state: "calm" };
    }
    const closeEnough = Math.abs(Number(distance)) <= calmDistance;
    const nextProgress = loafing && closeEnough
      ? Math.min(1, progress + Number(delta) / calmDuration)
      : Math.max(0, progress - (Number(delta) / calmDuration) * decayRate);
    return {
      progress: nextProgress,
      state: nextProgress >= 1 ? "calm" : nextProgress > 0 ? "curious" : "alert",
    };
  }

  function updateLoafRestState(currentState, resting, delta, duration = 600) {
    const state = {
      charge: Math.max(0, Number(currentState?.charge) || 0),
      activated: Boolean(currentState?.activated),
    };
    const targetDuration = Math.max(1, Number(duration) || 600);
    if (state.activated) {
      return { charge: targetDuration, activated: true };
    }
    const nextCharge = resting
      ? Math.min(targetDuration, state.charge + Number(delta))
      : Math.max(0, state.charge - Number(delta) * 0.5);
    return {
      charge: nextCharge,
      activated: nextCharge >= targetDuration,
    };
  }

  function getGameStartLives(gameStart) {
    return Math.max(1, Math.min(99, Math.round(Number(gameStart?.lives || 9))));
  }

  function createNineLivesState(gameStart, spawnX) {
    const started = Boolean(gameStart) && Number(spawnX) >= Number(gameStart.x);
    return {
      started,
      lives: started ? getGameStartLives(gameStart) : null,
    };
  }

  function spendLife(lives) {
    return Math.max(0, Number(lives || 0) - 1);
  }

  function resolveDeath({ yarnShield = 0, gameStarted = false, lives = null } = {}) {
    if (Number(yarnShield) > 0) {
      return {
        protected: true,
        yarnShield: 0,
        lives,
        gameOver: false,
      };
    }
    if (!gameStarted) {
      return {
        protected: false,
        yarnShield: 0,
        lives,
        gameOver: false,
      };
    }
    const nextLives = spendLife(lives);
    return {
      protected: false,
      yarnShield: 0,
      lives: nextLives,
      gameOver: nextLives <= 0,
    };
  }

  function findTriggeredDialogue(dialogues, playerX, triggeredIds = new Set()) {
    return sortByX(dialogues || []).find((dialogue) => (
      !triggeredIds.has(dialogue.id) && Number(playerX) >= Number(dialogue.x)
    )) || null;
  }

  function findTriggeredPositionEvent(events, playerX, triggeredIds = new Set()) {
    return sortByX(events || []).find((event) => (
      !triggeredIds.has(event.id) && Number(playerX) >= Number(event.triggerX ?? event.x)
    )) || null;
  }

  function isScreenBlockActive(event, startedAt, time, playerX) {
    if (event.endMode === "position") {
      return Number(playerX) < Number(event.endX);
    }
    return Number(time) < Number(startedAt) + Math.max(0.5, Number(event.durationSeconds || 4)) * 1000;
  }

  return Object.freeze({
    GROUND_TOP,
    GROUND_HEIGHT,
    PLAYER_BODY_BOTTOM_OFFSET,
    createBackdropSequence,
    createAlleyClutterLayout,
    canStartRoll,
    createGroundSegments,
    buildRuntimePlan,
    findCheckpointBefore,
    findPlaytestCheckpoint,
    resolveCheckpointSpawn,
    resetPhysicsActor,
    canTriggerPawEvent,
    mergePawEffects,
    getClimbContactSide,
    wrapInstructionText,
    updateDogCalmState,
    updateLoafRestState,
    getGameStartLives,
    createNineLivesState,
    spendLife,
    resolveDeath,
    findTriggeredDialogue,
    findTriggeredPositionEvent,
    isScreenBlockActive,
  });
}));
