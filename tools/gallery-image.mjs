// Reserve the natural image ratio before loading, without a build dependency.
export function imageDimensions(bytes) {
  let width,height,orientation=1;
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);}
  else if(bytes.subarray(0,3).toString()==='GIF'){width=bytes.readUInt16LE(6);height=bytes.readUInt16LE(8);}
  else if(bytes.readUInt16BE(0)===0xffd8){
    let at=2;
    while(at+4<bytes.length){
      if(bytes[at++]!==0xff)continue;
      while(bytes[at]===0xff)at++;
      const marker=bytes[at++];if(marker===0xda||marker===0xd9)break;
      if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
      const length=bytes.readUInt16BE(at);if(length<2||at+length>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){height=bytes.readUInt16BE(at+3);width=bytes.readUInt16BE(at+5);}
      if(marker===0xe1&&bytes.subarray(at+2,at+8).toString()==='Exif\0\0'){
        const base=at+8,little=bytes.subarray(base,base+2).toString()==='II';
        const u16=p=>little?bytes.readUInt16LE(p):bytes.readUInt16BE(p),u32=p=>little?bytes.readUInt32LE(p):bytes.readUInt32BE(p);
        const directory=base+u32(base+4);
        if(directory+2<bytes.length){const count=u16(directory);for(let i=0;i<count;i++){const tag=directory+2+i*12;if(tag+12>at+length)break;if(u16(tag)===0x112)orientation=u16(tag+8);}}
      }
      at+=length;
    }
  }else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'){
    const type=bytes.subarray(12,16).toString();
    if(type==='VP8X'){width=1+bytes.readUIntLE(24,3);height=1+bytes.readUIntLE(27,3);}
    else if(type==='VP8 '){width=bytes.readUInt16LE(26)&0x3fff;height=bytes.readUInt16LE(28)&0x3fff;}
    else if(type==='VP8L'){const bits=bytes.readUInt32LE(21);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);}
  }else {const ispe=bytes.indexOf(Buffer.from('ispe'));if(ispe>=0&&ispe+16<=bytes.length){width=bytes.readUInt32BE(ispe+8);height=bytes.readUInt32BE(ispe+12);}}
  if(!width||!height||width>100000||height>100000)throw new Error('Image dimensions could not be read; the previous site is preserved.');
  if(orientation>=5&&orientation<=8)[width,height]=[height,width];
  return {width,height};
}
