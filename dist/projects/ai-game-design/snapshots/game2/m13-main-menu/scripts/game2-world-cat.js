"use strict";

(function exposeWorldCatController(globalScope) {
  const AMBIENT_STATES = ["sleep", "sit", "groom", "stretch"];
  const AMBIENT_ACTIONS = Object.freeze({
    groom: { duration: 3600, anchor: "sit" },
    stretch: { duration: 2600, anchor: "sleep" },
  });
  const AMBIENT_DWELL = Object.freeze({
    sleep: { minimum: 12000, variance: 9000 },
    sit: { minimum: 6000, variance: 5000 },
  });
  const POSE_DEPART_MS = 140;
  const POSE_ARRIVE_MS = 240;
  const MOVE_SETTLE_MS = 660;

  class WorldCatController {
    constructor({ actor, paws, desk, monitor, screen, random = Math.random }) {
      this.actor = actor;
      this.paws = paws;
      this.desk = desk;
      this.monitor = monitor;
      this.screen = screen;
      this.random = random;
      this.ambientTimer = 0;
      this.transitionTimer = 0;
      this.poseTimer = 0;
      this.poseToken = 0;
      this.walkTimer = 0;
      this.pawsActive = false;
      this.block = null;
      this.walking = false;
      this.homeSide = "right";
      this.state = "sleep";
    }

    start() {
      this.actor.hidden = false;
      this.layout();
      this.setState("sleep");
      this.scheduleAmbient();
    }

    destroy() {
      clearTimeout(this.ambientTimer);
      clearTimeout(this.transitionTimer);
      clearTimeout(this.poseTimer);
      clearTimeout(this.walkTimer);
    }

    layout() {
      const deskRect = this.desk.getBoundingClientRect();
      const monitorRect = this.monitor.getBoundingClientRect();
      const screenRect = this.screen.getBoundingClientRect();
      if (!deskRect.width || !screenRect.width) {
        return;
      }
      const screenLeft = screenRect.left - deskRect.left;
      const screenRight = screenRect.right - deskRect.left;
      const screenBottom = screenRect.bottom - deskRect.top;
      const monitorBottom = monitorRect.bottom - deskRect.top;
      const catHeight = Math.max(285, Math.min(440, screenRect.height * 1.16));
      const ambientWidth = catHeight * (606 / 546);
      const walkWidth = catHeight * (493 / 349);
      const homeX = this.homeSide === "right"
        ? screenRight - ambientWidth * 0.34
        : screenLeft - ambientWidth * 0.66;
      this.actor.style.setProperty("--cat-home-x", `${homeX}px`);
      this.actor.style.setProperty("--cat-home-y", `${screenBottom - catHeight * 0.57}px`);
      this.actor.style.setProperty("--cat-height", `${catHeight}px`);
      this.actor.style.setProperty("--cat-ambient-width", `${ambientWidth}px`);
      this.actor.style.setProperty("--cat-reach-x", `${screenLeft + screenRect.width * 0.5 - ambientWidth * 0.5}px`);
      this.actor.style.setProperty("--cat-reach-y", `${monitorBottom - catHeight * 0.38}px`);
      this.actor.style.setProperty("--cat-walk-from", `${-walkWidth - 32}px`);
      this.actor.style.setProperty("--cat-walk-to", `${deskRect.width + 32}px`);
      this.actor.style.setProperty("--cat-walk-width", `${walkWidth}px`);
      this.actor.style.setProperty("--cat-walk-y", `${screenBottom - catHeight * 0.88}px`);

      const coverage = Math.max(10, Math.min(90, Number(this.block?.coveragePercent || 35)));
      const coverageWidth = screenRect.width * coverage / 100;
      const blockX = this.block?.side === "right"
        ? screenRight - coverageWidth - ambientWidth * 0.1
        : screenLeft + coverageWidth - ambientWidth * 0.9;
      this.actor.style.setProperty("--cat-block-x", `${blockX}px`);
      this.actor.style.setProperty("--cat-block-y", `${screenBottom - catHeight * 0.82}px`);
    }

    setPaws(active) {
      const next = Boolean(active);
      if (next === this.pawsActive) {
        return;
      }
      this.pawsActive = next;
      clearTimeout(this.transitionTimer);
      if (next) {
        if (this.block || this.walking) {
          return;
        }
        this.pauseAmbient();
        this.actor.dataset.intent = "paws";
        this.paws.classList.remove("is-deployed");
        this.setState("approach");
        this.transitionTimer = setTimeout(() => {
          if (!this.pawsActive) {
            return;
          }
          this.setState("reach");
          this.paws.classList.add("is-deployed");
        }, MOVE_SETTLE_MS);
      } else {
        this.paws.classList.remove("is-deployed");
        this.resumeFromInterference();
      }
    }

    setBlock(block) {
      const next = block ? {
        side: block.side === "right" ? "right" : "left",
        coveragePercent: Number(block.coveragePercent || 35),
      } : null;
      const unchanged = JSON.stringify(next) === JSON.stringify(this.block);
      if (unchanged) {
        return;
      }
      this.block = next;
      clearTimeout(this.transitionTimer);
      if (next) {
        this.pauseAmbient();
        this.actor.dataset.intent = "block";
        this.actor.dataset.side = next.side;
        this.layout();
        this.setState("approach");
        this.transitionTimer = setTimeout(() => {
          if (this.block) {
            this.setState("block");
          }
        }, MOVE_SETTLE_MS);
      } else {
        this.resumeFromInterference();
      }
    }

    walk({ direction = "left-to-right", durationSeconds = 4 } = {}) {
      this.pauseAmbient();
      clearTimeout(this.walkTimer);
      this.walking = true;
      this.actor.dataset.intent = "walk";
      this.actor.dataset.side = direction === "right-to-left" ? "left" : "right";
      this.actor.style.setProperty("--cat-walk-duration", `${Math.max(0.5, Number(durationSeconds))}s`);
      this.setState(direction === "right-to-left" ? "walk-left" : "walk-right");
      this.walkTimer = setTimeout(() => {
        this.walking = false;
        this.homeSide = direction === "right-to-left" ? "left" : "right";
        this.layout();
        this.resumeFromInterference();
      }, Math.max(0.5, Number(durationSeconds)) * 1000 + POSE_DEPART_MS);
    }

    setState(state, { immediate = false } = {}) {
      if (this.state === state && this.actor.dataset.state === state) {
        return;
      }
      const previousState = this.actor.dataset.state;
      this.state = state;
      if (immediate || !previousState) {
        ++this.poseToken;
        clearTimeout(this.poseTimer);
        this.actor.classList.remove("is-pose-transitioning");
        delete this.actor.dataset.posePhase;
        delete this.actor.dataset.nextState;
        this.actor.dataset.state = state;
        return;
      }
      const token = ++this.poseToken;
      clearTimeout(this.poseTimer);
      this.actor.classList.remove("is-pose-transitioning");
      this.actor.dataset.posePhase = "depart";
      this.actor.dataset.nextState = state;
      void this.actor.offsetWidth;
      this.actor.classList.add("is-pose-transitioning");
      this.poseTimer = setTimeout(() => {
        if (token !== this.poseToken) {
          return;
        }
        this.actor.dataset.state = state;
        this.actor.dataset.posePhase = "arrive";
        delete this.actor.dataset.nextState;
        this.poseTimer = setTimeout(() => {
          if (token !== this.poseToken) {
            return;
          }
          this.actor.classList.remove("is-pose-transitioning");
          delete this.actor.dataset.posePhase;
        }, POSE_ARRIVE_MS);
      }, POSE_DEPART_MS);
    }

    pauseAmbient() {
      clearTimeout(this.ambientTimer);
    }

    resumeFromInterference() {
      if (this.walking) {
        return;
      }
      if (this.block) {
        this.actor.dataset.intent = "block";
        this.setState("block");
        return;
      }
      if (this.pawsActive) {
        this.actor.dataset.intent = "paws";
        this.setState("reach");
        this.paws.classList.add("is-deployed");
        return;
      }
      this.setState("returning");
      delete this.actor.dataset.intent;
      clearTimeout(this.transitionTimer);
      this.transitionTimer = setTimeout(() => {
        if (!this.walking && !this.block && !this.pawsActive) {
          this.setState("sleep");
          this.scheduleAmbient();
        }
      }, MOVE_SETTLE_MS);
    }

    scheduleAmbient() {
      this.pauseAmbient();
      const dwell = AMBIENT_DWELL[this.state] || AMBIENT_DWELL.sleep;
      const delay = dwell.minimum + Math.floor(this.random() * dwell.variance);
      this.ambientTimer = setTimeout(() => {
        if (this.walking || this.block || this.pawsActive) {
          return;
        }
        const action = this.random() < 0.58 ? "groom" : "stretch";
        this.beginAmbientAction(action);
      }, delay);
    }

    beginAmbientAction(action) {
      const definition = AMBIENT_ACTIONS[action];
      if (!definition || this.walking || this.block || this.pawsActive) {
        return;
      }
      const playAction = () => {
        if (this.walking || this.block || this.pawsActive) {
          return;
        }
        this.setState(action, { immediate: true });
        this.ambientTimer = setTimeout(() => {
          if (this.walking || this.block || this.pawsActive) {
            return;
          }
          this.setState(definition.anchor, { immediate: true });
          this.scheduleAmbient();
        }, definition.duration);
      };
      if (this.state === definition.anchor && this.actor.dataset.state === definition.anchor) {
        playAction();
        return;
      }
      this.setState(definition.anchor);
      this.ambientTimer = setTimeout(playAction, POSE_DEPART_MS + POSE_ARRIVE_MS + 40);
    }
  }

  globalScope.CATWALK_WORLD_CAT = Object.freeze({
    AMBIENT_STATES,
    AMBIENT_ACTIONS,
    AMBIENT_DWELL,
    WorldCatController,
  });
})(globalThis);
