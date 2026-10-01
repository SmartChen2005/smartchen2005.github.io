#include <Adafruit_NeoPixel.h>
#include <Arduino.h>
#include <math.h>

// ===================== PINS =====================
#define BTN_W 2   // UP
#define BTN_A 3   // LEFT
#define BTN_S 4   // DOWN
#define BTN_D 5   // RIGHT

// New mode buttons
#define BTN_M_AMBIENT 10
#define BTN_M_TRAP    11
#define BTN_M_TECHNO  12

#define DATA_PIN 6
#define NUM_LEDS 30
#define BRIGHTNESS 60

#define TRIG_PIN 7
#define ECHO_PIN 8

#define AUDIO_PIN 9

// ===================== MODES (3 only) =====================
enum GenreMode : uint8_t {
  MODE_AMBIENT = 0,
  MODE_TRAP    = 1,
  MODE_TECHNO  = 2
};

// ===================== DEBOUNCED BUTTON TYPE =====================
const unsigned long DEBOUNCE_MS = 10;

struct DebBtn {
  uint8_t pin;
  bool lastState;
  unsigned long lastT;
};

bool btnPressed(DebBtn &b) {
  bool now = digitalRead(b.pin);
  if (now != b.lastState) {
    unsigned long t = millis();
    if (t - b.lastT >= DEBOUNCE_MS) {
      b.lastT = t;
      b.lastState = now;
      return (now == LOW); // INPUT_PULLUP => pressed is LOW
    }
  }
  return false;
}

// ===================== NEOPIXEL =====================
Adafruit_NeoPixel strip(NUM_LEDS, DATA_PIN, NEO_GRB + NEO_KHZ800);

uint32_t wheel(byte pos) {
  pos = 255 - pos;
  if (pos < 85)  return strip.Color(255 - pos * 3, 0, pos * 3);
  if (pos < 170) { pos -= 85; return strip.Color(0, pos * 3, 255 - pos * 3); }
  pos -= 170;
  return strip.Color(pos * 3, 255 - pos * 3, 0);
}

// Button objects
DebBtn bUp    {BTN_W, HIGH, 0};
DebBtn bLeft  {BTN_A, HIGH, 0};
DebBtn bDown  {BTN_S, HIGH, 0};
DebBtn bRight {BTN_D, HIGH, 0};

DebBtn bAmb   {BTN_M_AMBIENT, HIGH, 0};
DebBtn bTrap  {BTN_M_TRAP,    HIGH, 0};
DebBtn bTech  {BTN_M_TECHNO,  HIGH, 0};

// ===================== ULTRASONIC =====================
const float MIN_CM = 10.0f;
const float MAX_CM = 180.0f;

const float ALPHA = 0.22f;
static float dSmooth = 45.0f;
static float dPrev   = 45.0f;

static unsigned long lastPingMs = 0;
const unsigned long PING_INTERVAL_MS = 40;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long us = pulseIn(ECHO_PIN, HIGH, 25000UL);
  if (us == 0) return -1.0f;
  return us / 58.0f;
}

bool updateDistance() {
  unsigned long now = millis();
  if (now - lastPingMs < PING_INTERVAL_MS) return false;
  lastPingMs = now;

  float cm = readDistanceCm();
  if (cm < 0) return false;

  dPrev = dSmooth;
  dSmooth = dSmooth + ALPHA * (cm - dSmooth);
  return true;
}

int8_t distanceToZone(float cm) {
  if (cm < MIN_CM || cm > MAX_CM) return -1;
  long z = map((long)cm, (long)MIN_CM, (long)MAX_CM, 0, 7);
  if (z < 0) z = 0;
  if (z > 7) z = 7;
  return (int8_t)z;
}

float distanceSpeed() {
  return fabs(dSmooth - dPrev);
}

// ===================== LOOP/LAYERS =====================
#define STEPS 8

uint8_t rhythm[STEPS];   // bit0 kick, bit1 snare, bit2 hat
int8_t  bass[STEPS];     // 0..7 or -1
int8_t  melody[STEPS];   // 0..7 or -1

uint8_t stepIndex = 0;
uint8_t recLayer = 0;    // 0=rhythm 1=bass 2=melody

// DOWN action: replace selected layer for exactly 8 steps
bool recordArmed = false;
uint8_t recordStepsRemaining = 0;

// ===================== MODE + TEMPO =====================
GenreMode mode = MODE_AMBIENT;

uint16_t bpm = 90;
unsigned long stepPeriodMs = 60000UL / 90;
unsigned long lastStepMs = 0;
float swing = 0.0f;

// time-sliced playback inside a step
unsigned long sliceKickEnd = 0;
unsigned long sliceBassEnd = 0;
unsigned long sliceMelEnd  = 0;
unsigned long stepStartMs  = 0;
bool sliceActive = false;

// current step audio data
uint8_t curDrumBits = 0;
int8_t  curBassIdx  = -1;
int8_t  curMelIdx   = -1;

// ===================== SCALES =====================
const uint16_t SCALE_C_MAJOR[8] = {262,294,330,349,392,440,494,523};
const uint16_t SCALE_A_MINOR[8] = {220,247,262,294,330,349,392,440};
const uint16_t SCALE_PENTA[8]   = {262,294,330,392,440,523,587,660};

const uint16_t* currentScale() {
  switch (mode) {
    case MODE_AMBIENT: return SCALE_PENTA;
    case MODE_TRAP:    return SCALE_A_MINOR;
    case MODE_TECHNO:  return SCALE_C_MAJOR;
    default:           return SCALE_C_MAJOR;
  }
}

uint16_t noteFromIndex(int8_t idx, bool isBass) {
  if (idx < 0) return 0;
  const uint16_t* sc = currentScale();
  uint16_t f = sc[idx & 7];
  if (isBass) f = (uint16_t)(f / 2);
  return f;
}

// ===================== DISPLAY HELPERS =====================
void sendText(const char* msg) {
  Serial.print(F("TEXT "));
  Serial.println(msg);
}

const char* modeName() {
  if (mode == MODE_AMBIENT) return "AMBIENT";
  if (mode == MODE_TRAP)    return "TRAP";
  return "TECHNO";
}

const char* layerName() {
  if (recLayer == 0) return "RHY";
  if (recLayer == 1) return "BASS";
  return "MELO";
}

void sendStateToDisplay() {
  char buf[64];
  const char* rec = recordArmed ? "REC" : "PLAY";
  sprintf(buf, "%s %dbpm %s %s", modeName(), bpm, layerName(), rec);
  sendText(buf);
}

// ===================== PRESETS =====================
void applyModePreset(GenreMode newMode) {
  mode = newMode;

  switch (mode) {
    case MODE_AMBIENT:
      bpm = 80;   swing = 0.05f;
      break;
    case MODE_TRAP:
      bpm = 140;  swing = 0.12f;
      break;
    case MODE_TECHNO:
      bpm = 128;  swing = 0.00f;
      break;
  }

  stepPeriodMs = 60000UL / bpm;
  sendText(modeName());
  sendStateToDisplay();
}

// ===================== CLEAR =====================
void clearAllLoops() {
  for (uint8_t i = 0; i < STEPS; i++) {
    rhythm[i] = 0;
    bass[i] = -1;
    melody[i] = -1;
  }
  recordArmed = false;
  recordStepsRemaining = 0;
  sendText("CLEARED");
  sendStateToDisplay();
}

void clearSelectedLayer() {
  for (uint8_t i = 0; i < STEPS; i++) {
    if (recLayer == 0) rhythm[i] = 0;
    else if (recLayer == 1) bass[i] = -1;
    else melody[i] = -1;
  }
}

// ===================== WRITING RULES =====================
uint8_t makeRhythmHit(int8_t zone, float spd, uint8_t step, GenreMode m) {
  if (zone < 0) return 0;
  uint8_t hit = 0; // 1 kick, 2 snare, 4 hat

  if (m == MODE_TECHNO) {
    if (step % 2 == 0) hit |= 1;
    if (step % 2 == 1) hit |= 4;
    if (step == 4) hit |= 2;
    if (spd > 1.2f) hit |= 4;
  } else if (m == MODE_TRAP) {
    if (step == 4) hit |= 2;
    if ((step == 0 || step == 3 || step == 6) && zone <= 3) hit |= 1;
    if (spd > 0.8f) hit |= 4;
    if (spd > 1.8f && (step % 2 == 1)) hit |= 4;
  } else { // AMBIENT
    if (spd > 1.6f) hit |= 4;
    if (spd > 2.6f && (step % 4 == 0)) hit |= 1;
  }
  return hit;
}

int8_t writeNoteIndexFromZone(int8_t zone, GenreMode m, bool isMelody) {
  if (zone < 0) return -1;

  if (m == MODE_AMBIENT) {
    return (int8_t)constrain(zone, 1, 6);
  }
  if (m == MODE_TRAP) {
    if (isMelody) return (int8_t)constrain(zone + 2, 2, 7);
    else          return (int8_t)constrain(zone, 0, 4);
  }
  static const int8_t motifMap[8] = {0,2,4,5,4,2,1,3}; // TECHNO
  return motifMap[zone & 7];
}

// ===================== LED VISUALS =====================
void showLayerIndicators() {
  strip.setPixelColor(0, (recLayer == 0) ? strip.Color(80,80,80) : 0);
  strip.setPixelColor(1, (recLayer == 1) ? strip.Color(80,80,80) : 0);
  strip.setPixelColor(2, (recLayer == 2) ? strip.Color(80,80,80) : 0);
}

uint32_t colorForNote(int8_t idx) {
  if (idx < 0) return 0;
  return wheel((byte)(idx * 32));
}

void showSequencerLeds(uint8_t activeStep) {
  showLayerIndicators();

  int block = (NUM_LEDS - 3) / STEPS;
  if (block < 1) block = 1;

  for (uint8_t s = 0; s < STEPS; s++) {
    uint32_t col = 0;
    if (rhythm[s]) col = strip.Color(60, 20, 0);
    if (bass[s] >= 0) col = colorForNote(bass[s]);
    if (melody[s] >= 0) col = colorForNote(melody[s]);
    if (s == activeStep) col = strip.Color(120,120,120);

    int start = 3 + s * block;
    int end = min(NUM_LEDS, start + block);
    for (int i = start; i < end; i++) strip.setPixelColor(i, col);
  }
  strip.show();
}

// ===================== AUDIO SLICES =====================
void updateStepAudioSlices() {
  if (!sliceActive) return;

  unsigned long now = millis();
  if (now < stepStartMs) { noTone(AUDIO_PIN); return; }

  if (now < sliceKickEnd) {
    if (curDrumBits) {
      if (curDrumBits & 1) tone(AUDIO_PIN, 110);
      else if (curDrumBits & 2) tone(AUDIO_PIN, 220);
      else if (curDrumBits & 4) tone(AUDIO_PIN, 880);
    } else noTone(AUDIO_PIN);
  } else if (now < sliceBassEnd) {
    uint16_t f = noteFromIndex(curBassIdx, true);
    if (f) tone(AUDIO_PIN, f); else noTone(AUDIO_PIN);
  } else if (now < sliceMelEnd) {
    uint16_t f = noteFromIndex(curMelIdx, false);
    if (f) tone(AUDIO_PIN, f); else noTone(AUDIO_PIN);
  } else {
    noTone(AUDIO_PIN);
    sliceActive = false;
  }
}

// ===================== REPLACE (1 loop) =====================
void armReplaceOneLoop() {
  clearSelectedLayer();
  recordArmed = true;
  recordStepsRemaining = STEPS;
  sendText("REPLACE 1LP");
  sendStateToDisplay();
}

void maybeRecordThisStep(int8_t zone, float spd) {
  if (!recordArmed || recordStepsRemaining == 0) return;

  if (recLayer == 0) {
    rhythm[stepIndex] = makeRhythmHit(zone, spd, stepIndex, mode);
  } else if (recLayer == 1) {
    int8_t idx = writeNoteIndexFromZone(zone, mode, false);
    if (mode == MODE_AMBIENT && spd < 0.6f) idx = -1;
    bass[stepIndex] = idx;
  } else {
    int8_t idx = writeNoteIndexFromZone(zone, mode, true);
    if (mode == MODE_AMBIENT && spd < 0.8f) idx = -1;
    melody[stepIndex] = idx;
  }

  recordStepsRemaining--;
  if (recordStepsRemaining == 0) {
    recordArmed = false;
    sendText("REPLACE OK");
    sendStateToDisplay();
  }
}

// ===================== STEP TICK =====================
void tickStep() {
  int8_t zone = distanceToZone(dSmooth);
  float spd = distanceSpeed();

  maybeRecordThisStep(zone, spd);

  uint8_t d = rhythm[stepIndex];
  if (mode == MODE_TRAP && stepIndex == 4) d |= 2;
  if (mode == MODE_TECHNO && stepIndex % 2 == 0) d |= 1;

  curDrumBits = d;
  curBassIdx  = bass[stepIndex];
  curMelIdx   = melody[stepIndex];

  unsigned long p = stepPeriodMs;
  unsigned long swingDelay = (swing > 0.0f && (stepIndex % 2 == 1)) ? (unsigned long)(p * swing) : 0;

  stepStartMs  = millis() + swingDelay;
  sliceKickEnd = stepStartMs + (unsigned long)(p * 0.20f);
  sliceBassEnd = sliceKickEnd + (unsigned long)(p * 0.35f);
  sliceMelEnd  = sliceBassEnd + (unsigned long)(p * 0.35f);
  sliceActive  = true;

  showSequencerLeds(stepIndex);
  stepIndex = (stepIndex + 1) % STEPS;
}

// ===================== SETUP / LOOP =====================
void setup() {
  Serial.begin(9600);

  // Main buttons
  pinMode(BTN_W, INPUT_PULLUP);
  pinMode(BTN_A, INPUT_PULLUP);
  pinMode(BTN_S, INPUT_PULLUP);
  pinMode(BTN_D, INPUT_PULLUP);

  // Mode buttons
  pinMode(BTN_M_AMBIENT, INPUT_PULLUP);
  pinMode(BTN_M_TRAP, INPUT_PULLUP);
  pinMode(BTN_M_TECHNO, INPUT_PULLUP);

  // Init debounce states
  bUp.lastState    = digitalRead(bUp.pin);
  bLeft.lastState  = digitalRead(bLeft.pin);
  bDown.lastState  = digitalRead(bDown.pin);
  bRight.lastState = digitalRead(bRight.pin);
  bAmb.lastState   = digitalRead(bAmb.pin);
  bTrap.lastState  = digitalRead(bTrap.pin);
  bTech.lastState  = digitalRead(bTech.pin);

  strip.begin();
  strip.setBrightness(BRIGHTNESS);
  strip.show();

  pinMode(AUDIO_PIN, OUTPUT);
  noTone(AUDIO_PIN);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  clearAllLoops();
  applyModePreset(MODE_AMBIENT);

  lastStepMs = millis();
}

void loop() {
  updateDistance();

  // Mode buttons (instant)
  if (btnPressed(bAmb))  applyModePreset(MODE_AMBIENT);
  if (btnPressed(bTrap)) applyModePreset(MODE_TRAP);
  if (btnPressed(bTech)) applyModePreset(MODE_TECHNO);

  // Normal controls
  bool upPress    = btnPressed(bUp);
  bool leftPress  = btnPressed(bLeft);
  bool downPress  = btnPressed(bDown);
  bool rightPress = btnPressed(bRight);

  if (leftPress) {
    recLayer = (recLayer + 1) % 3;
    sendStateToDisplay();
  }

  if (upPress) {
    clearAllLoops();
    stepIndex = 0;
  }

  if (downPress) {
    armReplaceOneLoop();
  }

  if (rightPress) {
    for (uint8_t i = 0; i < STEPS; i++) {
      int8_t z = (int8_t)random(0, 8);
      float spd = 1.5f;
      if (recLayer == 0) rhythm[i] = makeRhythmHit(z, spd, i, mode);
      else if (recLayer == 1) bass[i] = writeNoteIndexFromZone(z, mode, false);
      else melody[i] = writeNoteIndexFromZone(z, mode, true);
    }
    sendText("RND");
    sendStateToDisplay();
  }

  // Step clock
  unsigned long now = millis();
  if (now - lastStepMs >= stepPeriodMs) {
    lastStepMs += stepPeriodMs;
    tickStep();
  }

  // Audio slices
  updateStepAudioSlices();
}
