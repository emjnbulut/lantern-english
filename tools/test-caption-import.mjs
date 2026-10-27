import assert from "node:assert/strict";
import { parseJSON3, parseSRT } from "./import-video-captions.mjs";

const manual = parseJSON3({events:[
  {tStartMs:1000,dDurationMs:3000,segs:[{utf8:'A <i>first</i> line.'}]},
  {tStartMs:3000,dDurationMs:3000,segs:[{utf8:'A second line.'}]},
  {tStartMs:12000,dDurationMs:1000,segs:[{utf8:'Outside duration'}]}
]},5);
assert.deepEqual(manual,[{start:1,end:3,text:'A first line.'},{start:3,end:5,text:'A second line.'}]);
assert.throws(()=>parseJSON3({},5));
const rolled = parseJSON3({events:[
  {tStartMs:1000,dDurationMs:10000,segs:[{utf8:'Hello',tOffsetMs:0},{utf8:'world.',tOffsetMs:500}]},
  {tStartMs:1000,dDurationMs:10000,segs:[{utf8:'Hello',tOffsetMs:0},{utf8:'world.',tOffsetMs:500}]},
  {tStartMs:2000,aAppend:1,segs:[{utf8:'\n'}]},
  {tStartMs:5000,dDurationMs:10000,segs:[{utf8:'Next',tOffsetMs:0},{utf8:'line.',tOffsetMs:500}]}
]},8,true);
assert.equal(rolled.map(c=>c.text).join(' '),'Hello world. Next line.');
assert.ok(rolled.every((c,i)=>c.end<=8&&c.start<c.end&&(!i||rolled[i-1].end<=c.start)));
assert.deepEqual(parseSRT('1\r\n00:00:01,250 --> 00:00:03,000\r\nHello\r\nworld.\r\n\r\n2\r\n00:00:02,500 --> 00:00:04,000\r\nNext.\r\n',3),[{start:1.25,end:2.5,text:'Hello world.'},{start:2.5,end:3,text:'Next.'}]);
console.log('OK: caption import checks (source times, overlap clipping, duration limits, ASR deduplication, SRT parsing).');
