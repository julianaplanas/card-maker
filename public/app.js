(function(){
const $=id=>document.getElementById(id);
const app=$('app'),layer=$('layer'),page=$('page'),ink=$('ink'),card=$('card'),bin=$('bin'),say=$('say'),count=$('count');
const W=720,H=960;
page.width=ink.width=W;page.height=ink.height=H;
const pg=page.getContext('2d',{willReadFrequently:true}),ik=ink.getContext('2d');
let source=null,z=10,stack=[],restore=false,lastClick=0;

function tell(t){say.textContent=t;}

/* ---------- sound ---------- */
let ac=null,muted=false;
function audio(){
  if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;}}
  if(ac&&ac.state==='suspended')ac.resume();
}
function noise(dur,type,freq,gain,when){
  if(!ac||muted)return;
  const n=Math.floor(ac.sampleRate*dur),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=ac.createBufferSource();s.buffer=b;
  const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;
  const g=ac.createGain();g.gain.value=gain;
  s.connect(f);f.connect(g);g.connect(ac.destination);
  s.start(ac.currentTime+(when||0));
}
function tone(f0,f1,dur,gain,type,when){
  if(!ac||muted)return;
  const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+(when||0);
  o.type=type||'sine';
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur+0.02);
}
const snd={
  tick:()=>noise(.03,'highpass',3000,.25),
  snip:()=>{noise(.05,'highpass',2500,.5);noise(.06,'highpass',1800,.5,.09);},
  glue:()=>{tone(320,110,.14,.3);noise(.08,'lowpass',500,.2);},
  trash:()=>{tone(110,50,.25,.5,'triangle');noise(.2,'lowpass',900,.5);noise(.08,'bandpass',1400,.3,.18);noise(.06,'bandpass',1800,.2,.28);},
  pop:()=>tone(280,900,.11,.3,'square'),
  punch:()=>{tone(200,80,.07,.45,'square');noise(.03,'highpass',2000,.3);},
  mark:()=>noise(.05,'bandpass',900,.14),
  rip:()=>{noise(.2,'bandpass',1300,.45);noise(.1,'highpass',2600,.3,.06);}
};

/* ---------- the page ---------- */
function flower(c,x,y,p,m){
  c.fillStyle=p;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.arc(x+Math.cos(a)*34,y+Math.sin(a)*34,26,0,7);c.fill();}
  c.fillStyle=m;c.beginPath();c.arc(x,y,22,0,7);c.fill();
}
function drawScene(c){
  c.fillStyle='#bcd7e6';c.fillRect(0,0,W,H);
  c.fillStyle='#e8c66a';c.fillRect(0,620,W,340);
  for(let i=0;i<9;i++)for(let j=0;j<4;j++){if((i+j)%2){c.fillStyle='#d9a441';c.fillRect(i*80,640+j*80,80,80);}}
  c.fillStyle='#d21f1b';c.beginPath();c.arc(560,150,90,0,7);c.fill();
  c.fillStyle='#fbfaf5';[[140,130,50],[200,110,64],[262,134,46]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill();});
  c.strokeStyle='#1f6b3a';c.lineWidth=10;c.lineCap='round';
  [[300,560,220,330],[330,560,340,280],[360,560,470,340]].forEach(([a,b,x,y])=>{c.beginPath();c.moveTo(a,b);c.quadraticCurveTo((a+x)/2+20,(b+y)/2,x,y);c.stroke();});
  flower(c,220,330,'#f7d117','#d21f1b');flower(c,340,280,'#d21f1b','#f7d117');flower(c,470,340,'#fbfaf5','#1f3f94');
  c.fillStyle='#1f3f94';c.beginPath();c.moveTo(270,540);c.lineTo(390,540);c.quadraticCurveTo(470,660,400,760);c.lineTo(260,760);c.quadraticCurveTo(190,660,270,540);c.fill();
  c.fillStyle='#fbfaf5';c.fillRect(250,640,160,22);
  c.fillStyle='#111111';c.beginPath();c.ellipse(560,760,90,110,0,0,7);c.fill();
  c.beginPath();c.arc(560,620,62,0,7);c.fill();
  c.beginPath();c.moveTo(510,590);c.lineTo(506,530);c.lineTo(552,566);c.fill();
  c.beginPath();c.moveTo(610,590);c.lineTo(616,530);c.lineTo(568,566);c.fill();
  c.fillStyle='#f7d117';c.beginPath();c.ellipse(538,616,12,16,0,0,7);c.fill();c.beginPath();c.ellipse(584,616,12,16,0,0,7);c.fill();
  c.fillStyle='#111111';c.fillRect(535,604,6,24);c.fillRect(581,604,6,24);
  c.strokeStyle='#111111';c.lineWidth=22;c.beginPath();c.moveTo(640,820);c.quadraticCurveTo(710,780,680,700);c.stroke();
  c.fillStyle='#f7d117';c.beginPath();c.ellipse(120,800,60,42,-0.3,0,7);c.fill();
}
function portrait(c){
  c.fillStyle='#1f3f94';c.fillRect(0,0,W,H);
  c.fillStyle='#f7d117';c.beginPath();c.moveTo(120,960);c.quadraticCurveTo(360,600,600,960);c.fill();
  c.fillStyle='#e9b48c';c.beginPath();c.ellipse(360,470,170,220,0,0,7);c.fill();
  c.fillStyle='#d21f1b';c.beginPath();c.ellipse(360,270,250,50,0,0,7);c.fill();c.fillRect(230,110,260,170);
  c.fillStyle='#fbfaf5';c.beginPath();c.ellipse(295,440,34,24,0,0,7);c.fill();c.beginPath();c.ellipse(425,440,34,24,0,0,7);c.fill();
  c.fillStyle='#111111';c.beginPath();c.arc(300,442,13,0,7);c.fill();c.beginPath();c.arc(420,442,13,0,7);c.fill();
  c.strokeStyle='#8a4b2a';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(360,460);c.lineTo(345,540);c.lineTo(375,545);c.stroke();
  c.strokeStyle='#111111';c.lineWidth=26;c.beginPath();c.moveTo(270,590);c.quadraticCurveTo(360,560,360,590);c.quadraticCurveTo(360,560,450,590);c.stroke();
  c.fillStyle='#d21f1b';c.beginPath();c.ellipse(360,640,46,16,0,0,7);c.fill();
  c.fillStyle='#fbfaf5';c.beginPath();c.arc(150,150,60,0,7);c.fill();
}
function gridArt(c){
  c.fillStyle='#fbfaf5';c.fillRect(0,0,W,H);
  [[0,0,250,300,'#d21f1b'],[520,620,200,340,'#1f3f94'],[250,700,270,260,'#f7d117'],[520,0,200,160,'#f7d117'],[0,620,110,340,'#111111']].forEach(([x,y,w,h,f])=>{c.fillStyle=f;c.fillRect(x,y,w,h);});
  c.fillStyle='#111111';[250,520].forEach(x=>c.fillRect(x-9,0,18,H));[300,620].forEach(y=>c.fillRect(0,y-9,W,18));
  c.fillRect(520,151,200,18);c.fillRect(101,620,18,340);c.fillRect(250,691,270,18);
}
function lines(c,x,y,w,n){c.fillStyle='#8a8578';for(let i=0;i<n;i++)c.fillRect(x,y+i*22,i===n-1?w*0.6:w,9);}
function mag1(c){
  c.fillStyle='#f3efe4';c.fillRect(0,0,W,H);
  c.fillStyle='#d21f1b';c.fillRect(0,0,W,210);
  c.fillStyle='#fbfaf5';c.font='900 150px Arial Black, Arial, sans-serif';c.textBaseline='alphabetic';c.fillText('HELLO!',36,165);
  c.fillStyle='#f28a1c';c.beginPath();c.arc(230,470,170,0,7);c.fill();
  c.fillStyle='#1f6b3a';c.beginPath();c.ellipse(250,300,60,24,-0.5,0,7);c.fill();
  c.fillStyle='#fbe0b0';c.beginPath();c.arc(170,410,40,0,7);c.fill();
  lines(c,450,270,230,9);lines(c,450,500,230,7);
  c.fillStyle='#1f3f94';c.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?70:105;c.lineTo(560+Math.cos(a)*r,790+Math.sin(a)*r);}c.fill();
  c.fillStyle='#f7d117';c.font='900 54px Arial Black, Arial, sans-serif';c.fillText('NEW',496,810);
  c.fillStyle='#111111';c.font='900 64px Arial Black, Arial, sans-serif';c.fillText('JUICY',40,740);c.fillText('NEWS',40,810);
  lines(c,40,840,360,4);
}
function mag2(c){
  c.fillStyle='#f7d117';c.fillRect(0,0,W,H);
  c.fillStyle='#bcd7e6';c.fillRect(40,40,640,520);
  c.fillStyle='#fbfaf5';c.beginPath();c.arc(540,160,70,0,7);c.fill();
  c.fillStyle='#1f6b3a';c.beginPath();c.moveTo(40,560);c.lineTo(250,220);c.lineTo(460,560);c.fill();
  c.fillStyle='#2f8f5b';c.beginPath();c.moveTo(300,560);c.lineTo(500,300);c.lineTo(680,560);c.fill();
  c.fillStyle='#fbfaf5';c.beginPath();c.moveTo(250,220);c.lineTo(205,294);c.lineTo(250,280);c.lineTo(295,294);c.fill();
  c.fillStyle='#1f3f94';c.font='900 230px Arial Black, Arial, sans-serif';c.fillText('WOW',30,790);
  c.fillStyle='#d21f1b';c.beginPath();c.arc(590,850,90,0,7);c.fill();
  c.fillStyle='#fbfaf5';c.font='900 90px Arial Black, Arial, sans-serif';c.fillText('99',528,882);
  c.fillStyle='#111111';c.fillRect(40,830,400,12);c.fillRect(40,862,330,12);c.fillRect(40,894,380,12);
}

/* ---------- boxes of material: one sheet out on the table at a time; a sheet keeps its holes ---------- */
const BOXES={mags:{name:'MAGAZINE',pages:[mag1,mag2],gone:{}},paint:{name:'PAINTING',pages:[drawScene,portrait,gridArt],gone:{}},yours:{name:'YOUR PICTURE',pages:[],gone:{}}};
// real pictures from the materials folders replace the placeholder drawings once they have loaded
fetch('/api/materials').then(r=>r.ok?r.json():{}).then(m=>{Object.keys(m||{}).forEach(box=>{const B=BOXES[box],urls=m[box]||[];if(!B||!urls.length)return;const got=[];let left=urls.length;
  const done=()=>{if(--left||!got.length)return;const used=Object.keys(B.gone).length||(cur&&cur.box===box)||Object.keys(kept).some(k=>k.indexOf(box)===0);if(used)got.forEach(im=>B.pages.push(im));else B.pages=got;};
  urls.forEach(u=>{const im=new Image();im.onload=()=>{got.push(im);done();};im.onerror=done;im.src=u;});});}).catch(()=>{});
const kept={};let cur=null;
const sheetEl=$('sheet'),grip=$('grip'),sheetname=$('sheetname');
function stash(){
  if(!cur)return;const k=cur.box+cur.i;let c=kept[k];
  if(!c){c=kept[k]=document.createElement('canvas');c.width=W;c.height=H;}
  const x=c.getContext('2d');x.clearRect(0,0,W,H);x.drawImage(page,0,0);
}
function show(box,i){
  const B=BOXES[box];stash();cur={box:box,i:i};
  pg.globalCompositeOperation='source-over';pg.clearRect(0,0,W,H);
  const k=box+i,src=B.pages[i];
  if(kept[k])pg.drawImage(kept[k],0,0);
  else if(typeof src==='function')src(pg);
  else{const s=Math.max(W/src.width,H/src.height),w=src.width*s,h=src.height*s;pg.drawImage(src,(W-w)/2,(H-h)/2,w,h);}
  sheetEl.style.transform='';sheetEl.hidden=false;$('cutbar').hidden=false;app.classList.remove('nosheet');dock();onTop(false);place();
  sheetname.textContent=B.name;
  noise(.12,'bandpass',700,.25);tell('A '+B.name.toLowerCase()+' sheet is on the table.');
}
/* a box hands out a random sheet, never the one already on the table if it has another */
function draw(box){
  const B=BOXES[box],left=[];
  B.pages.forEach((p,i)=>{if(!B.gone[i]&&!(cur&&cur.box===box&&cur.i===i))left.push(i);});
  if(!left.length){snd.tick();tell(cur&&cur.box===box?'That is the only sheet left in this box.':'This box is empty.');return;}
  show(box,left[Math.floor(Math.random()*left.length)]);
}
/* on a wide screen the table is where a tool's options are laid out */
const wideMQ=window.matchMedia('(min-width:1100px)');
function dock(){const home=wideMQ.matches?$('table'):$('cardcell'),s=$('side');if(s.parentNode!==home){home.appendChild(s);place();}}
/* the sheet and a tool's options lie on the same table, one over the other: whichever was touched last is on top */
function onTop(opts){$('side').classList.toggle('front',opts);}
$('side').addEventListener('pointerdown',()=>onTop(true),true);
sheetEl.addEventListener('pointerdown',()=>onTop(false),true);$('cutbar').addEventListener('pointerdown',()=>onTop(false),true);
if(wideMQ.addEventListener)wideMQ.addEventListener('change',dock);
function clearTable(){stash();cur=null;sheetEl.hidden=true;sheetEl.style.transform='';$('cutbar').hidden=true;app.classList.add('nosheet');dock();place();}
function putBack(){if(!cur)return;clearTable();noise(.12,'bandpass',500,.25);tell('Sheet put back in its box.');}
function trashSheet(){
  if(!cur)return;const t={sheet:true,box:cur.box,i:cur.i};BOXES[t.box].gone[t.i]=true;clearTable();
  stack.push(t);count.textContent=String(stack.length);
  snd.trash();bin.classList.remove('shake');void bin.offsetWidth;bin.classList.add('shake');
  tell('The whole sheet is in the trash.');
}
/* boxes are things on the table: drag to move them, tap to take a sheet out */
document.querySelectorAll('.box').forEach(b=>{
  let held=false,moved=false,sx=0,sy=0,bx=0,by=0;b._x=0;b._y=0;
  b.addEventListener('pointerdown',e=>{audio();held=true;moved=false;sx=e.clientX;sy=e.clientY;bx=b._x;by=b._y;try{b.setPointerCapture(e.pointerId);}catch(_){}});
  b.addEventListener('pointermove',e=>{
    if(!held)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.hypot(dx,dy)<6)return;
    moved=true;b._x=bx+dx;b._y=by+dy;b.style.transform='translate('+b._x+'px,'+b._y+'px)';b.classList.add('lifted');
  });
  const up=()=>{held=false;b.classList.remove('lifted');};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  b.addEventListener('click',e=>{if(moved){moved=false;e.preventDefault();e.stopImmediatePropagation();}},true);
});
document.querySelectorAll('[data-box]').forEach(b=>b.addEventListener('click',()=>{draw(b.dataset.box);}));
(function(){
  let held=false,sx=0,sy=0,dx=0,dy=0;
  const over=(el,x,y)=>{const r=el.getBoundingClientRect();return x>r.left&&x<r.right&&y>r.top&&y<r.bottom;};
  sheetEl.addEventListener('pointerdown',e=>{if(e.target===ink&&cutTool!=='hand')return;audio();held=true;sx=e.clientX;sy=e.clientY;dx=dy=0;try{sheetEl.setPointerCapture(e.pointerId);}catch(_){}sheetEl.classList.add('lifted');e.preventDefault();});
  sheetEl.addEventListener('pointermove',e=>{if(!held)return;dx=e.clientX-sx;dy=e.clientY-sy;sheetEl.style.transform='translate('+dx+'px,'+dy+'px) rotate(-2deg)';});
  const up=e=>{
    if(!held)return;held=false;sheetEl.classList.remove('lifted');
    const x=e.clientX,y=e.clientY;
    if(over(bin,x,y)){trashSheet();return;}
    if([...document.querySelectorAll('.box,.pick')].some(b=>over(b,x,y))){putBack();return;}
    sheetEl.style.transform='';
  };
  sheetEl.addEventListener('pointerup',up);sheetEl.addEventListener('pointercancel',up);
  grip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();putBack();}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();trashSheet();}});
})();
const cutBtns=document.querySelectorAll('[data-cut]');
cutBtns.forEach(b=>b.addEventListener('click',()=>{audio();cutTool=b.dataset.cut;ink.style.cursor=cutTool==='hand'?'grab':'crosshair';cutBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));tell(b.textContent.trim()+' picked up.');}));
$('file').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{BOXES.yours.pages.push(im);show('yours',BOXES.yours.pages.length-1);};im.onerror=()=>tell('That file could not be opened as a picture. Try a JPG or PNG.');im.src=r.result;};
  r.readAsDataURL(f);e.target.value='';
});

/* ---------- cutting ---------- */
let pts=null,travelled=0;
function cpos(e){const r=ink.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
function trace(c,path){c.beginPath();c.moveTo(path[0][0],path[0][1]);for(let i=1;i<path.length;i++)c.lineTo(path[i][0],path[i][1]);c.closePath();}
function drawInk(){
  ik.clearRect(0,0,W,H);if(!pts||pts.length<2)return;
  ik.lineWidth=6;ik.lineJoin='round';ik.setLineDash([16,12]);ik.strokeStyle='#d21f1b';
  ik.beginPath();ik.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ik.lineTo(pts[i][0],pts[i][1]);ik.stroke();
  ik.setLineDash([4,14]);ik.strokeStyle='rgba(17,17,17,.6)';
  ik.beginPath();ik.moveTo(pts[pts.length-1][0],pts[pts.length-1][1]);ik.lineTo(pts[0][0],pts[0][1]);ik.stroke();
}
ink.addEventListener('pointerdown',e=>{if(cutTool==='hand')return;audio();
  if(cutTool!=='scissors'&&cutTool!=='tear'){const c=cpos(e);cut(shape(cutTool,c[0],c[1]),cutTool);return;}
  try{ink.setPointerCapture(e.pointerId);}catch(_){}pts=[cpos(e)];travelled=0;e.preventDefault();});
ink.addEventListener('pointermove',e=>{
  if(!pts)return;
  const p=cpos(e),q=pts[pts.length-1],d=Math.hypot(p[0]-q[0],p[1]-q[1]);
  if(d<6)return;
  pts.push(p);travelled+=d;if(travelled>40){travelled=0;snd.tick();}
  drawInk();
});
ink.addEventListener('pointerup',()=>{if(!pts)return;const path=pts;pts=null;ik.clearRect(0,0,W,H);cut(cutTool==='tear'?path.map(q=>[q[0]+(Math.random()-.5)*16,q[1]+(Math.random()-.5)*16]):path,cutTool);});
ink.addEventListener('pointercancel',()=>{pts=null;ik.clearRect(0,0,W,H);});

function shape(kind,x,y){
  const out=[];
  if(kind==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?38:90;out.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}}
  else if(kind==='heart'){for(let i=0;i<36;i++){const t=i/36*Math.PI*2;out.push([x+5.2*16*Math.pow(Math.sin(t),3),y-5.2*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))]);}}
  else{for(let i=0;i<18;i++){const a=i/18*Math.PI*2;out.push([x+Math.cos(a)*24,y+Math.sin(a)*24]);}}
  return out;
}
function cut(path,kind){
  let area=0;
  for(let i=0;i<path.length;i++){const a=path[i],b=path[(i+1)%path.length];area+=a[0]*b[1]-b[0]*a[1];}
  if(path.length<8||Math.abs(area)/2<1500){tell('Too small to cut. Drag a bigger loop.');return;}
  let x0=W,y0=H,x1=0,y1=0;
  path.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);});
  x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(W,Math.ceil(x1));y1=Math.min(H,Math.ceil(y1));
  const bw=x1-x0,bh=y1-y0;if(bw<4||bh<4){tell('Too small to cut. Drag a bigger loop.');return;}
  const cv=document.createElement('canvas');cv.width=bw;cv.height=bh;
  const c=cv.getContext('2d');
  c.save();c.translate(-x0,-y0);trace(c,path);c.clip();c.drawImage(page,0,0);c.restore();
  const data=c.getImageData(0,0,bw,bh).data;let solid=0;
  for(let i=3;i<data.length;i+=4*37){if(data[i]>20)solid++;}
  if(!solid){tell('Nothing left to cut there. Try another spot, or take a new page.');return;}
  const mid=path[Math.floor(path.length/3)];
  const px=pg.getImageData(Math.min(W-1,Math.max(0,Math.round(mid[0]))),Math.min(H-1,Math.max(0,Math.round(mid[1]))),1,1).data;
  const edge=px[3]>20?'rgb('+px[0]+','+px[1]+','+px[2]+')':'#f3efe4';
  pg.save();pg.globalCompositeOperation='destination-out';trace(pg,path);pg.fill();pg.restore();
  const r=ink.getBoundingClientRect(),a=app.getBoundingClientRect(),k=r.width/W;
  const left=r.left-a.left+x0*k,top=r.top-a.top+y0*k;
  addPiece(cv,bw*k,bh*k,left+8,top-8);
  const n=(kind==='scissors'||kind==='tear')?1+Math.floor(Math.random()*2):0;
  for(let i=0;i<n;i++)addPiece(sliver(edge),30+Math.random()*16,22+Math.random()*12,left+bw*k*Math.random(),top+bh*k+6+Math.random()*24);
  if(kind==='tear')snd.rip();else if(kind==='scissors')snd.snip();else snd.punch();
  tell('Cut. The piece and its offcuts are loose now. Drag them to the card, or to the trash.');
}
function sliver(color){
  const cv=document.createElement('canvas');cv.width=80;cv.height=60;
  const c=cv.getContext('2d');
  c.beginPath();c.moveTo(4+Math.random()*20,6+Math.random()*14);c.lineTo(60+Math.random()*16,10+Math.random()*30);c.lineTo(14+Math.random()*30,44+Math.random()*12);c.closePath();
  c.fillStyle=color;c.fill();c.strokeStyle='rgba(17,17,17,.5)';c.lineWidth=2;c.stroke();
  return cv;
}

/* ---------- loose pieces ---------- */
function addPiece(cv,w,h,x,y){
  cv.className='piece';
  cv.style.width=w+'px';cv.style.height=h+'px';cv.style.left=x+'px';cv.style.top=y+'px';
  cv.style.setProperty('--r',(Math.random()*12-6).toFixed(1)+'deg');
  cv.style.zIndex=String(++z);
  layer.appendChild(cv);
  if(!cv._drag){cv._drag=true;drag(cv);}
  return cv;
}
function inside(el,target,pad){
  const r=el.getBoundingClientRect(),t=target.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  return cx>t.left-pad&&cx<t.right+pad&&cy>t.top-pad&&cy<t.bottom+pad;
}
function drag(el){
  let held=false,ox=0,oy=0,sx=0,sy=0,sr=0,sz='6',wasGlued=false,wasDry=false;
  el.addEventListener('pointerdown',e=>{
    audio();
    if(tool==='sound'){press(el,e,5000,()=>el._snd,u=>{el._snd=u;el.classList.add('loud');});return;}
    if(tool==='copy'){copyPiece(el);e.preventDefault();return;}
    if(pinned(el)){el.classList.remove('stuck');void el.offsetWidth;el.classList.add('stuck');snd.tick();tell('Held down by tape.');e.preventDefault();return;}
    const head=el._pins&&onPin(el,e);if(head){e.preventDefault();pullPin(el,e,head);return;}
    if(spins(el)&&el.dataset.glued){spin(el,e);return;}
    if(el._pin){el.classList.remove('stuck');void el.offsetWidth;el.classList.add('stuck');snd.tick();tell('Held by its pins.');e.preventDefault();return;}
    pick(el);
    sx=el.offsetLeft;sr=angleOf(el);sy=el.offsetTop;sz=el.style.zIndex;wasGlued=!!el.dataset.glued;wasDry=!!el.dataset.dry;
    held=true;try{el.setPointerCapture(e.pointerId);}catch(_){}
    ox=e.clientX-el.offsetLeft;oy=e.clientY-el.offsetTop;
    el.classList.add('held');el.style.zIndex=String(++z);e.preventDefault();
  });
  el.addEventListener('pointermove',e=>{if(!held)return;el.style.left=(e.clientX-ox)+'px';el.style.top=(e.clientY-oy)+'px';if(picked===el)placeTurn();});
  const up=()=>{
    if(!held)return;held=false;el.classList.remove('held');
    const moved=Math.hypot(el.offsetLeft-sx,el.offsetTop-sy)>12,left=wasGlued&&moved;
    if(!moved&&el._snd)hear(el._snd,el._tape);
    if(left&&el.dataset.peel){unglue(el);noise(.06,'highpass',3000,.15);}
    else if(left&&el.dataset.sticky){tear(el,sx,sy,sr);unglue(el);snd.rip();}
    else if(left){residue(sx,sy,el,wasDry,sz);unglue(el);if(wasDry)snd.rip();}
    if(inside(el,bin,10)){toTrash(el);return;}
    if(inside(el,card,0)){
      if(!el.dataset.glued&&(el.dataset.sticky||el.dataset.peel)){el.dataset.glued='1';el.dataset.face=face;el.dataset.dry='1';el.classList.add('dry');snd.glue();tell(left&&el.dataset.sticky?'Peeled off and stuck down again. It tore the paper a little.':'Stuck down.');}
      else if(!el.dataset.glued){
        el.dataset.glued='1';el.dataset.face=face;el.classList.add('wet');snd.glue();$('cardhint').hidden=true;
        tell(left?'Moved. Some glue stayed where it was.':'Glued. The glue dries in 8 seconds.');
        el._t=setTimeout(()=>{el.dataset.dry='1';el.classList.remove('wet');el.classList.add('dry');},DRY);
      }
    }else if(left&&el.dataset.peel){tell('Peeled off.');}
    else if(left&&el.dataset.sticky){tell('Peeled off. It tore the paper a little.');}
    else if(left){tell(wasDry?'Ripped off. A patch of dried glue stayed on the card.':'Peeled off. A smear of glue stayed on the card.');}
  };
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}

/* ---------- trash ---------- */
const DRY=8000;
/* ---------- turning a piece: tap it, then drag the round handle that appears at its corner ---------- */
let picked=null;
const turn=document.createElement('button');
turn.type='button';turn.id='turn';turn.hidden=true;turn.setAttribute('aria-label','Turn this piece. Drag around it, or use the left and right arrow keys.');
turn.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 3v5h-5"/></svg>';
layer.appendChild(turn);
function angleOf(el){return parseFloat(el.style.getPropertyValue('--r'))||0;}
function placeTurn(){
  if(!picked||!picked.isConnected||picked.hidden){turn.hidden=true;return;}
  const w=parseFloat(picked.style.width),h=parseFloat(picked.style.height),cx=picked.offsetLeft+w/2,cy=picked.offsetTop+h/2;
  const a=angleOf(picked)*Math.PI/180+Math.atan2(-h/2,w/2),d=Math.hypot(w,h)/2+26;
  turn.style.left=(cx+Math.cos(a)*d-22)+'px';turn.style.top=(cy+Math.sin(a)*d-22)+'px';turn.hidden=false;
}
function pick(el){picked=el;placeTurn();}
/* turning a glued piece is moving it: the old glue stays behind and the piece is stuck down again, wet */
function turned(el,wasGlued,wasDry,was){
  if(!wasGlued)return;
  if(el.dataset.peel)return;
  if(el.dataset.sticky){tear(el,el.offsetLeft,el.offsetTop,was);snd.rip();return;}
  /* the old glue stays on the card, under the piece: the piece is lifted above it */
  residue(el.offsetLeft,el.offsetTop,el,wasDry,el.style.zIndex);el.style.zIndex=String(++z);unglue(el);if(wasDry)snd.rip();
  if(inside(el,card,0)){
    el.dataset.glued='1';el.dataset.face=face;el.classList.add('wet');snd.glue();
    el._t=setTimeout(()=>{el.dataset.dry='1';el.classList.remove('wet');el.classList.add('dry');},DRY);
  }
}
(function(){
  let held=false,a0=0,r0=0,cx=0,cy=0,glued=false,dry=false,ticks=0;
  const ang=e=>Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
  turn.addEventListener('pointerdown',e=>{
    if(!picked)return;audio();held=true;try{turn.setPointerCapture(e.pointerId);}catch(_){}
    const r=picked.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;
    a0=ang(e);r0=angleOf(picked);glued=!!picked.dataset.glued;dry=!!picked.dataset.dry;ticks=0;e.preventDefault();
  });
  turn.addEventListener('pointermove',e=>{
    if(!held||!picked)return;
    const r=r0+(ang(e)-a0);picked.style.setProperty('--r',r.toFixed(1)+'deg');placeTurn();
    const t=Math.round(r/12);if(t!==ticks){ticks=t;snd.tick();}
  });
  const up=()=>{if(!held)return;held=false;if(picked&&Math.abs(angleOf(picked)-r0)>1)turned(picked,glued,dry,r0);};
  turn.addEventListener('pointerup',up);turn.addEventListener('pointercancel',up);
  turn.addEventListener('keydown',e=>{
    if(!picked||(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'))return;e.preventDefault();
    const g=!!picked.dataset.glued,d=!!picked.dataset.dry;
    const was=angleOf(picked);
    picked.style.setProperty('--r',(was+(e.key==='ArrowLeft'?-5:5)).toFixed(1)+'deg');placeTurn();snd.tick();turned(picked,g,d,was);
  });
  document.addEventListener('pointerdown',e=>{if(picked&&e.target!==turn&&!turn.contains(e.target)&&e.target!==picked)pick(null);});
})();
function unglue(el){clearTimeout(el._t);delete el.dataset.glued;delete el.dataset.face;delete el.dataset.dry;el.classList.remove('wet','dry');}
function residue(x,y,el,dry,zi){
  const w=parseFloat(el.style.width)||40,h=parseFloat(el.style.height)||40,d=document.createElement('div'),r=()=>30+Math.round(Math.random()*40);
  d.className='goo';d.dataset.face=face;d.setAttribute('aria-hidden','true');if(zi)d.style.zIndex=zi;
  d.style.left=(x+w*0.2)+'px';d.style.top=(y+h*0.2)+'px';d.style.width=(w*0.6)+'px';d.style.height=(h*0.6)+'px';
  d.style.borderRadius=r()+'% '+r()+'% '+r()+'% '+r()+'%';
  d.style.background=dry?'rgba(201,164,40,.6)':'rgba(247,209,23,.32)';
  layer.appendChild(d);
}

/* ---------- markers and white-out: ink belongs to whatever it lands on ---------- */
let MW=600;const MH=840,COLORS={black:'#111111',red:'#d21f1b',blue:'#1f3f94'};
function inkCanvas(id){
  const c=document.createElement('canvas');c.id=id;
  c.className='ink';c.width=MW;c.height=MH;c.setAttribute('aria-hidden','true');layer.appendChild(c);return c;
}
/* base = ink on the card itself (under every piece); wet = the stroke being drawn; marks = invisible pad that catches the pen */
const baseF=inkCanvas('base'),wet=inkCanvas('wet'),marks=inkCanvas('marks'),baseO=inkCanvas('baseopen');
baseO.width=1200;baseO.hidden=true;
const baseE=inkCanvas('baseenv');baseE.width=1200;baseE.hidden=true;
let mk=baseF.getContext('2d'),face='front';const wt=wet.getContext('2d');
const origin={};
function place(){
  const c=card.getBoundingClientRect(),a=app.getBoundingClientRect();
  const ox=c.left-a.left,oy=c.top-a.top,o=origin[face];
  if(o&&(o.x!==ox||o.y!==oy)){
    const dx=ox-o.x,dy=oy-o.y;
    layer.querySelectorAll('.piece,.goo').forEach(p=>{if(p.dataset.face===face){p.style.left=(parseFloat(p.style.left)+dx)+'px';p.style.top=(parseFloat(p.style.top)+dy)+'px';}});
  }
  origin[face]={x:ox,y:oy,w:c.width,h:c.height};
  layer.querySelectorAll('.ink').forEach(m=>{m.style.left=(c.left-a.left)+'px';m.style.top=(c.top-a.top)+'px';m.style.width=c.width+'px';m.style.height=c.height+'px';});
}
place();window.addEventListener('resize',place);
if(window.ResizeObserver)new ResizeObserver(place).observe(app);
const PENS=['pen','glitter','white'];
/* ---------- hands, boxes and the mess ----------
   Every tool lives in a box on the shelf. Taking one out puts it in your hand; picking up something else leaves it lying on the table.
   It only goes back if you carry it back. Things left out spoil, for good: markers dry, white-out thickens, glitter leaks, tape gathers fluff. */
let holding=null;
const SPOIL={marker:150,white:150,tape:120,pad:200,leakEvery:18,leaks:5};
function age(it){return ((it.out||0)+(it.t0?Date.now()-it.t0:0))/1000;}
function holdable(b,it){
  const a=b.firstElementChild;it.btn=b;it.out=0;b._item=it;
  if(a.tagName==='CANVAS'){it.src=a.toDataURL();it.w=parseFloat(a.style.width);it.h=parseFloat(a.style.height);}
  else{it.src='data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(a));it.w=+a.getAttribute('width');it.h=+a.getAttribute('height');}
  /* a tool is carried out of its box: press it, drag it, and it lies wherever you let go */
  b.style.touchAction='none';
  b.addEventListener('pointerdown',e=>{
    if(b.classList.contains('out'))return;audio();e.preventDefault();
    const a=app.getBoundingClientRect();b.classList.add('out');it.t0=Date.now();
    carryTool(lay(it,e.clientX-a.left,e.clientY-a.top),e,true);
  });
}
function showHand(){}
/* the tool in use is the one that looks picked up; every other one just lies where it was left */
function activate(it){
  if(holding===it)return;if(holding)putDown();
  holding=it;it.el.classList.add('held');it.apply();setTool(it.tool);tell(it.name+', in your hand.');
}
function holdMachine(t,name){if(holding)putDown();holding={machine:true,tool:t,name:name};setTool(t);}
function dropHold(){holding=null;setTool('hand');}
function putDown(){
  const it=holding;if(!it)return;holding=null;
  if(it.machine){const k=it.tool==='copy'?'copier':'recorder';document.querySelector('.kitbox[data-kit="'+k+'"]').setAttribute('aria-expanded','false');if(k==='recorder')$('sndopts').hidden=true;}
  else{
    it.el.classList.remove('held');
    /* a stamp put down with ink still on it prints on the table */
    if(it.kind==='stamp'){it.ink=inked;if(it.ink>.25&&it.el.isConnected){
      const c=document.createElement('canvas');c.width=c.height=168;const q=c.getContext('2d');q.translate(84,84);q.scale(1.5,1.5);q.globalAlpha=Math.min(.8,it.ink);q.fillStyle=q.strokeStyle=COLORS[pad];STAMPS[it.data.stamp](q);
      spill(c,it.el.offsetLeft+it.w/2,it.el.offsetTop+it.h*.7,84);it.ink*=.6;}}
  }
  setTool('hand');
}
function spill(cv,x,y,size){cv.className='spill';cv.style.width=cv.style.height=size+'px';cv.style.left=(x-size/2)+'px';cv.style.top=(y-size/2)+'px';cv.setAttribute('aria-hidden','true');layer.appendChild(cv);}
function freeSpot(it){
  const t=$('table').getBoundingClientRect(),a=app.getBoundingClientRect(),R=Math.max(it.w,it.h),c=card.getBoundingClientRect(),right=a.right-c.right-R-30;let x=0,y=0;
  const busy=[...document.querySelectorAll('#side>.tools:not([hidden]),#sheet:not([hidden]),#cutbar:not([hidden])')].map(n=>n.getBoundingClientRect()).filter(r=>r.width);
  for(let i=0;i<14;i++){
    if(right>60&&(i>6||Math.random()<right/(right+t.width))){x=c.right-a.left+R/2+16+Math.random()*right;y=c.top-a.top+R/2+Math.random()*Math.max(20,c.height-R);}
    else{x=t.left-a.left+R/2+10+Math.random()*Math.max(20,t.width-R-20);y=t.top-a.top+R/2+50+Math.random()*Math.max(20,t.height-R-70);}
    const px=x+a.left,py=y+a.top;if(!busy.some(r=>px>r.left-R/2&&px<r.right+R/2&&py>r.top-R/2&&py<r.bottom+R/2))break;
  }
  return [x,y];
}
function lay(it,x,y){
  const el=document.createElement('div');
  el.className='loose';el._item=it;it.el=el;el.setAttribute('role','button');el.setAttribute('aria-label',it.name+', lying on the table');
  const im=document.createElement('img');im.src=it.src;im.alt='';im.draggable=false;el.appendChild(im);
  el.style.width=it.w+'px';el.style.height=it.h+'px';el.style.left=(x-it.w/2)+'px';el.style.top=(y-it.h/2)+'px';
  el.style.setProperty('--r',(it.h>it.w*1.6?(Math.random()<.5?90:-90)+(Math.random()*50-25):Math.random()*40-20).toFixed(1)+'deg');
  el.style.zIndex=String(100000+ ++z);layer.appendChild(el);it.leakAt=Date.now();
  el.addEventListener('pointerdown',e=>{audio();e.preventDefault();carryTool(el,e,false);});
  return el;
}
function carryTool(el,e,fresh){
  try{el.setPointerCapture(e.pointerId);}catch(_){}
  const ox=e.clientX-el.offsetLeft,oy=e.clientY-el.offsetTop,sx=e.clientX,sy=e.clientY,it=el._item;let moved=false;el.style.zIndex=String(100000+ ++z);
  const mv=ev=>{if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>6)moved=true;if(moved){el.style.left=(ev.clientX-ox)+'px';el.style.top=(ev.clientY-oy)+'px';}};
  const up=()=>{
    el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
    if(!moved){
      /* a plain tap: out of the box it lands somewhere free and is in your hand; on the table it is picked up or put down */
      if(fresh){const p=freeSpot(it);el.style.left=(p[0]-it.w/2)+'px';el.style.top=(p[1]-it.h/2)+'px';activate(it);}
      else if(holding!==it){activate(it);snd.tick();}
      return;
    }
    if(inside(el,bin,10)){if(holding===it)putDown();toTrash(el);return;}
    const box=document.querySelector('.kitbox[data-kit="'+it.kit+'"]'),panel=it.btn.closest('.kit,#pencase');
    if(inside(el,box,8)||(panel&&!panel.hidden&&panel.offsetParent&&inside(el,panel,0))){
      if(holding===it)putDown();
      el.remove();it.el=null;it.out+=Date.now()-it.t0;it.t0=null;it.btn.classList.remove('out');snd.tick();tell(it.name+', back in its box.');return;
    }
    it.leakAt=Date.now();
    /* carried out of its box or onto the card, it is in your hand; carried off the card, it is put down and your hand is empty */
    if(fresh||inside(el,card,0))activate(it);else if(holding===it){putDown();snd.tick();}
  };
  el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}
/* an open tube of glitter glue lying on the table leaks */
setInterval(()=>{
  layer.querySelectorAll('.loose').forEach(el=>{
    const it=el._item;if(!it||it.kind!=='glitter'||(it.leaks||0)>=SPOIL.leaks||Date.now()-it.leakAt<SPOIL.leakEvery*1000)return;
    it.leaks=(it.leaks||0)+1;it.leakAt=Date.now();
    const g=glitOf(it.c,1),size=26+it.leaks*9,c=document.createElement('canvas');c.width=c.height=size*2;const q=c.getContext('2d'),m=size;
    q.beginPath();for(let i=0;i<12;i++){const t=i/12*Math.PI*2,r=m*(.62+Math.random()*.36);q[i?'lineTo':'moveTo'](m+Math.cos(t)*r,m+Math.sin(t)*r);}q.closePath();
    q.globalAlpha=.8;q.fillStyle=g.base;q.fill();q.globalAlpha=1;q.globalCompositeOperation='source-atop';
    for(let i=0;i<size*5;i++){q.fillStyle=g.sp[Math.floor(Math.random()*g.sp.length)];q.fillRect(Math.random()*size*2,Math.random()*size*2,2+Math.random()*2,2+Math.random()*2);}
    const r=angleOf(el)*Math.PI/180,cx=el.offsetLeft+it.w/2,cy=el.offsetTop+it.h/2,d=it.h/2+size*.3;
    spill(c,cx+Math.sin(r)*d,cy-Math.cos(r)*d,size);
  });
},3000);
/* touching the bare table puts down whatever you hold, so your empty hand can move and peel things again */
app.addEventListener('pointerdown',e=>{
  if(!holding||holding.machine||e.target.closest('#card,#marks,.loose,.piece,#side,#sheet,#cutbar,#shelf,#mail,button,label'))return;
  putDown();snd.tick();tell('Put down. Your hand is empty.');
});
/* the boxes on the shelf: tap one to open it on the table, tap again to close it */
const KITS={pens:'pencase',glitter:'glitcase',white:'whitecase',tape:'tapeopts',stamps:'stampopts',stickers:'letteropts',pins:'pinopts',recorder:'sndopts',copier:null};
let padOpen=0,padSince=null;
function padWet(){return Math.max(.12,1-((padOpen+(padSince?Date.now()-padSince:0))/1000)/SPOIL.pad);}
function kitOpen(name,open){
  const b=document.querySelector('.kitbox[data-kit="'+name+'"]'),id=KITS[name];b.setAttribute('aria-expanded',String(open));
  if(id)$(id).hidden=!open;
  $('penopts').hidden=$('pencase').hidden&&$('glitcase').hidden&&$('whitecase').hidden;
  if(name==='stamps'){if(open)padSince=Date.now();else if(padSince){padOpen+=Date.now()-padSince;padSince=null;}}
  if(name==='recorder'){if(open)holdMachine('sound','the recorder');else if(holding&&holding.tool==='sound')dropHold();}
  if(name==='copier'){if(open)holdMachine('copy','the copier');else if(holding&&holding.tool==='copy')dropHold();}
  if(open)onTop(true);place();
}
document.querySelectorAll('.kitbox').forEach(b=>b.addEventListener('click',()=>{audio();snd.tick();kitOpen(b.dataset.kit,b.getAttribute('aria-expanded')!=='true');}));
/* ---------- the pencil case: fine markers, fat markers and crayons, each drawn as the thing itself ---------- */
const INKSET=[['black','#111111'],['red','#d21f1b'],['blue','#1f3f94'],['yellow','#f7c600'],['green','#1f9d55'],['pink','#ff4fa3'],['orange','#ff7a1a'],['purple','#7a3fd0']];
const CASE=[{kind:'fine',name:'Fine marker',tip:.5,w:22,h:96},{kind:'fat',name:'Fat marker',tip:2.4,w:36,h:104},{kind:'crayon',name:'Crayon',tip:1.5,w:20,h:86}];
function toolArt(kind,c,w,h){
  const d=shade(c,.62),l=shade(c,1.3),o=' stroke="#111" stroke-width="1.5"';
  let g='';
  if(kind==='crayon'){
    g='<path d="M'+(w/2-3)+' 2h6l4 16H'+(w/2-7)+'z" fill="'+c+'"'+o+'/><rect x="2" y="18" width="'+(w-4)+'" height="'+(h-20)+'" fill="'+c+'"'+o+'/>'
     +'<rect x="2" y="30" width="'+(w-4)+'" height="'+(h-44)+'" fill="'+l+'"'+o+'/><path d="M2 38q'+(w/4-1)+' -5 '+(w/2-2)+' 0t'+(w/2-2)+' 0M2 '+(h-22)+'q'+(w/4-1)+' -5 '+(w/2-2)+' 0t'+(w/2-2)+' 0" fill="none" stroke="'+d+'" stroke-width="2"/>';
  }else{
    const cap=kind==='fat'?40:34;
    g='<rect x="2" y="'+(cap-4)+'" width="'+(w-4)+'" height="'+(h-cap+2)+'" rx="3" fill="#f4f1e8"'+o+'/><rect x="2" y="'+(cap+10)+'" width="'+(w-4)+'" height="'+(kind==='fat'?26:20)+'" fill="'+c+'"/>'
     +'<rect x="2" y="'+(h-12)+'" width="'+(w-4)+'" height="10" rx="3" fill="'+c+'"'+o+'/>'
     +'<rect x="1" y="2" width="'+(w-2)+'" height="'+cap+'" rx="'+(kind==='fat'?5:6)+'" fill="'+c+'"'+o+'/><rect x="'+(w-8)+'" y="8" width="3" height="'+(cap-14)+'" fill="'+l+'"/><rect x="1" y="'+(cap-7)+'" width="'+(w-2)+'" height="5" fill="'+d+'"/>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'+g+'</svg>';
}
let pen={kind:'fine',color:'#111111',tip:.5};
/* tubes of glitter glue, thin and fat, and three ways to white something out */
const GL=['#f7d117','#ffffff','#d21f1b','#1f3f94','#ff8ad1','#39c5bb'];
const GLITS=[['gold','#d6aa28'],['silver','#aab3c0'],['pink','#ff4fa3'],['turquoise','#19c3b3'],['purple','#8a4fff'],['rainbow',null]];
function glitOf(c,tip){return {tip:tip,base:c||'#e9b93a',sp:c?['#ffffff','#fff6c2',shade(c,1.4),shade(c,.6),'#ffffff']:GL};}
let gl=glitOf('#d6aa28',.7),wtip=1;
function tubeArt(c,w,h,id){
  const fill=c||'url(#rb'+id+')',o=' stroke="#111" stroke-width="1.5"';let dots='';
  for(let i=0;i<w*1.1;i++){const x=4+((i*37)%(w-8)),y=30+((i*53)%(h-46));dots+='<rect x="'+x+'" y="'+y+'" width="2" height="2" fill="'+(i%3?'#ffffff':'#fff6c2')+'" opacity="'+(.5+(i%4)*.15)+'"/>';}
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><defs><linearGradient id="rb'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset=".25" stop-color="#f7d117"/><stop offset=".5" stop-color="#19c3b3"/><stop offset=".75" stop-color="#3d8bff"/><stop offset="1" stop-color="#8a4fff"/></linearGradient></defs>'
    +'<path d="M'+(w/2-2)+' 2h4l2 12h-8z" fill="#f4f1e8"'+o+'/><rect x="'+(w/2-7)+'" y="13" width="14" height="8" fill="#e2ddd0"'+o+'/>'
    +'<path d="M'+(w/2-7)+' 21h14l'+(w/2-9)+' 9v'+(h-42)+'H2V30z" fill="'+fill+'"'+o+'/>'+dots
    +'<rect x="1" y="'+(h-12)+'" width="'+(w-2)+'" height="10" fill="#cfc9bb"'+o+'/><path d="M5 '+(h-12)+'v10M'+(w/2)+' '+(h-12)+'v10M'+(w-5)+' '+(h-12)+'v10" stroke="#8d877a" stroke-width="1.5"/></svg>';
}
function whiteArt(kind){
  const o=' stroke="#111" stroke-width="1.5"',B='#1f3f94';
  if(kind==='pen')return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="100" viewBox="0 0 22 100" aria-hidden="true"><path d="M9 2h4l1 12H8z" fill="#b9bec6"'+o+'/><path d="M6 14h10l3 12H3z" fill="'+B+'"'+o+'/><rect x="3" y="26" width="16" height="72" rx="4" fill="#ffffff"'+o+'/><rect x="3" y="44" width="16" height="22" fill="'+B+'"/><rect x="7" y="50" width="8" height="10" fill="#ffffff"/></svg>';
  if(kind==='bottle')return '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="92" viewBox="0 0 44 92" aria-hidden="true"><rect x="12" y="2" width="20" height="30" rx="3" fill="'+B+'"'+o+'/><path d="M14 8h16M14 14h16M14 20h16" stroke="#16306f" stroke-width="2"/><path d="M14 32h16l10 12v40a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V44z" fill="#ffffff"'+o+'/><rect x="4" y="52" width="36" height="24" fill="'+B+'"/><rect x="12" y="58" width="20" height="12" fill="#ffffff"/></svg>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="74" height="60" viewBox="0 0 74 60" aria-hidden="true"><path d="M4 30C4 12 18 4 36 4h20c8 0 14 6 14 14v6L56 50c-3 5-8 8-14 8H24C12 58 4 46 4 30z" fill="rgba(143,193,227,.85)"'+o+'/><circle cx="28" cy="30" r="15" fill="#ffffff"'+o+'/><circle cx="28" cy="30" r="5" fill="'+B+'"'+o+'/><circle cx="52" cy="22" r="8" fill="#ffffff"'+o+'/><path d="M60 40l10 12-6 4-12-8z" fill="#ffffff"'+o+'/></svg>';
}
function kit(box,items,onPick,kitName){
  items.forEach(it=>{
    const b=document.createElement('button');b.type='button';if(typeof it.art==='string')b.innerHTML=it.art;else b.appendChild(it.art);
    b.setAttribute('aria-label',it.name);if(it.data)Object.assign(b.dataset,it.data);
    if(it.tool){it.kit=kitName;it.apply=()=>onPick(it);holdable(b,it);}
    box.appendChild(b);
  });
}
kit($('glitcase'),[].concat(GLITS.map((g,i)=>({name:'Thin tube of '+g[0]+' glitter glue',art:tubeArt(g[1],24,92,'a'+i),c:g[1],tip:.7,tool:'glitter',kind:'glitter'})),GLITS.map((g,i)=>({name:'Fat tube of '+g[0]+' glitter glue',art:tubeArt(g[1],38,104,'b'+i),c:g[1],tip:1.8,tool:'glitter',kind:'glitter'}))),it=>{gl=glitOf(it.c,it.tip);},'glitter');
kit($('whitecase'),[{name:'White-out pen',art:whiteArt('pen'),tip:.45},{name:'Bottle of white-out',art:whiteArt('bottle'),tip:1},{name:'White-out roller',art:whiteArt('roller'),tip:2.4}].map(o=>Object.assign(o,{tool:'white',kind:'white'})),it=>{wtip=it.tip;},'white');
wtip=.45;
CASE.forEach((t,ti)=>{
  const row=document.createElement('div');row.className='row';
  INKSET.forEach((c,ci)=>{
    const b=document.createElement('button');b.type='button';b.innerHTML=toolArt(t.kind,c[1],t.w,t.h);b.setAttribute('aria-label',t.name+', '+c[0]);
    holdable(b,{name:t.name+', '+c[0],tool:'pen',kind:t.kind,kit:'pens',apply:()=>{pen={kind:t.kind,color:c[1],tip:t.tip};}});
    row.appendChild(b);
  });
  $('pencase').appendChild(row);
});
let cutTool='scissors';
let tool='hand',mp=null,mtrav=0;
const toolBtns=document.querySelectorAll('[data-tool]');
function setTool(t){
  tool=t;
  marks.classList.toggle('on',PENS.includes(tool)||tool==='tape'||tool==='stamp'||tool==='letter');
  wet.style.opacity=tool==='white'?'.85':'1';
  app.classList.toggle('sounding',tool==='sound');app.classList.toggle('copying',tool==='copy');if(tool!=='sound')showTape(null);
  if(tool==='sound')micOn();else micOff();
  place();
}
/* the tool in your hand travels with it: beside the pointer while you draw or stamp, and at the end of the strip while you pull tape */
function follow(e){
  const it=holding;if(!it||it.machine||!it.el||!it.el.isConnected)return;
  const a=app.getBoundingClientRect(),c=card.getBoundingClientRect(),x=Math.max(c.left,Math.min(c.right,e.clientX))-a.left,y=Math.max(c.top,Math.min(c.bottom,e.clientY))-a.top;
  if(it.kind==='tape'){
    /* the roll runs ahead of the strip, so the end of the tape is never underneath it */
    let ux=0,uy=-1;if(pull){const d=Math.hypot(pull.x1-pull.x0,pull.y1-pull.y0);if(d>4){ux=(pull.x1-pull.x0)/d;uy=(pull.y1-pull.y0)/d;}}
    it.el.style.left=(x+ux*34-30)+'px';it.el.style.top=(y+uy*34-30)+'px';it.el.style.setProperty('--r','0deg');
  }
  else{const d=Math.max(it.w,it.h)*.5+14;it.el.style.left=(x+d*.75-it.w/2)+'px';it.el.style.top=(y-d*.75-it.h/2)+'px';}
}
function mpos(e){const r=marks.getBoundingClientRect();return [(e.clientX-r.left)*MW/r.width,(e.clientY-r.top)*MH/r.height];}
let ku=2,tip=1;
function glit(a,b){
  wt.lineCap='round';wt.lineWidth=9*ku*gl.tip;wt.globalAlpha=.78;wt.strokeStyle=gl.base;
  wt.beginPath();wt.moveTo(a[0],a[1]);wt.lineTo(b[0],b[1]);wt.stroke();wt.globalAlpha=1;
  const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3));
  for(let i=0;i<n;i++){
    const t=Math.random(),x=a[0]+(b[0]-a[0])*t+(Math.random()-.5)*8*ku*gl.tip,y=a[1]+(b[1]-a[1])*t+(Math.random()-.5)*8*ku*gl.tip;
    wt.fillStyle=gl.sp[Math.floor(Math.random()*gl.sp.length)];wt.fillRect(x,y,(1+Math.random()*1.5)*ku,(1+Math.random()*1.5)*ku);
  }
}
function seg(a,b){
  if(tool==='glitter'){glit(a,b);return;}
  const w=tool==='white';
  const it=holding&&!holding.machine?holding:null,size=tool==='pen'?pen.tip:wtip;let lw=(w?14:4.5)*ku*size,dry=0;
  if(it&&w){const thick=Math.min(1,age(it)/SPOIL.white);if(thick>=1)return;lw*=1+(Math.random()-.4)*1.6*thick;}
  if(it&&!w&&it.kind!=='crayon')dry=Math.min(1,age(it)/SPOIL.marker);
  wt.lineCap='round';wt.lineJoin='round';wt.lineWidth=lw;wt.strokeStyle=w?'#ffffff':pen.color;
  wt.beginPath();wt.moveTo(a[0],a[1]);wt.lineTo(b[0],b[1]);wt.stroke();
  if(dry>.15){
    /* a marker that lay around with its cap off skips and scratches */
    wt.save();wt.globalCompositeOperation='destination-out';
    const n=Math.round(Math.max(4,Math.hypot(b[0]-a[0],b[1]-a[1]))*lw*dry*dry/3);
    for(let i=0;i<n;i++){const t=Math.random(),g=(.8+Math.random()*2.4*dry)*ku;wt.globalAlpha=.4+dry*.6;wt.fillRect(a[0]+(b[0]-a[0])*t+(Math.random()-.5)*lw*1.2,a[1]+(b[1]-a[1])*t+(Math.random()-.5)*lw*1.2,g,g);}
    wt.restore();
  }
  if(tool==='pen'&&pen.kind==='crayon'){
    /* wax skips over the grain of the paper */
    wt.save();wt.globalCompositeOperation='destination-out';
    const n=Math.max(3,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])*lw/14));
    for(let i=0;i<n;i++){const t=Math.random(),g=(.6+Math.random()*1.6)*ku;wt.globalAlpha=.5+Math.random()*.5;wt.fillRect(a[0]+(b[0]-a[0])*t+(Math.random()-.5)*lw,a[1]+(b[1]-a[1])*t+(Math.random()-.5)*lw,g,g);}
    wt.restore();
  }
}
/* ---------- pins: a brass pin through a piece fixes it to the card at that point, and the piece turns around it ---------- */
/* a piece with one pin turns around it; with two or more it is fixed in place */
function spins(el){return !!(el._pins&&el._pins.length===1);}
function pinPoint(el,p){
  p=p||el._pin;const w=parseFloat(el.style.width),h=parseFloat(el.style.height),r=angleOf(el)*Math.PI/180,lx=(p.x-.5)*w,ly=(p.y-.5)*h;
  return [el.offsetLeft+w/2+Math.cos(r)*lx-Math.sin(r)*ly,el.offsetTop+h/2+Math.sin(r)*lx+Math.cos(r)*ly];
}
const PINKINDS=['brass','brass','red','blue','yellow','green','star','heart','pearl','black'];
function drawPin(x,kind,cx,cy,R){
  const C={brass:'#d9a520',red:'#d21f1b',blue:'#1f3f94',yellow:'#f7d117',green:'#1f9d55',star:'#ff7a1a',heart:'#ff4fa3',pearl:'#f1ece0',black:'#2a2a2a'}[kind]||'#d9a520';
  const body=()=>{x.beginPath();
    if(kind==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?R*.55:R*1.25;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.closePath();}
    else if(kind==='heart'){const s=R/22;x.moveTo(cx,cy+26*s);x.bezierCurveTo(cx-44*s,cy-2*s,cx-20*s,cy-34*s,cx,cy-12*s);x.bezierCurveTo(cx+20*s,cy-34*s,cx+44*s,cy-2*s,cx,cy+26*s);}
    else x.arc(cx,cy,R,0,7);};
  x.save();x.translate(R*.14,R*.22);body();x.fillStyle='rgba(17,17,17,.35)';x.fill();x.restore();
  const g=x.createRadialGradient(cx-R*.35,cy-R*.4,R*.08,cx,cy,R*1.25);g.addColorStop(0,'#ffffff');g.addColorStop(.3,shade(C,1.25));g.addColorStop(.7,C);g.addColorStop(1,shade(C,.5));
  body();x.fillStyle=g;x.fill();x.lineWidth=Math.max(1,R*.14);x.strokeStyle=shade(C,.4);x.stroke();
  if(kind==='brass'){x.beginPath();x.moveTo(cx-R*.5,cy);x.lineTo(cx+R*.5,cy);x.strokeStyle='rgba(90,63,5,.7)';x.stroke();}
}
const PINS_IN=PINKINDS.map((kind,i)=>{
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','A '+kind+' pin');
  const c=document.createElement('canvas');c.width=c.height=80;drawPin(c.getContext('2d'),kind,40,40,kind==='brass'?30:25);b.appendChild(c);
  b.addEventListener('pointerdown',e=>{if(b.classList.contains('out'))return;audio();e.preventDefault();b.classList.add('out');carry({kind:kind,slot:i},e);});
  $('pinbox').appendChild(b);return b;
});
/* a pin in the air: it follows the pointer, and goes into the piece it is let go over, or back into its place in the box */
function carry(pin,e){
  const fly=document.createElement('canvas');fly.id='pinfly';fly.width=fly.height=80;drawPin(fly.getContext('2d'),pin.kind,40,40,pin.kind==='brass'?30:25);layer.appendChild(fly);
  const at=ev=>{const a=app.getBoundingClientRect();fly.style.left=(ev.clientX-a.left-20)+'px';fly.style.top=(ev.clientY-a.top-26)+'px';};at(e);
  const up=ev=>{
    document.removeEventListener('pointermove',at);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);fly.remove();
    const el=ev.type==='pointerup'&&document.elementsFromPoint(ev.clientX,ev.clientY).find(n=>n.classList&&n.classList.contains('piece'));
    if(el&&el.dataset.glued&&pinDown(el,ev,pin))return;
    PINS_IN[pin.slot].classList.remove('out');snd.tick();tell('The pin is back in its box.');
  };
  document.addEventListener('pointermove',at);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
}
function pinDown(el,e,pin){
  const w=parseFloat(el.style.width),h=parseFloat(el.style.height),a=app.getBoundingClientRect(),r=-angleOf(el)*Math.PI/180;
  const px=e.clientX-a.left-(el.offsetLeft+w/2),py=e.clientY-a.top-(el.offsetTop+h/2),lx=px*Math.cos(r)-py*Math.sin(r)+w/2,ly=px*Math.sin(r)+py*Math.cos(r)+h/2;
  if(lx<0||ly<0||lx>w||ly>h)return false;
  const x=el.getContext('2d'),k=el.width/w,cx=lx*k,cy=ly*k,R=(pin.kind==='brass'?8:6.5)*k,B=Math.ceil(R*1.7);
  /* what is under the pin head is kept, so pulling the pin out shows it again, with a hole */
  let patch=null;try{patch=x.getImageData(Math.round(cx)-B,Math.round(cy)-B,B*2,B*2);}catch(_){}
  x.save();x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;drawPin(x,pin.kind,cx,cy,R);x.restore();
  (el._pins=el._pins||[]).push({x:lx/w,y:ly/h,kind:pin.kind,slot:pin.slot,patch:patch,px:Math.round(cx)-B,py:Math.round(cy)-B,R:R});el._pin=el._pins[0];
  el.dataset.pinned='1';clearTimeout(el._t);el.dataset.dry='1';el.classList.remove('wet');el.classList.add('dry');
  if(picked===el)pick(null);snd.punch();tell(spins(el)?'Pinned. It turns around the pin now.':'Pinned again. It cannot turn any more.');return true;
}
function onPin(el,e){
  const a=app.getBoundingClientRect();
  return [...el._pins].reverse().find(p=>{const P=pinPoint(el,p);return Math.hypot(e.clientX-a.left-P[0],e.clientY-a.top-P[1])<=Math.max(12,p.R*parseFloat(el.style.width)/el.width+5);})||null;
}
/* pulling a pin out: the piece is free again (still glued where it lies), and a small hole stays in it and in the card */
function pullPin(el,e,p){
  const x=el.getContext('2d'),k=el.width/parseFloat(el.style.width),cx=p.x*el.width,cy=p.y*el.height,P=pinPoint(el,p);
  x.save();x.setTransform(1,0,0,1,0,0);
  if(p.patch)x.putImageData(p.patch,p.px,p.py);
  x.globalCompositeOperation='destination-out';x.beginPath();x.arc(cx,cy,1.7*k,0,7);x.fill();
  x.globalCompositeOperation='source-atop';x.beginPath();x.arc(cx,cy,2.9*k,0,7);x.lineWidth=.9*k;x.strokeStyle='rgba(17,17,17,.3)';x.stroke();x.restore();
  const c=card.getBoundingClientRect(),a=app.getBoundingClientRect(),q=MW/c.width,hx=(P[0]-(c.left-a.left))*q,hy=(P[1]-(c.top-a.top))*q;
  mk.save();mk.beginPath();mk.arc(hx,hy,1.7*q,0,7);mk.fillStyle='#3a3630';mk.fill();mk.restore();
  el._pins.splice(el._pins.indexOf(p),1);el._pin=el._pins[0]||null;if(!el._pin){delete el._pin;delete el._pins;delete el.dataset.pinned;}noise(.05,'highpass',2500,.2);
  carry({kind:p.kind,slot:p.slot},e);
}
function spin(el,e){
  e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}
  const a=app.getBoundingClientRect(),P=pinPoint(el),w=parseFloat(el.style.width),h=parseFloat(el.style.height);
  const C0=[el.offsetLeft+w/2-P[0],el.offsetTop+h/2-P[1]],r0=angleOf(el),ang=ev=>Math.atan2(ev.clientY-a.top-P[1],ev.clientX-a.left-P[0]),a0=ang(e);let ticks=0;
  const move=ev=>{
    const d=ang(ev)-a0,c=Math.cos(d),s=Math.sin(d);
    el.style.left=(P[0]+c*C0[0]-s*C0[1]-w/2)+'px';el.style.top=(P[1]+s*C0[0]+c*C0[1]-h/2)+'px';el.style.setProperty('--r',(r0+d*180/Math.PI).toFixed(1)+'deg');
    const t=Math.round(d*180/Math.PI/15);if(t!==ticks){ticks=t;snd.tick();}
  };
  const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);};
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}
/* ---------- the copier: tap a piece and a black-and-white copy comes out onto the table; a copy of a copy is worse ---------- */
function copyPiece(el){
  const w=parseFloat(el.style.width),h=parseFloat(el.style.height);if(!w||!h)return;
  const gen=(el._gen||0)+1,cv=document.createElement('canvas');cv.width=el.width;cv.height=el.height;
  const x=cv.getContext('2d');x.drawImage(el,0,0);
  let d;try{d=x.getImageData(0,0,cv.width,cv.height);}catch(_){tell('This piece cannot be copied.');return;}
  const p=d.data,k=1.5+gen*.45,grain=18+gen*16,lift=gen*10;
  for(let y=0,i=0;y<cv.height;y++){
    /* a tired machine leaves faint bands across the page */
    const band=(Math.sin(y/ (5+gen))>.92?-22*gen:0);
    for(let c=0;c<cv.width;c++,i+=4){
      if(p[i+3]<12)continue;
      let v=.3*p[i]+.59*p[i+1]+.11*p[i+2];
      v=(v-128)*k+128+lift+band+(Math.random()-.5)*grain;
      v=v<0?0:v>255?255:v;p[i]=p[i+1]=p[i+2]=v;if(p[i+3]>60)p[i+3]=255;
    }
  }
  x.putImageData(d,0,0);
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  tone(90,140,.5,.12,'sawtooth');noise(.5,'bandpass',400,.12);
  setTimeout(()=>{
    const t=$('table'),a=app.getBoundingClientRect();let px=el.offsetLeft+26,py=el.offsetTop+26;
    if(t.offsetParent){const r=t.getBoundingClientRect();px=r.left-a.left+20+Math.random()*Math.max(10,r.width-w-40);py=r.top-a.top+60+Math.random()*Math.max(10,r.height-h-90);}
    const n=addPiece(cv,w,h,px,py);n._gen=gen;snd.pop();tell('A copy came out onto the table.');
  },450);
}
/* ---------- rubber stamps: each press prints fainter until the stamp goes back on an ink pad ---------- */
const STAMPS={
  star(x){x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?20:48;x.lineTo(Math.cos(a)*r,Math.sin(a)*r);}x.closePath();x.fill();},
  heart(x){x.beginPath();x.moveTo(0,44);x.bezierCurveTo(-70,-4,-34,-58,0,-22);x.bezierCurveTo(34,-58,70,-4,0,44);x.fill();},
  face(x){x.beginPath();x.arc(0,0,46,0,7);x.fill();x.globalCompositeOperation='destination-out';
    x.beginPath();x.arc(-16,-12,6,0,7);x.arc(16,-12,6,0,7);x.fill();x.lineWidth=6;x.lineCap='round';x.beginPath();x.arc(0,2,26,.2*Math.PI,.8*Math.PI);x.stroke();x.globalCompositeOperation='source-over';},
  flower(x){for(let i=0;i<6;i++){x.beginPath();x.ellipse(Math.cos(i*Math.PI/3)*28,Math.sin(i*Math.PI/3)*28,19,13,i*Math.PI/3,0,7);x.fill();}
    x.globalCompositeOperation='destination-out';x.beginPath();x.arc(0,0,10,0,7);x.fill();x.globalCompositeOperation='source-over';x.beginPath();x.arc(0,0,6,0,7);x.fill();},
  sun(x){x.beginPath();x.arc(0,0,24,0,7);x.fill();x.lineWidth=7;x.lineCap='round';for(let i=0;i<10;i++){const a=i*Math.PI/5;x.beginPath();x.moveTo(Math.cos(a)*32,Math.sin(a)*32);x.lineTo(Math.cos(a)*47,Math.sin(a)*47);x.stroke();}},
  cake(x){x.fillRect(-40,2,80,40);x.fillRect(-30,-22,60,20);x.fillRect(-3,-42,6,18);x.beginPath();x.ellipse(0,-48,5,8,0,0,7);x.fill();
    x.globalCompositeOperation='destination-out';x.lineWidth=5;x.beginPath();x.moveTo(-40,18);for(let i=0;i<8;i++)x.quadraticCurveTo(-35+i*10,i%2?12:26,-30+i*10,18);x.stroke();x.globalCompositeOperation='source-over';}
};
let stamp='star',pad='black',inked=1;
kit($('stamprack'),Object.keys(STAMPS).map(k=>{
  const c=document.createElement('canvas');c.width=120;c.height=150;c.style.width='60px';c.style.height='75px';const x=c.getContext('2d');x.scale(2,2);
  x.fillStyle='#7a4b22';x.beginPath();x.roundRect(21,2,18,26,8);x.fill();x.fillStyle='#9a6532';x.beginPath();x.roundRect(24,4,6,20,3);x.fill();
  x.fillStyle='#c9975a';x.strokeStyle='#111';x.lineWidth=1.5;x.beginPath();x.roundRect(4,24,52,40,4);x.fill();x.stroke();
  x.fillStyle='#b5433a';x.fillRect(5,64,50,7);x.strokeRect(5,64,50,7);
  x.save();x.translate(30,44);x.scale(.32,.32);x.fillStyle=x.strokeStyle='#4a2c10';STAMPS[k](x);x.restore();
  return {name:'The '+k+' stamp',art:c,data:{stamp:k},tool:'stamp',kind:'stamp',ink:0};
}),it=>{stamp=it.data.stamp;inked=it.ink||0;},'stamps');
kit($('padrow'),[['black','#111111'],['red','#d21f1b'],['blue','#1f3f94']].map(c=>{
  const cv=document.createElement('canvas');cv.width=168;cv.height=104;cv.style.width='84px';cv.style.height='52px';const x=cv.getContext('2d');x.scale(2,2);
  x.strokeStyle='#111';x.lineWidth=1.5;x.fillStyle='#8f959c';x.beginPath();x.roundRect(4,2,76,14,3);x.fill();x.stroke();
  x.fillStyle='#5c626a';x.beginPath();x.roundRect(2,14,80,36,4);x.fill();x.stroke();
  x.fillStyle=c[1];x.beginPath();x.roundRect(8,19,68,26,2);x.fill();x.fillStyle='rgba(255,255,255,.16)';x.fillRect(10,21,64,5);
  return {name:c[0]+' ink pad',art:cv,data:{pad:c[0]}};
}));
document.querySelectorAll('[data-pad]').forEach(b=>b.addEventListener('click',()=>{audio();pad=b.dataset.pad;if(tool==='stamp')inked=padWet();noise(.06,'lowpass',500,.3);document.querySelectorAll('[data-pad]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));tell('Inked.');}));
function press1(p){
  if(inked<.04){snd.punch();return;}
  const s=document.createElement('canvas');s.width=s.height=220;const x=s.getContext('2d');
  x.translate(110,110);x.scale(2,2);x.fillStyle=x.strokeStyle=COLORS[pad];STAMPS[stamp](x);
  /* rubber never prints evenly: speckle the print, more as the ink runs out */
  x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='destination-out';
  for(let i=0,n=260+(1-inked)*1400;i<n;i++){x.globalAlpha=.3+Math.random()*.7;x.fillRect(Math.random()*220,Math.random()*220,1+Math.random()*2.5,1+Math.random()*2.5);}
  const size=84*ku;
  wt.save();wt.translate(p[0],p[1]);wt.rotate((Math.random()-.5)*.2);wt.globalAlpha=Math.max(.1,inked);wt.drawImage(s,-size/2,-size/2,size,size);wt.restore();
  settle(1);snd.punch();inked=Math.max(.08,inked*.68);
}
/* ---------- sticker letters: three sheets in three styles; every sticker is drawn once, shown on its sheet, and can be peeled off only once ---------- */
const SUPPLY='AAAABBCCDDEEEEFFGGHHIIIJKLLMMNNÑOOOOPPQRRSSSTTUUUVWXYYZ0123456789!!??♥♥&.,';
const INKS={glitter:['#ff4fa3','#f2b705','#19c3b3','#8a4fff','#ff7a1a','#3d8bff'],bubble:['#ff5d8f','#ffb400','#35c46a','#3aa0ff','#b56bff','#ff7043'],tiles:['#d21f1b','#1f3f94','#f7d117','#1f9d55','#111111','#ff4fa3']};
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));return 'rgb('+c(n>>16)+','+c((n>>8)&255)+','+c(n&255)+')';}
function stickerArt(style,ch,n){
  const k=2,h=66,col=INKS[style][n%INKS[style].length],cv=document.createElement('canvas'),m=cv.getContext('2d');
  const F=style==='bubble'?'700 50px Fredoka,"Arial Rounded MT Bold","Comic Sans MS",sans-serif':style==='tiles'?'38px Bungee,"Arial Black",Impact,sans-serif':'46px Bungee,"Arial Black",Impact,sans-serif';
  m.font=F;const w=style==='tiles'?58:Math.ceil(m.measureText(ch).width)+22;
  cv.width=w*k;cv.height=h*k;cv._w=w;cv._h=h;
  const x=cv.getContext('2d');x.scale(k,k);x.font=F;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';const cx=w/2,cy=h/2+2;
  if(style==='tiles'){
    const r=(a,b,c,d,q)=>{x.beginPath();x.roundRect(a,b,c,d,q);};
    r(3,5,w-6,h-10,12);x.fillStyle='#ffffff';x.fill();
    r(7,9,w-14,h-18,9);x.fillStyle=col;x.fill();
    x.save();r(7,9,w-14,h-18,9);x.clip();x.fillStyle='rgba(17,17,17,.18)';x.fillRect(0,h-16,w,10);x.fillStyle='rgba(255,255,255,.22)';x.fillRect(0,9,w,7);x.restore();
    x.fillStyle=col==='#f7d117'?'#111111':'#ffffff';x.fillText(ch,cx,cy);
    return cv;
  }
  /* the white rim is the sticker's own backing, so a letter stays readable on any picture */
  x.strokeStyle='#ffffff';x.lineWidth=13;x.strokeText(ch,cx,cy);
  x.strokeStyle=shade(col,.55);x.lineWidth=style==='bubble'?6:4;x.strokeText(ch,cx,cy);
  x.fillStyle=col;x.fillText(ch,cx,cy);
  /* everything after this only lands on the coloured letter itself */
  const t=document.createElement('canvas');t.width=cv.width;t.height=cv.height;const y=t.getContext('2d');y.scale(k,k);y.font=F;y.textAlign='center';y.textBaseline='middle';y.fillStyle='#000';y.fillText(ch,cx,cy);
  y.globalCompositeOperation='source-in';
  if(style==='glitter'){
    y.fillStyle=col;y.fillRect(0,0,w,h);y.globalCompositeOperation='source-atop';
    const P=['#ffffff','#fff6c2',shade(col,1.35),shade(col,.6),'#ffd6f0','#c9fff6'];
    for(let i=0;i<w*9;i++){y.globalAlpha=.35+Math.random()*.65;y.fillStyle=P[Math.floor(Math.random()*P.length)];const s=.8+Math.random()*2.2;y.fillRect(Math.random()*w,Math.random()*h,s,s);}
    y.globalAlpha=.9;y.fillStyle='#ffffff';for(let i=0;i<3;i++){const sx=8+Math.random()*(w-16),sy=14+Math.random()*(h-28);y.fillRect(sx-4,sy-.7,8,1.4);y.fillRect(sx-.7,sy-4,1.4,8);}
  }else{
    const g=y.createLinearGradient(0,10,0,h-8);g.addColorStop(0,shade(col,1.25));g.addColorStop(.6,col);g.addColorStop(1,shade(col,.75));
    y.fillStyle=g;y.fillRect(0,0,w,h);y.globalCompositeOperation='source-atop';
    y.fillStyle='rgba(255,255,255,.6)';y.beginPath();y.ellipse(cx-w*.12,h*.3,w*.22,6,-.35,0,7);y.fill();
  }
  x.setTransform(1,0,0,1,0,0);x.drawImage(t,0,0);
  return cv;
}
const SHEETS={};
let sheetOf='glitter',lifted=null;
function drawSheet(){
  if(!SHEETS[sheetOf])SHEETS[sheetOf]=[...SUPPLY].map((ch,n)=>{const cv=stickerArt(sheetOf,ch,n);return {ch:ch,cv:cv,url:cv.toDataURL(),used:false};});
  const box=$('stickers');box.textContent='';
  SHEETS[sheetOf].forEach(st=>{
    const b=document.createElement('button');b.type='button';b.disabled=st.used;
    b.setAttribute('aria-label',st.used?st.ch+', already used':st.ch);b.setAttribute('aria-pressed',String(lifted===st));
    const im=document.createElement('img');im.src=st.url;im.alt='';b.appendChild(im);
    /* peel it off the sheet and carry it: it sticks where it is let go on the card, and goes back to its place anywhere else */
    b.addEventListener('pointerdown',e=>{
      if(st.used)return;audio();e.preventDefault();noise(.04,'highpass',3000,.12);
      const w=st.cv._w,h=st.cv._h,fly=document.createElement('img');fly.src=st.url;fly.alt='';fly.className='stfly';fly.style.width=w+'px';fly.style.height=h+'px';layer.appendChild(fly);im.style.visibility='hidden';
      const at=ev=>{const a=app.getBoundingClientRect();fly.style.left=(ev.clientX-a.left-w/2)+'px';fly.style.top=(ev.clientY-a.top-h/2)+'px';};at(e);
      const up=ev=>{
        document.removeEventListener('pointermove',at);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);fly.remove();
        const c=card.getBoundingClientRect();
        if(ev.type==='pointerup'&&ev.clientX>c.left&&ev.clientX<c.right&&ev.clientY>c.top&&ev.clientY<c.bottom){lifted=st;stickLetter(ev);}
        else{im.style.visibility='';snd.tick();}
      };
      document.addEventListener('pointermove',at);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
    });
    box.appendChild(b);
  });
}
document.querySelectorAll('[data-sheet]').forEach(b=>b.addEventListener('click',()=>{audio();sheetOf=b.dataset.sheet;lifted=null;if(holding&&holding.tool==='letter')dropHold();snd.tick();document.querySelectorAll('[data-sheet]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawSheet();}));
/* the stickers are drawn with the page's fonts, so wait for those before drawing any */
(document.fonts?Promise.all([document.fonts.load('46px Bungee'),document.fonts.load('700 50px Fredoka')]).catch(()=>{}):Promise.resolve()).then(drawSheet);
function stickLetter(e){
  if(!lifted||lifted.used){snd.tick();return;}
  const cv=lifted.cv,w=cv._w,h=cv._h,a=app.getBoundingClientRect(),el=addPiece(cv,w,h,e.clientX-a.left-w/2,e.clientY-a.top-h/2);
  el.dataset.peel='1';el.dataset.glued='1';el.dataset.face=face;el.dataset.dry='1';el.classList.add('dry');
  lifted.used=true;tell('The letter '+lifted.ch+', stuck down.');lifted=null;drawSheet();snd.glue();$('cardhint').hidden=true;
}
/* ---------- sticky tape: pull a strip across the card; it sticks at once and becomes a piece like any other ---------- */
const ROLLS={clear:'rgba(244,236,205,.55)',yellow:'rgba(247,209,23,.8)',red:'rgba(210,31,27,.8)',blue:'rgba(31,63,148,.8)',stripes:'rgba(251,250,245,.9)',dots:'rgba(247,209,23,.9)',grid:'rgba(251,250,245,.92)'},TAPE_W=34;
/* the printed rolls: drawn over the tape's own colour, x runs along the strip */
const PRINTS={
  stripes(x,L,H){x.strokeStyle='rgba(210,31,27,.9)';x.lineWidth=6;for(let i=-H;i<L+H;i+=16){x.beginPath();x.moveTo(i,H+2);x.lineTo(i+H,-2);x.stroke();}},
  dots(x,L,H){x.fillStyle='rgba(31,63,148,.92)';for(let i=9,n=0;i<L;i+=13,n++){x.beginPath();x.arc(i,n%2?H*.3:H*.7,4,0,7);x.fill();}},
  grid(x,L,H){const C=['#d21f1b','#1f3f94','#f7d117'];let i=6,n=0;x.fillStyle='#111111';x.fillRect(0,H*.55,L,3);
    while(i<L){const w=14+((n*37)%23);if(n%3!==1){x.fillStyle=C[n%3];x.fillRect(i,n%2?H*.55+3:0,w,n%2?H*.45-3:H*.55);}x.fillStyle='#111111';x.fillRect(i+w,0,3,H);i+=w+3;n++;}}
};
/* is this piece under a strip of tape? Walk along the middle of every strip above it and see whether it crosses the piece's paper. */
function pinned(el){
  const zi=+el.style.zIndex||0,w=parseFloat(el.style.width),h=parseFloat(el.style.height);if(!el.dataset.glued||!w||!h)return false;
  const cx=el.offsetLeft+w/2,cy=el.offsetTop+h/2,rot=-angleOf(el)*Math.PI/180,pc=el.getContext('2d');
  return [...layer.querySelectorAll('.piece[data-sticky][data-glued]')].some(t=>{
    if(t===el||t.hidden||(+t.style.zIndex||0)<zi)return false;
    const L=parseFloat(t.style.width),tx=t.offsetLeft+L/2,ty=t.offsetTop+parseFloat(t.style.height)/2,a=angleOf(t)*Math.PI/180;
    for(let d=-L/2+4;d<=L/2-4;d+=6){
      const px=tx+Math.cos(a)*d-cx,py=ty+Math.sin(a)*d-cy,lx=px*Math.cos(rot)-py*Math.sin(rot)+w/2,ly=px*Math.sin(rot)+py*Math.cos(rot)+h/2;
      if(lx<0||ly<0||lx>=w||ly>=h)continue;
      try{if(pc.getImageData(Math.floor(lx*el.width/w),Math.floor(ly*el.height/h),1,1).data[3]>40)return true;}catch(_){return true;}
    }
    return false;
  });
}
/* peeling tape takes a little of the paper's surface with it: pale ragged patches where the strip was, on whatever paper was on top there */
function tear(el,x,y,deg){
  const L=parseFloat(el.style.width),H=parseFloat(el.style.height),c=card.getBoundingClientRect(),a=app.getBoundingClientRect(),k=MW/c.width;
  wt.save();wt.setTransform(1,0,0,1,0,0);wt.clearRect(0,0,MW,MH);
  wt.scale(k,k);wt.translate(x+L/2-(c.left-a.left),y+H/2-(c.top-a.top));wt.rotate((deg||0)*Math.PI/180);
  const n=Math.max(1,Math.round(L/70));
  for(let i=0;i<n;i++){
    const px=-L/2+L*(i+.2+Math.random()*.6)/n,pw=10+Math.random()*Math.min(34,L/n),ph=H*(.35+Math.random()*.4),py=(Math.random()-.5)*(H-ph);
    wt.beginPath();
    for(let j=0;j<10;j++){const t=j/10*Math.PI*2,r=.7+Math.random()*.5;wt[j?'lineTo':'moveTo'](px+Math.cos(t)*pw/2*r,py+Math.sin(t)*ph/2*r);}
    wt.closePath();wt.fillStyle='#e9e2cf';wt.fill();wt.strokeStyle='rgba(17,17,17,.14)';wt.lineWidth=1;wt.stroke();
  }
  wt.restore();
  const was=el.hidden;el.hidden=true;settle(1);el.hidden=was;
}
let roll='clear',pull=null;
kit($('rolls'),Object.keys(ROLLS).map(k=>{
  const c=document.createElement('canvas');c.width=176;c.height=120;c.style.width='88px';c.style.height='60px';const x=c.getContext('2d');x.scale(2,2);
  const paint=(w,h)=>{x.fillStyle='#f4efe2';x.fillRect(0,0,w,h);x.fillStyle=ROLLS[k];x.fillRect(0,0,w,h);if(PRINTS[k])PRINTS[k](x,w,h);};
  /* the loose end, then the roll itself: a ring of the same tape around a cardboard core */
  x.save();x.beginPath();x.moveTo(30,42);x.lineTo(82,42);x.lineTo(86,46);x.lineTo(82,50);x.lineTo(86,54);x.lineTo(82,58);x.lineTo(30,58);x.closePath();x.clip();x.translate(30,42);paint(60,16);x.restore();
  x.strokeStyle='#111';x.lineWidth=1.5;x.strokeRect(30,42,53,16);
  x.save();x.beginPath();x.arc(30,30,28,0,7);x.arc(30,30,12,0,7,true);x.clip('evenodd');x.translate(0,0);paint(60,60);x.restore();
  x.beginPath();x.arc(30,30,28,0,7);x.stroke();x.beginPath();x.arc(30,30,12,0,7);x.fillStyle='#b98d55';x.fill();x.stroke();x.beginPath();x.arc(30,30,7,0,7);x.fillStyle='#e4dccb';x.fill();x.stroke();
  return {name:k+' tape',art:c,data:{roll:k},tool:'tape',kind:'tape'};
}),it=>{roll=it.data.roll;},'tape');
function pulling(e){
  const cr=card.getBoundingClientRect(),cx=Math.max(cr.left+2,Math.min(cr.right-2,e.clientX)),cy=Math.max(cr.top+2,Math.min(cr.bottom-2,e.clientY));
  pull.x1=cx;pull.y1=cy;const p=mpos({clientX:cx,clientY:cy});
  wt.clearRect(0,0,MW,MH);wt.lineCap='butt';wt.lineWidth=TAPE_W*ku;wt.strokeStyle=ROLLS[roll];
  wt.beginPath();wt.moveTo(pull.p[0],pull.p[1]);wt.lineTo(p[0],p[1]);wt.stroke();
  const d=Math.hypot(pull.x1-pull.x0,pull.y1-pull.y0);if(d-pull.said>40){pull.said=d;noise(.05,'highpass',2500,.12);}
}
function stick(){
  const t=pull;pull=null;wt.clearRect(0,0,MW,MH);
  const L=Math.hypot(t.x1-t.x0,t.y1-t.y0);if(L<24)return;
  const a=app.getBoundingClientRect(),cv=document.createElement('canvas'),k=2,H=TAPE_W;
  cv.width=Math.round(L*k);cv.height=H*k;const x=cv.getContext('2d');x.scale(k,k);
  /* both ends are torn off the roll, so they are jagged */
  x.beginPath();x.moveTo(3,0);x.lineTo(L-3,0);
  for(let i=1;i<=6;i++)x.lineTo(L-(i%2?0:5)-Math.random()*2,H*i/6);
  x.lineTo(3,H);
  for(let i=5;i>=0;i--)x.lineTo((i%2?0:5)+Math.random()*2,H*i/6);
  x.closePath();x.fillStyle=ROLLS[roll];x.fill();
  x.globalCompositeOperation='source-atop';if(PRINTS[roll])PRINTS[roll](x,L,H);
  /* a roll left lying around gathers fluff, and it comes off with the tape */
  if(holding&&holding.kind==='tape'){const f=Math.min(1,age(holding)/SPOIL.tape);x.strokeStyle='rgba(60,50,40,.6)';x.lineWidth=.8;
    for(let i=0,n=Math.round(f*L/9);i<n;i++){const fx=Math.random()*L,fy=Math.random()*H;x.beginPath();x.moveTo(fx,fy);x.quadraticCurveTo(fx+Math.random()*8-4,fy+Math.random()*8-4,fx+Math.random()*10-5,fy+Math.random()*10-5);x.stroke();}}x.fillStyle='rgba(255,255,255,.22)';x.fillRect(0,3,L,3);x.fillStyle='rgba(17,17,17,.08)';x.fillRect(0,H-4,L,4);
  const el=addPiece(cv,L,H,(t.x0+t.x1)/2-a.left-L/2,(t.y0+t.y1)/2-a.top-H/2);
  el.style.setProperty('--r',(Math.atan2(t.y1-t.y0,t.x1-t.x0)*180/Math.PI).toFixed(1)+'deg');
  el.dataset.sticky='1';el.dataset.glued='1';el.dataset.face=face;el.dataset.dry='1';el.classList.add('dry');
  snd.glue();tell('A strip of tape, stuck down.');
}
marks.addEventListener('pointerdown',e=>{
  audio();
  /* a tool lying on the card is a thing you can take hold of and carry away, the one in your hand included */
  const lying=[...layer.querySelectorAll('.loose')].sort((p,q)=>(+q.style.zIndex||0)-(+p.style.zIndex||0)).find(el=>{const r=el.getBoundingClientRect(),m=holding&&holding.el===el?12:0;return e.clientX>r.left+m&&e.clientX<r.right-m&&e.clientY>r.top+m&&e.clientY<r.bottom-m;});
  if(lying){e.preventDefault();carryTool(lying,e,false);return;}
  try{marks.setPointerCapture(e.pointerId);}catch(_){}
  follow(e);
  if(tool==='letter'){stickLetter(e);$('cardhint').hidden=true;e.preventDefault();return;}
  if(tool==='stamp'){ku=MW/marks.getBoundingClientRect().width;press1(mpos(e));$('cardhint').hidden=true;e.preventDefault();return;}
  if(tool==='tape'){ku=MW/marks.getBoundingClientRect().width;pull={p:mpos(e),x0:e.clientX,y0:e.clientY,x1:e.clientX,y1:e.clientY,said:0};$('cardhint').hidden=true;e.preventDefault();return;}
  ku=MW/marks.getBoundingClientRect().width;mp=mpos(e);mtrav=0;seg(mp,mp);$('cardhint').hidden=true;e.preventDefault();
});
marks.addEventListener('pointermove',e=>{
  if(pull){pulling(e);follow(e);return;}
  if(mp)follow(e);
  if(!mp)return;const p=mpos(e),d=Math.hypot(p[0]-mp[0],p[1]-mp[1]);if(d<3)return;
  seg(mp,p);mp=p;mtrav+=d;if(mtrav>70){mtrav=0;snd.mark();}
});
/* When the pen lifts, the stroke sinks into the topmost paper under each part of it: pieces first (top to bottom), the card last. */
function settle(force){
  const alpha=force||(tool==='white'?.85:1);
  const c=card.getBoundingClientRect(),a=app.getBoundingClientRect(),cl=c.left-a.left,ct=c.top-a.top,kx=c.width/MW,ky=c.height/MH;
  const pieces=[...layer.querySelectorAll('.piece')].filter(p=>{
    if(p.hidden)return false;const r=p.getBoundingClientRect();return r.right>c.left&&r.left<c.right&&r.bottom>c.top&&r.top<c.bottom;
  }).sort((p,q)=>(+q.style.zIndex||0)-(+p.style.zIndex||0));
  pieces.forEach(p=>{
    const w=parseFloat(p.style.width),h=parseFloat(p.style.height);if(!w||!h)return;
    const cx=p.offsetLeft+w/2,cy=p.offsetTop+h/2,rot=(parseFloat(p.style.getPropertyValue('--r'))||0)*Math.PI/180;
    const pc=p.getContext('2d');
    pc.save();pc.setTransform(1,0,0,1,0,0);
    pc.scale(p.width/w,p.height/h);pc.translate(w/2,h/2);pc.rotate(-rot);pc.translate(-cx,-cy);pc.translate(cl,ct);pc.scale(kx,ky);
    pc.globalCompositeOperation='source-atop';pc.globalAlpha=alpha;pc.drawImage(wet,0,0);pc.restore();
    wt.save();wt.setTransform(1,0,0,1,0,0);
    wt.scale(1/kx,1/ky);wt.translate(-cl,-ct);wt.translate(cx,cy);wt.rotate(rot);wt.translate(-w/2,-h/2);wt.scale(w/p.width,h/p.height);
    wt.globalCompositeOperation='destination-out';wt.drawImage(p,0,0);wt.restore();
  });
  mk.save();mk.globalAlpha=alpha;mk.drawImage(wet,0,0);mk.restore();
  wt.clearRect(0,0,MW,MH);
}
const mend=()=>{if(pull){stick();return;}if(!mp)return;mp=null;settle();};
marks.addEventListener('pointerup',mend);marks.addEventListener('pointercancel',mend);

function toTrash(el){if(el===taped)showTape(null);
  if(picked===el)pick(null);
  unglue(el);el.remove();stack.push(el);count.textContent=String(stack.length);
  snd.trash();bin.classList.remove('shake');void bin.offsetWidth;bin.classList.add('shake');
  tell('In the trash. Double-click the trash to take the last thing back out.');
}
function popTrash(){
  if(!stack.length){snd.tick();tell('The trash is empty.');return;}
  if(stack[stack.length-1].sheet){const t=stack.pop();delete BOXES[t.box].gone[t.i];count.textContent=String(stack.length);snd.pop();show(t.box,t.i);return;}
  if(stack[stack.length-1]._item){const el=stack.pop(),b=bin.getBoundingClientRect(),a=app.getBoundingClientRect();const t=$('table').getBoundingClientRect();el.style.left=(t.left-a.left+40+Math.random()*Math.max(20,t.width-160))+'px';el.style.top=(t.top-a.top+80+Math.random()*Math.max(20,t.height-220))+'px';el.style.zIndex=String(100000+ ++z);layer.appendChild(el);el._item.leakAt=Date.now();count.textContent=String(stack.length);snd.pop();tell('Taken out of the trash.');return;}
  const el=stack.pop(),b=bin.getBoundingClientRect(),a=app.getBoundingClientRect(),w=parseFloat(el.style.width)||40;
  const x=Math.max(0,b.left-a.left-w*0.6-Math.random()*40),y=Math.max(0,b.top-a.top-20+Math.random()*50);
  addPiece(el,parseFloat(el.style.width),parseFloat(el.style.height),x,y);
  count.textContent=String(stack.length);snd.pop();
  tell(stack.length?'Taken out. '+stack.length+' still in the trash. Click again for the one before it.':'Taken out. The trash is empty now.');
}
bin.addEventListener('click',e=>{
  audio();const now=performance.now();
  if(restore||e.detail===0){restore=true;popTrash();}
  else if(now-lastClick<400){restore=true;lastClick=0;popTrash();return;}
  else tell('Double-click the trash to take the last thing out.');
  lastClick=now;
});
document.addEventListener('pointerdown',e=>{if(!bin.contains(e.target))restore=false;});


const BASES={front:baseF,open:baseO,env:baseE};
const faceBtns=document.querySelectorAll('[data-face]');
function setFace(f){
  pick(null);face=f;
  card.classList.toggle('open',f==='open');card.classList.toggle('env',f==='env');
  MW=f==='front'?600:1200;wet.width=MW;marks.width=MW;
  Object.keys(BASES).forEach(k=>{BASES[k].hidden=k!==f;});mk=BASES[f].getContext('2d');
  layer.querySelectorAll('.piece,.goo').forEach(p=>{if(p.dataset.face)p.hidden=p.dataset.face!==f;});
  faceBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.face===f)));
  $('envbar').hidden=f!=='env';
  place();noise(.12,'bandpass',700,.25);
  tell(f==='open'?'The card is open.':f==='env'?'The envelope.':'The front of the card.');
}
faceBtns.forEach(b=>b.addEventListener('click',()=>{audio();setFace(b.dataset.face);}));
$('seal').addEventListener('click',()=>{audio();setFace('env');});

/* ---------- recorded sound: hold to record, tap to hear it ---------- */
let mic=null,opening=null;
const REC_TYPE=window.MediaRecorder?(['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m))||''):'';
/* the one place this app talks on screen: recording fails silently otherwise, so the microphone's state is always shown */
function micSay(text,bad){tell(text);const m=$('micstate');m.textContent=text;m.classList.toggle('bad',!!bad);}
function micOn(){
  if(mic){micSay('Microphone ready. Hold a piece to record.');return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){micSay('This browser cannot record sound.',true);return;}
  micSay('Asking for the microphone...');
  navigator.mediaDevices.getUserMedia({audio:true}).then(s=>{
    if(tool==='sound'){mic=s;micSay('Microphone ready. Hold a piece to record.');}else s.getTracks().forEach(t=>t.stop());
  },err=>{
    const none=err&&(err.name==='NotFoundError'||err.name==='OverconstrainedError');
    micSay(none?'No microphone was found on this device.':'The microphone is blocked. Allow it for this site in your browser, then pick Sound again.',true);
  });
}
function micOff(){if(mic){mic.getTracks().forEach(t=>t.stop());mic=null;}}
function startRec(maxMs,done){
  if(!mic)return null;
  const chunks=[];let r;
  try{r=new MediaRecorder(mic,REC_TYPE?{mimeType:REC_TYPE}:undefined);}catch(e){return null;}
  const stopAt=setTimeout(()=>{if(r.state==='recording')r.stop();},maxMs);
  r.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  r.onstop=()=>{
    clearTimeout(stopAt);app.classList.remove('recording');
    const blob=new Blob(chunks,{type:r.mimeType||REC_TYPE||'audio/webm'});
    if(blob.size<200){done(null);return;}
    const fr=new FileReader();fr.onload=()=>done(fr.result);fr.onerror=()=>done(null);fr.readAsDataURL(blob);
  };
  try{r.start();}catch(e){clearTimeout(stopAt);return null;}
  app.classList.add('recording');
  return r;
}
let heard=null;
function hear(url,tape){CardViewer.play(url,tape);}
/* the tape controls work on whichever sound was touched last */
let taped=null;
function showTape(el){
  if(taped)taped.classList.remove('taped');
  taped=el&&(el===$('openrec')?opening:el._snd)?el:null;
  $('tape').hidden=!taped;if(!taped)return;
  taped.classList.add('taped');
  const t=taped._tape||{};
  document.querySelectorAll('#tape [data-rate]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.rate===(t.rate||1))));
  $('back').setAttribute('aria-pressed',String(!!t.back));
  
}
function setTape(change){
  if(!taped)return;
  const t=Object.assign({rate:1,back:false,a:0,b:1},taped._tape||{},change);
  taped._tape=t;showTape(taped);snd.tick();
  hear(taped===$('openrec')?opening:taped._snd,t);
}
document.querySelectorAll('#tape [data-rate]').forEach(b=>b.addEventListener('click',()=>{audio();setTape({rate:+b.dataset.rate});}));
$('back').addEventListener('click',()=>{audio();setTape({back:!(taped&&taped._tape&&taped._tape.back)});});

/* one press does both jobs: a quick tap plays what is there, holding records over it */
function press(el,e,maxMs,get,set){
  e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}
  let r=null,over=false,began=0;
  const had=!!get();
  if(!mic)micOn();
  /* something that already has a sound needs a clearly longer hold, so a slow tap plays it instead of wiping it */
  const wait=setTimeout(()=>{
    if(over)return;
    began=Date.now();
    r=startRec(maxMs,url=>{
      el.classList.remove('rec');
      if(url&&had&&Date.now()-began<700){micSay('Too short to replace the sound. The old one is kept.');hear(get(),el._tape);}
      else if(url){set(url);el._tape=null;showTape(el);snd.pop();micSay('Recorded. Tap it to hear it, hold to record again.');}
      else micSay('Nothing was recorded. Hold a little longer.',true);
    });
    if(r){el.classList.add('rec');micSay('Recording... let go to stop.');}
    else if(mic)micSay('This browser could not start recording.',true);
  },had?500:200);
  const up=()=>{
    over=true;clearTimeout(wait);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
    if(r){if(r.state==='recording')r.stop();}
    else{const u=get();if(u){showTape(el);hear(u,el._tape);}else if(mic){snd.tick();micSay('Keep holding to record.');}}
  };
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}
$('openrec').addEventListener('pointerdown',e=>{audio();press($('openrec'),e,10000,()=>opening,u=>{opening=u;$('openrec').classList.add('loud');});});
/* a long press must not open the browser's own menu while recording */
document.addEventListener('contextmenu',e=>{if(tool==='sound')e.preventDefault();});

/* ---------- the envelope: try opening it, then seal it ---------- */
let envColor='#f6f1e3';
const envBtns=document.querySelectorAll('[data-env]');
envBtns.forEach(b=>b.addEventListener('click',()=>{
  audio();envColor=b.dataset.env;card.style.setProperty('--env',envColor);$('seal').style.background=envColor;
  envBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  noise(.12,'bandpass',700,.25);tell(b.getAttribute('aria-label')+'.');
}));
function render(f,quietOnly){
  const cw=f==='front'?600:1200,cv=document.createElement('canvas');cv.width=cw;cv.height=MH;
  const c=cv.getContext('2d');
  c.fillStyle=f==='env'?envColor:'#ffffff';c.fillRect(0,0,cw,MH);
  if(f==='env'){c.strokeStyle='#111111';c.lineWidth=6;c.beginPath();c.moveTo(0,0);c.lineTo(cw/2,MH*0.55);c.lineTo(cw,0);c.stroke();}
  if(f==='open'){c.setLineDash([14,12]);c.strokeStyle='rgba(17,17,17,.45)';c.lineWidth=4;c.beginPath();c.moveTo(cw/2,0);c.lineTo(cw/2,MH);c.stroke();c.setLineDash([]);}
  c.drawImage(BASES[f],0,0);
  const o=origin[f];
  if(o){
    const k=cw/o.w;
    [...layer.querySelectorAll('.piece,.goo')].filter(p=>p.dataset.face===f&&!(quietOnly&&(p._snd||spins(p)))).sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0)).forEach(p=>{
      const w=parseFloat(p.style.width),h=parseFloat(p.style.height),x=parseFloat(p.style.left)-o.x,y=parseFloat(p.style.top)-o.y;
      c.save();c.scale(k,k);c.translate(x+w/2,y+h/2);
      if(p.classList.contains('goo')){c.fillStyle=p.style.background;c.beginPath();c.ellipse(0,0,w/2,h/2,0,0,7);c.fill();}
      else{c.rotate((parseFloat(p.style.getPropertyValue('--r'))||0)*Math.PI/180);c.drawImage(p,-w/2,-h/2,w,h);}
      c.restore();
    });
  }
  c.strokeStyle='#111111';c.lineWidth=8;c.strokeRect(4,4,cw-8,MH-8);
  return cv;
}
const mail=$('mail'),mailcv=$('mailcv'),mailstage=$('mailstage');
let shots=null,flat=null,extras=null,viewer=null,sealed=false;
function loudPieces(){
  const out=[];
  [...layer.querySelectorAll('.piece')].filter(p=>(p._snd||spins(p))&&p.dataset.face&&origin[p.dataset.face]).sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0)).forEach(p=>{
    const o=origin[p.dataset.face],w=parseFloat(p.style.width),h=parseFloat(p.style.height);
    out.push({face:p.dataset.face,x:(parseFloat(p.style.left)-o.x)/o.w,y:(parseFloat(p.style.top)-o.y)/o.h,w:w/o.w,h:h/o.h,r:parseFloat(p.style.getPropertyValue('--r'))||0,img:p.toDataURL('image/png'),audio:p._snd||null,t:p._tape||null,pin:spins(p)?{x:p._pin.x,y:p._pin.y}:null});
  });
  return out;
}
$('tryit').addEventListener('click',()=>{
  audio();micOff();
  const pic=c=>c.toDataURL('image/jpeg',0.85),all=['env','front','open'];
  shots={};flat={};all.forEach(f=>{shots[f]=render(f,false);flat[f]=pic(render(f,true));});
  extras={sounds:loudPieces(),opening:opening,openingTape:$('openrec')._tape||null};sealed=false;
  $('mailback').hidden=false;$('mailseal').hidden=false;$('maillink').hidden=true;
  mailcv.hidden=true;mailstage.hidden=false;mail.hidden=false;
  viewer=CardViewer.mount(mailstage,{faces:flat,sounds:extras.sounds,opening:extras.opening,openingTape:extras.openingTape},tell);
  noise(.12,'bandpass',700,.25);tell('The envelope, as they will get it. Tap it to open.');
});
$('mailback').addEventListener('click',()=>{audio();if(viewer)viewer.stop();mail.hidden=true;tell('Back at the table.');});
/* the card slides into the envelope and the flap folds shut */
function closeUp(done){
  const CW=1200,CH=840,c=mailcv.getContext('2d');mailcv.width=CW;mailcv.height=CH;mailcv.classList.remove('tall');
  const bx=240,by=300,bw=720,bh=504,env=shots.env,fr=shots.front,cw=300,ch=420,cx=bx+(bw-cw)/2;
  const still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,dur=still?1:1900,t0=performance.now();
  const ease=x=>x*x*(3-2*x);
  function flap(s){
    c.strokeStyle='#111111';c.lineWidth=4;
    c.beginPath();c.moveTo(bx,by);c.lineTo(bx+bw/2,by-bh*0.55*s);c.lineTo(bx+bw,by);c.closePath();
    c.fillStyle=envColor;c.fill();c.fillStyle='rgba(255,255,255,.18)';c.fill();c.stroke();
  }
  function frame(now){
    const t=Math.min(1,(now-t0)/dur),a=Math.min(1,t/0.55),b=Math.max(0,(t-0.6)/0.4),s=1-2*ease(b);
    c.fillStyle='#111111';c.fillRect(0,0,CW,CH);
    c.fillStyle=envColor;c.fillRect(bx,by,bw,bh);c.fillStyle='rgba(17,17,17,.14)';c.fillRect(bx,by,bw,bh);
    if(s>0)flap(s);
    c.drawImage(fr,cx,-ch-20+(by+50+ch+20)*ease(a),cw,ch);
    c.save();c.beginPath();c.moveTo(bx,by);c.lineTo(bx+bw/2,by+bh*0.55);c.lineTo(bx+bw,by);c.lineTo(bx+bw,by+bh);c.lineTo(bx,by+bh);c.closePath();c.clip();
    c.drawImage(env,bx,by,bw,bh);c.restore();
    if(s<=-0.999)c.drawImage(env,bx,by,bw,bh);else if(s<=0)flap(s);
    c.strokeStyle='#111111';c.lineWidth=5;c.strokeRect(bx,by,bw,bh);
    if(t<1)requestAnimationFrame(frame);else done();
  }
  requestAnimationFrame(frame);
}
/* closing the envelope saves the card on the server and gives back its link */
function saveCard(){
  return fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({env:flat.env,front:flat.front,open:flat.open,extras:extras})})
    .then(r=>r.ok?r.json():Promise.reject(new Error('save failed')));
}
function showSaved(r){
  $('maillink').hidden=false;
  if(r&&r.id){
    $('linktext').textContent=location.origin+'/card/'+r.id;
    $('copy').hidden=false;$('share').hidden=!navigator.share;$('retry').hidden=true;
    $('keep').textContent='THIS CARD LASTS UNTIL '+CardViewer.day(r.until||Date.now()+14*86400000).toUpperCase()+'. KEEP IT';$('keep').hidden=false;
    tell('The envelope is closed. Its link is ready to share.');
  }else{
    $('linktext').textContent='The card could not be saved. Check your connection.';
    $('copy').hidden=true;$('share').hidden=true;$('keep').hidden=true;$('retry').hidden=false;
    tell('The card could not be saved.');
  }
}
$('mailseal').addEventListener('click',()=>{
  audio();sealed=true;$('mailback').hidden=true;$('mailseal').hidden=true;
  if(viewer)viewer.stop();mailstage.hidden=true;mailcv.hidden=false;
  noise(.5,'bandpass',600,.3);
  const saved=saveCard().catch(()=>null);
  closeUp(()=>{snd.glue();saved.then(showSaved);});
});
$('keep').addEventListener('click',()=>{audio();CardViewer.keep({faces:{env:flat.env,front:flat.front,open:flat.open},sounds:extras.sounds,opening:extras.opening,openingTape:extras.openingTape}).then(()=>tell('The card was saved as a file.'),()=>tell('The card could not be saved as a file.'));});
$('retry').addEventListener('click',()=>{audio();$('linktext').textContent='Saving...';$('retry').hidden=true;saveCard().catch(()=>null).then(showSaved);});
$('share').addEventListener('click',()=>{if(navigator.share)navigator.share({url:$('linktext').textContent}).catch(()=>{});});
$('copy').addEventListener('click',()=>{
  const t=$('linktext').textContent,ok=()=>{$('copy').textContent='COPIED';setTimeout(()=>{$('copy').textContent='COPY LINK';},1500);};
  const pick=()=>{const r=document.createRange();r.selectNodeContents($('linktext'));const s=getSelection();s.removeAllRanges();s.addRange(r);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,pick);else pick();
});
function wipe(faces){
  pick(null);
  layer.querySelectorAll('.piece,.goo').forEach(p=>{if(faces.includes(p.dataset.face)){clearTimeout(p._t);p.remove();}});
  faces.forEach(f=>{const b=BASES[f];b.getContext('2d').clearRect(0,0,b.width,b.height);});
  wt.clearRect(0,0,MW,MH);
}
$('again').addEventListener('click',()=>{audio();wipe(['front','open','env']);quiet();mail.hidden=true;setFace('front');tell('A new card. Your table is as you left it.');});
function quiet(){opening=null;$('openrec')._tape=null;$('openrec').classList.remove('loud');showTape(null);}
$('newcard').addEventListener('click',()=>{audio();wipe(['front','open']);quiet();snd.rip();tell('A new, empty card.');});

Object.keys(KITS).forEach(k=>{if(KITS[k])$(KITS[k]).hidden=true;});$('penopts').hidden=true;
dock();
})();
