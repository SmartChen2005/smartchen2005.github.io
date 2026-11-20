"use strict";

(function createCatwalkAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OUTPUT_BOOST = 2.4;
  const cooldowns = new Map();
  let context = null;
  let masterGain = null;
  let noiseBuffer = null;

  function ensureContext() {
    if (!AudioContextClass) {
      return null;
    }
    if (!context) {
      context = new AudioContextClass();
      masterGain = context.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(context.destination);
    }
    return context;
  }

  function tone({
    frequency,
    endFrequency = frequency,
    duration = 0.08,
    type = "square",
    volume = 0.08,
    delay = 0,
  }) {
    const start = context.currentTime + delay;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume * OUTPUT_BOOST, start + Math.min(0.012, duration * 0.25));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  function noise({ duration = 0.08, volume = 0.06, frequency = 1200, type = "highpass" }) {
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.25), context.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1;
      }
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const start = context.currentTime;
    source.buffer = noiseBuffer;
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(volume * OUTPUT_BOOST, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(masterGain);
    source.start(start);
    source.stop(start + duration);
  }

  const patterns = Object.freeze({
    ui() {
      tone({ frequency: 720, endFrequency: 480, duration: 0.055, volume: 0.035 });
    },
    jump() {
      tone({ frequency: 210, endFrequency: 620, duration: 0.13, type: "square", volume: 0.07 });
    },
    scratch() {
      noise({ duration: 0.095, volume: 0.055, frequency: 1350, type: "highpass" });
      tone({ frequency: 940, endFrequency: 260, duration: 0.09, type: "sawtooth", volume: 0.045 });
    },
    roll() {
      tone({ frequency: 190, endFrequency: 82, duration: 0.2, type: "triangle", volume: 0.08 });
      noise({ duration: 0.12, volume: 0.035, frequency: 520, type: "lowpass" });
    },
    squeeze() {
      tone({ frequency: 430, endFrequency: 230, duration: 0.1, type: "triangle", volume: 0.055 });
    },
    loaf() {
      tone({ frequency: 185, endFrequency: 145, duration: 0.15, type: "sine", volume: 0.065 });
      tone({ frequency: 145, endFrequency: 120, duration: 0.13, type: "sine", volume: 0.04, delay: 0.07 });
    },
    climb() {
      tone({ frequency: 320, endFrequency: 430, duration: 0.075, type: "square", volume: 0.05 });
      tone({ frequency: 430, endFrequency: 590, duration: 0.085, type: "square", volume: 0.05, delay: 0.075 });
    },
    mouseDefeat() {
      tone({ frequency: 1080, endFrequency: 720, duration: 0.065, type: "sine", volume: 0.065 });
      tone({ frequency: 620, endFrequency: 170, duration: 0.13, type: "square", volume: 0.055, delay: 0.045 });
    },
    pigeonDefeat() {
      noise({ duration: 0.15, volume: 0.045, frequency: 2100, type: "highpass" });
      tone({ frequency: 510, endFrequency: 790, duration: 0.085, type: "triangle", volume: 0.055 });
      tone({ frequency: 760, endFrequency: 310, duration: 0.14, type: "triangle", volume: 0.045, delay: 0.06 });
    },
    dogCalm() {
      tone({ frequency: 210, endFrequency: 270, duration: 0.17, type: "sine", volume: 0.055 });
      tone({ frequency: 330, endFrequency: 450, duration: 0.19, type: "sine", volume: 0.05, delay: 0.09 });
    },
    playerHit() {
      noise({ duration: 0.11, volume: 0.055, frequency: 900, type: "bandpass" });
      tone({ frequency: 240, endFrequency: 110, duration: 0.13, type: "sawtooth", volume: 0.065 });
    },
    lifeLost() {
      tone({ frequency: 520, endFrequency: 410, duration: 0.12, type: "square", volume: 0.055 });
      tone({ frequency: 380, endFrequency: 285, duration: 0.14, type: "square", volume: 0.055, delay: 0.1 });
      tone({ frequency: 250, endFrequency: 105, duration: 0.22, type: "triangle", volume: 0.065, delay: 0.22 });
    },
  });

  function render(name) {
    const pattern = patterns[name];
    if (!pattern || !context || context.state !== "running") {
      return false;
    }
    pattern();
    return true;
  }

  function play(name) {
    const audioContext = ensureContext();
    if (!audioContext || !patterns[name]) {
      return false;
    }
    const now = performance.now();
    const cooldown = name === "ui" ? 45 : 70;
    if (now - (cooldowns.get(name) || 0) < cooldown) {
      return false;
    }
    cooldowns.set(name, now);
    if (audioContext.state === "suspended") {
      audioContext.resume().then(() => render(name)).catch(() => {});
      return true;
    }
    return render(name);
  }

  function unlock() {
    const audioContext = ensureContext();
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  }

  function findInteractiveTarget(target) {
    return target instanceof Element
      ? target.closest("button:not(:disabled), a[href], [role='button']")
      : null;
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && findInteractiveTarget(event.target)) {
      play("ui");
    }
  }, true);
  document.addEventListener("click", (event) => {
    if (event.detail === 0 && findInteractiveTarget(event.target)) {
      play("ui");
    }
  }, true);
  document.addEventListener("keydown", unlock, true);

  window.CATWALK_AUDIO = Object.freeze({
    isSupported: Boolean(AudioContextClass),
    play,
    unlock,
  });
})();
