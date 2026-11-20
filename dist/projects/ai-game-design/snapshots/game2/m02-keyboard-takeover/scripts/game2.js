"use strict";

function resolvePrototypeInput(input) {
  const blocked = Boolean(input.blocked);
  const left = Boolean(input.arrowLeft || (!blocked && input.a));
  const right = Boolean(input.arrowRight || (!blocked && input.d));
  const jump = Boolean(input.arrowUp || (!blocked && input.w));

  return {
    horizontal: left === right ? 0 : left ? -1 : 1,
    jump,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { resolvePrototypeInput };
}

function startCatwalkPrototype() {
  const keyboardElement = document.querySelector("#prototype-keyboard");
  const statusElement = document.querySelector("#prototype-status");
  const restartButton = document.querySelector("#restart-prototype");

  if (!window.Phaser || !keyboardElement || !statusElement || !restartButton) {
    return;
  }

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const MOVE_SPEED = 245;
  const JUMP_SPEED = 465;

  class PrototypeScene extends Phaser.Scene {
    constructor() {
      super("PrototypeScene");
      this.blocked = false;
      this.completed = false;
      this.checkpoint = { x: 74, y: 420 };
    }

    create() {
      this.blocked = false;
      this.completed = false;
      this.checkpoint = { x: 74, y: 420 };
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.setAttribute("aria-label", "Catwalk platform game. Click to focus, then use the keyboard.");
      this.game.canvas.addEventListener("pointerdown", () => this.game.canvas.focus());
      keyboardElement.classList.remove("is-blocked", "is-complete");
      statusElement.textContent = "Use WASD to move and jump.";

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
      this.add.circle(775, 105, 88, 0xd7a764, 0.08);
      this.add.circle(820, 122, 125, 0xd7a764, 0.035);

      for (let index = 0; index < 20; index += 1) {
        const x = 34 + ((index * 149) % 900);
        const y = 38 + ((index * 83) % 220);
        const radius = index % 3 === 0 ? 2 : 1;
        this.add.circle(x, y, radius, 0xc9ddd7, 0.28 + (index % 4) * 0.08);
      }

      this.add.rectangle(480, 486, 960, 108, 0x182324);
      this.add.rectangle(480, 441, 960, 2, 0x304143, 0.55);

      this.add.text(32, 28, "A CAT IS TRYING TO GET HOME", {
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
      this.addPlatform(132, 505, 264, 70);
      this.addPlatform(335, 442, 132, 22);
      this.addPlatform(520, 382, 188, 22, true);
      this.addPlatform(708, 444, 128, 22);
      this.addPlatform(875, 494, 170, 92);

      this.add.rectangle(520, 364, 154, 3, 0xe1b777, 0.22);
      this.safeLabel = this.add.text(520, 345, "safe spot", {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#806f58",
      }).setOrigin(0.5);

      this.exitGlow = this.add.rectangle(910, 416, 48, 94, 0xa6c98c, 0.14);
      this.exitDoor = this.add.rectangle(910, 422, 38, 82, 0x293c32)
        .setStrokeStyle(2, 0x88af76, 0.9);
      this.add.circle(899, 426, 3, 0xcfe2bd);
      this.add.text(910, 360, "HOME?", {
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
      const fill = safe ? 0x66513b : 0x34494a;
      const edge = safe ? 0xd0a66d : 0x668084;
      const platform = this.add.rectangle(x, y, width, height, fill)
        .setStrokeStyle(2, edge, 0.78);
      this.physics.add.existing(platform, true);
      this.platforms.push(platform);
      return platform;
    }

    createPlayer() {
      this.player = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, "prototype-cat");
      this.player.setDepth(3);
      this.player.setCollideWorldBounds(true);
      this.player.setBodySize(38, 36);
      this.player.setOffset(7, 7);
      this.player.body.setMaxVelocity(320, 760);
      this.player.body.setDragX(1500);

      this.platforms.forEach((platform) => {
        this.physics.add.collider(this.player, platform);
      });
    }

    createInterface() {
      this.instruction = this.add.text(480, 78, "WASD  ·  MOVE + JUMP", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#eadbc7",
        backgroundColor: "#1d2929cc",
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(5);

      this.message = this.add.text(480, 118, "Reach the door.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#9aa9a7",
      }).setOrigin(0.5).setDepth(5);

      this.completionPanel = this.add.container(480, 260).setDepth(10).setVisible(false);
      const panel = this.add.rectangle(0, 0, 430, 170, 0x172120, 0.96)
        .setStrokeStyle(2, 0x96bd82, 0.8);
      const title = this.add.text(0, -38, "YOU ADAPTED.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#dcebcf",
      }).setOrigin(0.5);
      const copy = this.add.text(0, 13, "Moka kept the keys. You kept going.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#b8c7b0",
      }).setOrigin(0.5);
      const reset = this.add.text(0, 54, "PRESS R TO TRY AGAIN", {
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
        blocked: this.blocked,
        a: this.keys.a.isDown,
        d: this.keys.d.isDown,
        w: this.keys.w.isDown,
        arrowLeft: this.keys.arrowLeft.isDown,
        arrowRight: this.keys.arrowRight.isDown,
        arrowUp: this.keys.arrowUp.isDown,
      });

      this.player.setVelocityX(controls.horizontal * MOVE_SPEED);

      if (controls.horizontal !== 0) {
        this.player.setFlipX(controls.horizontal < 0);
      }

      const grounded = this.player.body.blocked.down || this.player.body.touching.down;
      if (controls.jump && grounded && !this.wasJumpDown) {
        this.player.setVelocityY(-JUMP_SPEED);
      }
      this.wasJumpDown = controls.jump;

      if (!this.blocked && grounded && this.player.x >= 475 && this.player.x <= 575) {
        this.triggerMoka();
      }

      if (this.player.y > GAME_HEIGHT + 70) {
        this.respawn();
      }

      if (this.player.x > 882 && this.player.y > 350) {
        this.completePrototype();
      }

      this.publishState();
    }

    triggerMoka() {
      this.blocked = true;
      this.checkpoint = { x: 500, y: 330 };
      this.player.setVelocityX(0);
      this.wasJumpDown = false;

      keyboardElement.classList.add("is-blocked");
      statusElement.textContent = "Moka is covering WASD. The arrow keys are available.";
      this.instruction.setText("MOKA HAS THE WASD KEYS");
      this.instruction.setColor("#efc487");
      this.message.setText("The other side of the keyboard is still free.");
      this.safeLabel.setText("checkpoint");

      this.cameras.main.flash(220, 231, 190, 136, false);
      this.cameras.main.shake(160, 0.004);
      this.publishState();
    }

    respawn() {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.wasJumpDown = false;
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
        blocked: this.blocked,
        completed: this.completed,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.y),
        checkpointX: this.checkpoint.x,
        checkpointY: this.checkpoint.y,
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
