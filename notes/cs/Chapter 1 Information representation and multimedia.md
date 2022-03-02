# Chapter 1 Information representation and multimedia 

## 1.1 Data Representation

### Denary

- base-10 number system

### Binary

- base-2 number system based on values 0 and 1 only

- **bit: binary digit**

- | 128  | 64   | 32   | 16   | 8    | 4    | 2    | 1    |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 0    | 0    | 0    | 0    | 0    | 0    | 0    | 0    |

### BCD (binary coded decimal)

- 4 bits represent 1 digit
- e.g. 36 -> 00110110
- addition in BCD -> if a digit is greater than 9, we add 6 to it
- usage: displaying alpha-numeric

### Haxadecimal numbers

- base-16 number system

- | A(10) | B(11) | C(12) | D(13) | E(14) | F(15) |
  | :---- | :---- | :---- | :---- | :---- | :---- |
  | 1010  | 1011  | 1100  | 1101  | 1110  | 1111  |

- quick way of translating hexadecimal to binary is by converting to BCD

- e.g. A5 in binary -> 1010 0101

- usage: color code, addresses

### Two's complement

- making the MSB (most significant bit) a sign bit

- | -128 | 64   | 32   | 16   | 8    | 4    | 2    | 1    |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | 0    | 0    | 0    | 0    | 0    | 0    | 0    | 0    |

- conversion between negative denary and binary two's complement

  1. flip all the bits: 0 to 1, 1 to 0
  2. add 1

### Ascii Code

- | 32    | 48   | 65   | 97   |
  | :---- | :--- | :--- | :--- |
  | Space | 0    | A    | a    |

- 8 bits per letter

### Unicode (UTF-8)



## 1.2 Multimedia

### Image

Bit-map image

- system that uses pixels to make up an image
- pixel: smallest picture element that makes up an image, color of which is stored in bits
- file header: contained in a bit-map image, represents basic information of the image, such as image resolution, size, and number of colors
- image resolution: amount of pixels an image contains per inch
- screen resolution: the number of pixels per row by the number of pixels per column (**total number of pixels = width * height**)
- color depth: number of bits used to represent color of a pixel
- **file size = number of pixels * color depth**
- pros: not big in file size and can be easily manipulated by general users

Vector Graphics

- image defined using mathematics and geometry

- i.e. points, lines, curves etc.

- vector graphics are scalable, they can be resized without losing quality

- usage: logos


### Sound

Analogue to digital converter (ADC)

- microphone pick up analogue sound wave -> ADC convert to digital signal -> then the sound wave can be stored and manipulated

Digital to analogue converter (DAC)

Sampling

- the height of analogue sound waves can be **sampled** regularly with the height being represented by a bit-code

- **sampling Rate**: number of samples taken per second

- **sampling Resolution(Bit depth)**: no. of bits assigned to each sample

- bit rate: number of bits required to store 1s of sound

  bit rate = sampling rate * sampling resolution

- file size = bit rate * length of sound

### Video

- frame rate (fps): number of video frames per second

## 1.3 File Compression

### Lossy Compression

- original version can't be retrieved
- reduces file size more than lossless
- **perceptual music shaping**: reducing certain parts of a sound which are less audible to human hearing

### Lossless Compression

- original version can be retrieved

- Run-lenth encoding: consecutive values are stored as a single data value and count

  e.g. 00002111 can be written as (0-4)2(1-3)
