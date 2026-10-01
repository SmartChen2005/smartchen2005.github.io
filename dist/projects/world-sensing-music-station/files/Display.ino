#define F_CPU 16000000UL
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <Arduino.h>
#include <string.h>
#include <ctype.h>

#define ROWS 8
#define COLS 8

// ===================================================
// ----- Framebuffer (scanned by Timer2 ISR) -----
// ===================================================
volatile uint8_t fb[ROWS];   // each row is 8 bits (columns)

// ===================================================
// ----- Patterns (examples you can reuse) -----
// ===================================================
const uint8_t BOX[ROWS][COLS] = {
  {1,1,1,1,1,1,1,1},
  {1,0,0,0,0,0,0,1},
  {1,0,0,0,0,0,0,1},
  {1,0,0,0,0,0,0,1},
  {1,0,0,0,0,0,0,1},
  {1,0,0,0,0,0,0,1},
  {1,0,0,0,0,0,0,1},
  {1,1,1,1,1,1,1,1}
};

const uint8_t X_PATTERN[ROWS][COLS] = {
  {1,0,0,0,0,0,0,1},
  {0,1,0,0,0,0,1,0},
  {0,0,1,0,0,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,1,0,0,1,0,0},
  {0,1,0,0,0,0,1,0},
  {1,0,0,0,0,0,0,1}
};

// Arrow-ish simple icons (quick + readable on 8x8)
const uint8_t UP_ICON[ROWS][COLS] = {
  {0,0,0,1,1,0,0,0},
  {0,0,1,1,1,1,0,0},
  {0,1,1,1,1,1,1,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0}
};

const uint8_t DOWN_ICON[ROWS][COLS] = {
  {0,0,0,0,0,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,1,1,0,0,0},
  {0,1,1,1,1,1,1,0},
  {0,0,1,1,1,1,0,0},
  {0,0,0,1,1,0,0,0}
};

const uint8_t LEFT_ICON[ROWS][COLS] = {
  {0,0,0,0,0,0,0,0},
  {0,0,1,0,0,0,0,0},
  {0,1,1,0,0,0,0,0},
  {1,1,1,1,1,1,1,0},
  {1,1,1,1,1,1,1,0},
  {0,1,1,0,0,0,0,0},
  {0,0,1,0,0,0,0,0},
  {0,0,0,0,0,0,0,0}
};

const uint8_t RIGHT_ICON[ROWS][COLS] = {
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,1,0},
  {0,0,0,0,0,0,1,1},
  {0,1,1,1,1,1,1,1},
  {0,1,1,1,1,1,1,1},
  {0,0,0,0,0,0,1,1},
  {0,0,0,0,0,0,1,0},
  {0,0,0,0,0,0,0,0}
};

// ===================================================
// ----- Font (A–Z, 0–9, space) -----
// ===================================================
const uint8_t FONT[37][ROWS] = {
  {0x18,0x3C,0x66,0x66,0x7E,0x66,0x66,0x00}, // A
  {0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0x00}, // B
  {0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0x00}, // C
  {0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0x00}, // D
  {0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0x00}, // E
  {0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0x00}, // F
  {0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0x00}, // G
  {0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0x00}, // H
  {0x7E,0x18,0x18,0x18,0x18,0x18,0x7E,0x00}, // I
  {0x1E,0x0C,0x0C,0x0C,0x6C,0x6C,0x38,0x00}, // J
  {0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0x00}, // K
  {0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0x00}, // L
  {0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x00}, // M
  {0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0x00}, // N
  {0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0x00}, // O
  {0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0x00}, // P
  {0x3C,0x66,0x66,0x66,0x66,0x6C,0x36,0x00}, // Q
  {0x7C,0x66,0x66,0x7C,0x6C,0x66,0x66,0x00}, // R
  {0x3C,0x66,0x30,0x18,0x0C,0x66,0x3C,0x00}, // S
  {0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0x00}, // T
  {0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0x00}, // U
  {0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0x00}, // V
  {0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0x00}, // W
  {0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0x00}, // X
  {0x66,0x66,0x3C,0x18,0x18,0x18,0x18,0x00}, // Y
  {0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0x00}, // Z
  {0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0x00}, // 0
  {0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0x00}, // 1
  {0x3C,0x66,0x06,0x0C,0x30,0x60,0x7E,0x00}, // 2
  {0x3C,0x66,0x06,0x1C,0x06,0x66,0x3C,0x00}, // 3
  {0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0x00}, // 4
  {0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0x00}, // 5
  {0x1C,0x30,0x60,0x7C,0x66,0x66,0x3C,0x00}, // 6
  {0x7E,0x06,0x0C,0x18,0x18,0x18,0x18,0x00}, // 7
  {0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0x00}, // 8
  {0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0x00}, // 9
  {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00}  // SPACE
};

uint8_t char_index(char c) {
  if (c >= 'A' && c <= 'Z') return c - 'A';
  if (c >= '0' && c <= '9') return 26 + (c - '0');
  return 36;
}

// ===================================================
// ----- LED Matrix Driver (your original mapping) -----
// ===================================================
static inline void rows_all_inactive() {
  PORTD |= 0b11111100;
  PORTB |= 0b00000011;
}
static inline void cols_write_mask(uint8_t m) {
  PORTB &= ~((1<<PB2)|(1<<PB3)|(1<<PB4));
  PORTC &= ~((1<<PC5)|(1<<PC0)|(1<<PC1)|(1<<PC2)|(1<<PC3));
  if (m & (1<<0)) PORTB |= (1<<PB2);
  if (m & (1<<1)) PORTB |= (1<<PB3);
  if (m & (1<<2)) PORTB |= (1<<PB4);
  if (m & (1<<3)) PORTC |= (1<<PC5);
  if (m & (1<<4)) PORTC |= (1<<PC0);
  if (m & (1<<5)) PORTC |= (1<<PC1);
  if (m & (1<<6)) PORTC |= (1<<PC2);
  if (m & (1<<7)) PORTC |= (1<<PC3);
}

ISR(TIMER2_COMPA_vect) {
  static uint8_t row = 0;

  if (row < 6) PORTD |= (1 << (row + 2));
  else         PORTB |= (1 << (row - 6));

  cols_write_mask(0);

  row++;
  if (row >= ROWS) row = 0;

  cols_write_mask(fb[row]);

  if (row < 6) PORTD &= ~(1 << (row + 2));
  else         PORTB &= ~(1 << (row - 6));
}

void setup_pins() {
  DDRD |= 0b11111100;
  DDRB |= 0b00000011;
  DDRB |= (1<<PB2)|(1<<PB3)|(1<<PB4);
  DDRC |= (1<<PC5)|(1<<PC0)|(1<<PC1)|(1<<PC2)|(1<<PC3);
  rows_all_inactive();
  cols_write_mask(0);
}

void setup_timer2_scan() {
  TCCR2A = (1 << WGM21);
  TCCR2B = (1 << CS22);
  OCR2A  = 31;
  TIMSK2 = (1 << OCIE2A);
  sei();
}

// ===================================================
// ----- Reusable helpers -----
// ===================================================
void fb_clear() {
  uint8_t sreg = SREG; cli();
  memset((void*)fb, 0, 8);
  SREG = sreg;
}

void write_pattern_to_fb(const uint8_t pat[ROWS][COLS]) {
  uint8_t frame[8];
  for (uint8_t r = 0; r < ROWS; r++) {
    uint8_t m = 0;
    for (uint8_t c = 0; c < COLS; c++) if (pat[r][c]) m |= (1 << c);
    frame[r] = m;
  }
  uint8_t sreg = SREG; cli();
  memcpy((void*)fb, frame, 8);
  SREG = sreg;
}

void flash_pattern(const uint8_t pat[ROWS][COLS], uint8_t times, uint16_t delay_ms) {
  for (uint8_t i = 0; i < times; i++) {
    write_pattern_to_fb(pat);
    _delay_ms(delay_ms);
    fb_clear();
    _delay_ms(delay_ms);
  }
}

void scroll_text(const char *msg, uint16_t speed) {
  uint8_t len = strlen(msg);
  uint16_t total_cols = len * 9;

  for (uint16_t offset = 0; offset < total_cols; offset++) {
    uint8_t window[ROWS][COLS] = {0};

    for (uint8_t r = 0; r < ROWS; r++) {
      for (uint8_t c = 0; c < COLS; c++) {
        int col_index = offset + c;
        int char_i = col_index / 9;
        int within = col_index % 9;

        if (char_i < len && within < 8) {
          uint8_t bits = FONT[char_index(toupper((unsigned char)msg[char_i]))][r];
          window[r][c] = (bits >> (7 - within)) & 1;
        }
      }
    }

    write_pattern_to_fb(window);
    _delay_ms(speed);
  }

  fb_clear();
}

// ===================================================
// ----- Serial command handling -----
// ===================================================
bool read_line(char *out, size_t outSize) {
  static size_t idx = 0;

  while (Serial.available()) {
    char ch = (char)Serial.read();
    if (ch == '\r') continue;

    if (ch == '\n') {
      out[idx] = '\0';
      idx = 0;
      return true;
    }

    if (idx < outSize - 1) out[idx++] = ch;
  }
  return false;
}

void show_for_command(const char* cmdRaw) {
  // normalize
  char cmd[24];
  strncpy(cmd, cmdRaw, sizeof(cmd));
  cmd[sizeof(cmd)-1] = '\0';

  // trim spaces (simple)
  while (*cmd == ' ') memmove(cmd, cmd+1, strlen(cmd));
  for (int i = (int)strlen(cmd)-1; i >= 0 && cmd[i] == ' '; i--) cmd[i] = '\0';
  for (size_t i = 0; i < strlen(cmd); i++) cmd[i] = (char)toupper((unsigned char)cmd[i]);

  // map commands -> visuals (edit freely)
  if (!strcmp(cmd, "UP")) {
    write_pattern_to_fb(UP_ICON);
  } else if (!strcmp(cmd, "DOWN")) {
    write_pattern_to_fb(DOWN_ICON);
  } else if (!strcmp(cmd, "LEFT")) {
    write_pattern_to_fb(LEFT_ICON);
  } else if (!strcmp(cmd, "RIGHT")) {
    write_pattern_to_fb(RIGHT_ICON);
  } else if (!strcmp(cmd, "BOX")) {
    write_pattern_to_fb(BOX);
  } else if (!strcmp(cmd, "X")) {
    write_pattern_to_fb(X_PATTERN);
  } else if (!strcmp(cmd, "CLEAR")) {
    fb_clear();
  } else if (!strncmp(cmd, "TEXT ", 5)) {
    // e.g. Control can send:  TEXT HELLO
    scroll_text(cmd + 5, 60);
  } else {
    flash_pattern(X_PATTERN, 1, 120);
  }
}

// ===================================================
// ----- Setup & Loop -----
// ===================================================
void setup() {
  Serial.begin(9600);
  setup_pins();
  setup_timer2_scan();

  scroll_text("READY", 60);
}

void loop() {
  char line[48];
  if (read_line(line, sizeof(line))) {
    show_for_command(line);
  }
}
