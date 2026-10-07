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
  sheetEl.style.transform='';sheetEl.hidden=false;$('cutbar').hidden=false;app.classList.remove('nosheet');place();
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
function clearTable(){stash();cur=null;sheetEl.hidden=true;sheetEl.style.transform='';$('cutbar').hidden=true;app.classList.add('nosheet');place();}
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
const colorBtns=document.querySelectorAll('[data-color]');
colorBtns.forEach(b=>b.addEventListener('click',()=>{audio();penColor=b.dataset.color;colorBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('penbtn').className=b.className;tell(b.textContent.trim()+' pen.');}));
const tipBtns=document.querySelectorAll('[data-size]');
tipBtns.forEach(b=>b.addEventListener('click',()=>{audio();tip=parseFloat(b.dataset.size);tipBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));tell(b.textContent.trim()+' picked.');}));
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
  let held=false,ox=0,oy=0,sx=0,sy=0,sz='6',wasGlued=false,wasDry=false;
  el.addEventListener('pointerdown',e=>{
    audio();
    if(tool==='sound'){press(el,e,5000,()=>el._snd,u=>{el._snd=u;el.classList.add('loud');});return;}
    pick(el);
    sx=el.offsetLeft;sy=el.offsetTop;sz=el.style.zIndex;wasGlued=!!el.dataset.glued;wasDry=!!el.dataset.dry;
    held=true;try{el.setPointerCapture(e.pointerId);}catch(_){}
    ox=e.clientX-el.offsetLeft;oy=e.clientY-el.offsetTop;
    el.classList.add('held');el.style.zIndex=String(++z);e.preventDefault();
  });
  el.addEventListener('pointermove',e=>{if(!held)return;el.style.left=(e.clientX-ox)+'px';el.style.top=(e.clientY-oy)+'px';if(picked===el)placeTurn();});
  const up=()=>{
    if(!held)return;held=false;el.classList.remove('held');
    const moved=Math.hypot(el.offsetLeft-sx,el.offsetTop-sy)>12,left=wasGlued&&moved;
    if(!moved&&el._snd)hear(el._snd);
    if(left){residue(sx,sy,el,wasDry,sz);unglue(el);if(wasDry)snd.rip();}
    if(inside(el,bin,10)){toTrash(el);return;}
    if(inside(el,card,0)){
      if(!el.dataset.glued){
        el.dataset.glued='1';el.dataset.face=face;el.classList.add('wet');snd.glue();$('cardhint').hidden=true;
        tell(left?'Moved. Some glue stayed where it was.':'Glued. The glue dries in 8 seconds.');
        el._t=setTimeout(()=>{el.dataset.dry='1';el.classList.remove('wet');el.classList.add('dry');},DRY);
      }
    }else if(left){tell(wasDry?'Ripped off. A patch of dried glue stayed on the card.':'Peeled off. A smear of glue stayed on the card.');}
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
function turned(el,wasGlued,wasDry){
  if(!wasGlued)return;
  residue(el.offsetLeft,el.offsetTop,el,wasDry,el.style.zIndex);unglue(el);if(wasDry)snd.rip();
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
  const up=()=>{if(!held)return;held=false;if(picked&&Math.abs(angleOf(picked)-r0)>1)turned(picked,glued,dry);};
  turn.addEventListener('pointerup',up);turn.addEventListener('pointercancel',up);
  turn.addEventListener('keydown',e=>{
    if(!picked||(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'))return;e.preventDefault();
    const g=!!picked.dataset.glued,d=!!picked.dataset.dry;
    picked.style.setProperty('--r',(angleOf(picked)+(e.key==='ArrowLeft'?-5:5)).toFixed(1)+'deg');placeTurn();snd.tick();turned(picked,g,d);
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
const PENS=['pen','glitter','white'];let penColor='black';
let cutTool='scissors';
let tool='hand',mp=null,mtrav=0;
const toolBtns=document.querySelectorAll('[data-tool]');
toolBtns.forEach(b=>b.addEventListener('click',()=>{
  audio();tool=b.dataset.tool;
  toolBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  marks.classList.toggle('on',PENS.includes(tool));$('penopts').hidden=!PENS.includes(tool);colorBtns.forEach(c=>{c.hidden=tool!=='pen';});place();
  wet.style.opacity=tool==='white'?'.85':'1';
  app.classList.toggle('sounding',tool==='sound');$('sndopts').hidden=tool!=='sound';
  if(tool==='sound')micOn();else micOff();
  tell(b.textContent.trim()+' picked up.');
}));
function mpos(e){const r=marks.getBoundingClientRect();return [(e.clientX-r.left)*MW/r.width,(e.clientY-r.top)*MH/r.height];}
let ku=2,tip=1;
const GL=['#f7d117','#ffffff','#d21f1b','#1f3f94','#ff8ad1','#39c5bb'];
function glit(a,b){
  wt.lineCap='round';wt.lineWidth=9*ku*tip;wt.strokeStyle='rgba(214,170,40,.75)';
  wt.beginPath();wt.moveTo(a[0],a[1]);wt.lineTo(b[0],b[1]);wt.stroke();
  const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3));
  for(let i=0;i<n;i++){
    const t=Math.random(),x=a[0]+(b[0]-a[0])*t+(Math.random()-.5)*8*ku*tip,y=a[1]+(b[1]-a[1])*t+(Math.random()-.5)*8*ku*tip;
    wt.fillStyle=GL[Math.floor(Math.random()*GL.length)];wt.fillRect(x,y,(1+Math.random()*1.5)*ku,(1+Math.random()*1.5)*ku);
  }
}
function seg(a,b){
  if(tool==='glitter'){glit(a,b);return;}
  const w=tool==='white';
  wt.lineCap='round';wt.lineJoin='round';wt.lineWidth=(w?14:4.5)*ku*tip;wt.strokeStyle=w?'#ffffff':COLORS[penColor];
  wt.beginPath();wt.moveTo(a[0],a[1]);wt.lineTo(b[0],b[1]);wt.stroke();
}
marks.addEventListener('pointerdown',e=>{
  audio();try{marks.setPointerCapture(e.pointerId);}catch(_){}
  ku=MW/marks.getBoundingClientRect().width;mp=mpos(e);mtrav=0;seg(mp,mp);$('cardhint').hidden=true;e.preventDefault();
});
marks.addEventListener('pointermove',e=>{
  if(!mp)return;const p=mpos(e),d=Math.hypot(p[0]-mp[0],p[1]-mp[1]);if(d<3)return;
  seg(mp,p);mp=p;mtrav+=d;if(mtrav>70){mtrav=0;snd.mark();}
});
/* When the pen lifts, the stroke sinks into the topmost paper under each part of it: pieces first (top to bottom), the card last. */
function settle(){
  const alpha=tool==='white'?.85:1;
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
const mend=()=>{if(!mp)return;mp=null;settle();};
marks.addEventListener('pointerup',mend);marks.addEventListener('pointercancel',mend);

function toTrash(el){
  if(picked===el)pick(null);
  unglue(el);el.remove();stack.push(el);count.textContent=String(stack.length);
  snd.trash();bin.classList.remove('shake');void bin.offsetWidth;bin.classList.add('shake');
  tell('In the trash. Double-click the trash to take the last thing back out.');
}
function popTrash(){
  if(!stack.length){snd.tick();tell('The trash is empty.');return;}
  if(stack[stack.length-1].sheet){const t=stack.pop();delete BOXES[t.box].gone[t.i];count.textContent=String(stack.length);snd.pop();show(t.box,t.i);return;}
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
function hear(url){try{if(heard)heard.pause();heard=new Audio(url);heard.play().catch(()=>{});}catch(e){}}
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
      if(url&&had&&Date.now()-began<700){micSay('Too short to replace the sound. The old one is kept.');hear(get());}
      else if(url){set(url);snd.pop();micSay('Recorded. Tap it to hear it, hold to record again.');}
      else micSay('Nothing was recorded. Hold a little longer.',true);
    });
    if(r){el.classList.add('rec');micSay('Recording... let go to stop.');}
    else if(mic)micSay('This browser could not start recording.',true);
  },had?500:200);
  const up=()=>{
    over=true;clearTimeout(wait);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
    if(r){if(r.state==='recording')r.stop();}
    else{const u=get();if(u)hear(u);else if(mic){snd.tick();micSay('Keep holding to record.');}}
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
    [...layer.querySelectorAll('.piece,.goo')].filter(p=>p.dataset.face===f&&!(quietOnly&&p._snd)).sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0)).forEach(p=>{
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
  [...layer.querySelectorAll('.piece')].filter(p=>p._snd&&p.dataset.face&&origin[p.dataset.face]).sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0)).forEach(p=>{
    const o=origin[p.dataset.face],w=parseFloat(p.style.width),h=parseFloat(p.style.height);
    out.push({face:p.dataset.face,x:(parseFloat(p.style.left)-o.x)/o.w,y:(parseFloat(p.style.top)-o.y)/o.h,w:w/o.w,h:h/o.h,r:parseFloat(p.style.getPropertyValue('--r'))||0,img:p.toDataURL('image/png'),audio:p._snd});
  });
  return out;
}
$('tryit').addEventListener('click',()=>{
  audio();micOff();
  const pic=c=>c.toDataURL('image/jpeg',0.85),all=['env','front','open'];
  shots={};flat={};all.forEach(f=>{shots[f]=render(f,false);flat[f]=pic(render(f,true));});
  extras={sounds:loudPieces(),opening:opening};sealed=false;
  $('mailback').hidden=false;$('mailseal').hidden=false;$('maillink').hidden=true;
  mailcv.hidden=true;mailstage.hidden=false;mail.hidden=false;
  viewer=CardViewer.mount(mailstage,{faces:flat,sounds:extras.sounds,opening:extras.opening},tell);
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
    tell('The envelope is closed. Its link is ready to share.');
  }else{
    $('linktext').textContent='The card could not be saved. Check your connection.';
    $('copy').hidden=true;$('share').hidden=true;$('retry').hidden=false;
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
$('again').addEventListener('click',()=>{audio();wipe(['front','open','env']);opening=null;$('openrec').classList.remove('loud');mail.hidden=true;setFace('front');tell('A new card. Your table is as you left it.');});
function quiet(){opening=null;$('openrec').classList.remove('loud');}
$('newcard').addEventListener('click',()=>{audio();wipe(['front','open']);quiet();snd.rip();tell('A new, empty card.');});

})();
