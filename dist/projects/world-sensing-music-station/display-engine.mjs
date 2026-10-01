import {FONT} from './matrix-font.mjs';
export function displayText(message) {
  // Display.ino copies each command into char cmd[24] before parsing TEXT.
  return (`TEXT ${message}`).slice(0,23).trim().toUpperCase().slice(5);
}
export function matrixFrame(text,offset=0) {
  return Array.from({length:64},(_,i)=>{
    const row=Math.floor(i/8), column=offset+i%8;
    const character=text[Math.floor(column/9)], within=column%9;
    if(!character||within===8)return false;
    const code=character.charCodeAt(0);
    const index=code>=65&&code<=90?code-65:code>=48&&code<=57?26+code-48:36;
    return !!(FONT[index][row]>>(7-within)&1);
  });
}
