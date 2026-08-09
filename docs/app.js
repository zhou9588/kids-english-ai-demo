'use strict';

const bank = [
  ['apple','/ˈæp.əl/','苹果','🍎','Yummy!','An apple is red.','coral','水果乐园',92],
  ['banana','/bəˈnɑː.nə/','香蕉','🍌','Sweet!','I like bananas.','yellow','水果乐园',90],
  ['orange','/ˈɒr.ɪndʒ/','橙子','🍊','Juicy!','The orange is round.','coral','水果乐园',91],
  ['grape','/ɡreɪp/','葡萄','🍇','Pop!','These grapes are purple.','violet','水果乐园',93],
  ['cat','/kæt/','小猫','🐱','Meow!','The cat is cute.','violet','动物朋友',88],
  ['dog','/dɒɡ/','小狗','🐶','Woof!','The dog can run.','yellow','动物朋友',95],
  ['bird','/bɜːd/','小鸟','🐦','Tweet!','A bird can fly.','mint','动物朋友',90],
  ['fish','/fɪʃ/','小鱼','🐟','Splash!','The fish can swim.','mint','动物朋友',92],
  ['red','/red/','红色','🔴','Bright!','My ball is red.','coral','彩虹颜色',94],
  ['blue','/bluː/','蓝色','🔵','Cool!','The sky is blue.','mint','彩虹颜色',91],
  ['green','/ɡriːn/','绿色','🟢','Fresh!','The leaf is green.','mint','彩虹颜色',90],
  ['yellow','/ˈjel.əʊ/','黄色','🟡','Sunny!','The sun is yellow.','yellow','彩虹颜色',93],
  ['mom','/mɒm/','妈妈','👩','Hello!','My mom is kind.','coral','我的家人',94],
  ['dad','/dæd/','爸爸','👨','Hi!','My dad is funny.','mint','我的家人',92],
  ['baby','/ˈbeɪ.bi/','宝宝','👶','Giggle!','The baby is happy.','yellow','我的家人',91],
  ['family','/ˈfæm.əl.i/','家人','👨‍👩‍👧','Together!','I love my family.','violet','我的家人',89],
  ['book','/bʊk/','书','📚','Read!','This is my book.','violet','快乐课堂',93],
  ['pen','/pen/','笔','✏️','Write!','I have a pen.','yellow','快乐课堂',94],
  ['bag','/bæɡ/','书包','🎒','Ready!','My bag is purple.','coral','快乐课堂',91],
  ['school','/skuːl/','学校','🏫','Let’s go!','I go to school.','mint','快乐课堂',90]
].map((item) => ({
  word:item[0], phonetic:item[1], zh:item[2], emoji:item[3], bubble:item[4],
  sentence:item[5], tone:item[6], theme:item[7], score:item[8]
}));

const $ = (id) => document.getElementById(id);
const storeKey = 'sprout-english-v2';
const defaults = { done:{}, writeDone:{}, amount:3, flow:{}, letterProgress:{}, stickers:[] };
let state = { ...defaults };

try {
  const saved = JSON.parse(localStorage.getItem(storeKey) || '{}');
  state = { ...defaults, ...saved };
} catch (_) {
  state = { ...defaults };
}

state.done = state.done || {};
state.writeDone = state.writeDone || {};
state.flow = state.flow || {};
state.letterProgress = state.letterProgress || {};
state.stickers = Array.isArray(state.stickers) ? state.stickers : [];
state.amount = [3,4,5].includes(Number(state.amount)) ? Number(state.amount) : 3;

let current = 0;
let date = localDate(new Date());
let activeStream = null;
let micTimer = null;
let micRun = 0;

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dayNo(d) {
  return Math.floor((new Date(`${d}T12:00:00`) - new Date('2026-01-01T12:00:00')) / 86400000);
}

function save() {
  try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (_) { /* Device storage can be unavailable. */ }
}

function learnedWords() {
  return new Set(Object.values(state.done).filter(Array.isArray).flat());
}

function lesson() {
  const n = Math.max(0, dayNo(date));
  const start = (n * state.amount) % bank.length;
  const items = Array.from({length:state.amount}, (_,i) => bank[(start+i) % bank.length]);
  const learned = learnedWords();

  if (n % 3 === 0 && learned.size && items.length > 2) {
    const review = bank.find((w) => learned.has(w.word) && !items.some((x) => x.word === w.word));
    if (review) items[items.length-1] = { ...review, review:true };
  }
  return items;
}

function wordIsDone(word) {
  return (state.done[date] || []).includes(word);
}

function flowStep(word) {
  const savedStep = state.flow[date]?.[word];
  if (Number.isInteger(savedStep)) return Math.max(0, Math.min(4, savedStep));
  return wordIsDone(word) ? 4 : 0;
}

function setFlowStep(word, step) {
  state.flow[date] = state.flow[date] || {};
  state.flow[date][word] = step;
  save();
}

function currentWord() {
  const items = lesson();
  current = Math.min(current, items.length-1);
  return items[current];
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    $('liveMessage').textContent = '当前浏览器暂不支持语音播放';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.72;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

const guideCopy = [
  ['第 1 关 · 听一听','先听小芽读一遍吧！'],
  ['第 2 关 · 说一说','轮到你勇敢开口啦！'],
  ['第 3 关 · 找一找','听声音，找到正确图片。'],
  ['第 4 关 · 写一写','我们把单词一个字母一个字母写出来。'],
  ['完成啦！','你集齐了一张新贴纸！']
];

function setGuide(step, message) {
  $('guideEyebrow').textContent = guideCopy[step][0];
  $('guideMessage').textContent = message || guideCopy[step][1];
}

function render() {
  cleanupMic();
  cleanupTrace();
  const items = lesson();
  current = Math.max(0, Math.min(current, items.length-1));
  const w = items[current];
  const completed = state.done[date] || [];
  const doneCount = items.filter((item) => completed.includes(item.word)).length;
  const today = localDate(new Date());
  const stickers = new Set(state.stickers).size;
  const learned = learnedWords().size;

  $('dateLabel').textContent = date === today ? '今天' : new Date(`${date}T12:00:00`).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});
  $('lessonName').textContent = `DAY ${String(Math.max(1,dayNo(date)+1)).padStart(2,'0')} · ${w.review ? '智能复习' : items[0].theme}`;
  $('headline').textContent = `${date === today ? '今天' : '这一天'}有 ${items.length} 个任务`;
  $('count').textContent = `${doneCount} / ${items.length}`;
  $('bar').style.width = `${doneCount / items.length * 100}%`;
  $('learnedTotal').textContent = `已积累 ${learned} 个单词`;
  $('stickerTotal').textContent = `${Math.max(stickers, learned)} 张贴纸`;

  $('tabs').innerHTML = items.map((item,index) => {
    const done = completed.includes(item.word);
    return `<button class="tab ${index===current?'active':''} ${done?'finished':''}" data-i="${index}" aria-current="${index===current?'step':'false'}"><span>${item.emoji}</span><div><b>${item.word}</b><small>${item.zh}${item.review?' · 复习':''}</small></div><em>${done?'✓':index===current?'•':'›'}</em></button>`;
  }).join('');
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      current = Number(button.dataset.i);
      render();
    });
  });

  document.querySelectorAll('.amount').forEach((button) => button.classList.toggle('selected', Number(button.dataset.n) === state.amount));

  $('miniEmoji').textContent = w.emoji;
  $('miniWord').textContent = w.word;
  $('emoji').textContent = w.emoji;
  $('bubble').textContent = w.bubble;
  $('picture').className = `picture ${w.tone}`;
  $('word').textContent = w.word;
  $('phonetic').textContent = `${w.phonetic} · ${w.zh}`;
  $('example').textContent = w.sentence;
  $('speakEmoji').textContent = w.emoji;
  $('speakWord').textContent = w.word;
  $('choiceWord').textContent = w.word;
  $('writeWord').textContent = w.word;
  $('rewardEmoji').textContent = w.emoji;
  $('rewardWord').textContent = w.word;

  renderStep(w, flowStep(w.word));
}

function renderStep(w, step) {
  document.querySelectorAll('[data-stage]').forEach((stage) => { stage.hidden = Number(stage.dataset.stage) !== step; });
  document.querySelectorAll('#stepRail [data-step]').forEach((item) => {
    const index = Number(item.dataset.step);
    item.classList.toggle('current', index === step);
    item.classList.toggle('done', index < step || (step === 4 && index === 4));
  });
  document.querySelectorAll('#stepRail > b').forEach((line,index) => line.classList.toggle('done', index < step));
  setGuide(step);

  if (step === 0) prepareListen();
  if (step === 1) resetSpeak();
  if (step === 2) renderChoices(w);
  if (step === 3) prepareTrace(w);
  if (step === 4) renderReward(w);
}

function goToStep(step) {
  const w = currentWord();
  cleanupMic();
  setFlowStep(w.word, step);
  render();
  const stage = document.querySelector(`[data-stage="${step}"]`);
  if (stage) stage.focus?.({preventScroll:true});
}

function prepareListen() {
  $('listenAction').classList.remove('played');
  $('listenAction').innerHTML = '🔊 <span><b>听单词发音</b><small>点一下，认真听</small></span>';
  $('listenNext').hidden = true;
}

$('listenAction').addEventListener('click', () => {
  speak(currentWord().word);
  $('listenAction').classList.add('played');
  $('listenAction').innerHTML = '🔊 <span><b>再听一次</b><small>听清每个声音</small></span>';
  $('listenNext').hidden = false;
  setGuide(0,'听到了吗？现在轮到你来读！');
});
$('listenNext').addEventListener('click', () => goToStep(1));
$('speakSentence').addEventListener('click', () => speak(currentWord().sentence));

function cleanupMic() {
  micRun += 1;
  clearTimeout(micTimer);
  micTimer = null;
  if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

function resetSpeak() {
  $('speakPanel').className = 'speakPanel';
  $('micAction').disabled = false;
  $('micAction').textContent = '🎙️';
  $('speakStatus').textContent = '点麦克风，小芽会认真听';
  $('speakHint').textContent = '这是演示反馈，不记录孩子的声音';
  $('speakFeedback').hidden = true;
  $('speakActions').hidden = true;
}

async function startMic() {
  if ($('micAction').disabled) return;
  cleanupMic();
  const run = micRun;
  const word = currentWord().word;
  $('micAction').disabled = true;
  $('micAction').textContent = '👂';
  $('speakPanel').className = 'speakPanel recording';
  $('speakStatus').textContent = '小芽正在听你读…';
  $('speakHint').textContent = `大声读：${word}`;
  setGuide(1,`我在认真听，读出 ${word}！`);

  try {
    if (navigator.mediaDevices?.getUserMedia) activeStream = await navigator.mediaDevices.getUserMedia({audio:true});
  } catch (_) {
    $('speakHint').textContent = '未开启麦克风，继续体验演示反馈';
  }
  if (run !== micRun) {
    if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
    return;
  }
  micTimer = setTimeout(() => finishMic(run), 1800);
}

function finishMic(run) {
  if (run !== micRun) return;
  if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
  $('speakPanel').className = 'speakPanel success';
  $('micAction').textContent = '✓';
  $('speakStatus').textContent = '小芽听到了！';
  $('speakHint').textContent = '演示反馈 · 正式版可接入音素级评测';
  $('speakFeedback').hidden = false;
  $('speakActions').hidden = false;
  setGuide(1,'听起来很清楚！你真勇敢！');
}

$('micAction').addEventListener('click', startMic);
$('speakAgain').addEventListener('click', resetSpeak);
$('speakNext').addEventListener('click', () => goToStep(2));

function choiceOptions(w) {
  const index = bank.findIndex((item) => item.word === w.word);
  const choices = [w, bank[(index+5)%bank.length], bank[(index+11)%bank.length]];
  const correctPosition = (Math.max(0,dayNo(date)) + index) % 3;
  const correct = choices.shift();
  choices.splice(correctPosition,0,correct);
  return choices;
}

function renderChoices(w) {
  $('choiceGrid').innerHTML = choiceOptions(w).map((item) => `<button class="pictureChoice" data-word="${item.word}" aria-label="${item.zh}"><span>${item.emoji}</span><b>${item.zh}</b></button>`).join('');
  $('choiceFeedback').textContent = '点一张图片试试看';
  $('choiceFeedback').className = 'choiceFeedback';
  $('choiceNext').hidden = true;
  document.querySelectorAll('.pictureChoice').forEach((button) => {
    button.addEventListener('click', () => checkChoice(button,w));
  });
}

function checkChoice(button,w) {
  if (button.dataset.word !== w.word) {
    button.classList.remove('wrong');
    void button.offsetWidth;
    button.classList.add('wrong');
    $('choiceFeedback').textContent = '差一点，再听一次试试！';
    $('choiceFeedback').className = 'choiceFeedback tryAgain';
    setGuide(2,'没关系，再仔细听一听。');
    return;
  }
  document.querySelectorAll('.pictureChoice').forEach((item) => { item.disabled = true; });
  button.classList.add('correct');
  $('choiceFeedback').textContent = `找对啦！${w.word} 就是 ${w.zh}`;
  $('choiceFeedback').className = 'choiceFeedback correct';
  $('choiceNext').hidden = false;
  setGuide(2,'眼睛真亮！我们去写字母吧。');
}

$('choiceHear').addEventListener('click', () => speak(currentWord().word));
$('choiceNext').addEventListener('click', () => goToStep(3));

const pad = $('pad');
const pctx = pad.getContext('2d');
const guidePad = $('guidePad');
const guideCtx = guidePad.getContext('2d');
let penDown = false;
let lastPoint = null;
let inkDistance = 0;
let inkHistory = [];
let letterIndex = 0;
let guideFrame = 0;
let traceAdvanceTimer = null;
let traceCompleting = false;

// Simple child-friendly stroke routes. They are animated on Canvas and cover
// every lower-case letter currently used by the lesson bank.
const guidePaths = {
  a:[[[68,56],[66,43],[57,35],[44,35],[34,44],[31,57],[35,70],[46,77],[58,73],[66,63]],[[67,36],[67,77]]],
  b:[[[38,18],[38,78]],[[39,56],[43,44],[53,38],[64,41],[70,51],[69,64],[61,73],[50,76],[40,69]]],
  c:[[[70,42],[62,35],[49,34],[38,40],[32,51],[32,64],[39,73],[51,77],[63,74],[70,68]]],
  d:[[[66,56],[64,43],[55,36],[43,36],[34,45],[32,58],[36,70],[47,76],[58,72],[66,63]],[[67,18],[67,77]]],
  e:[[[70,57],[33,57],[35,46],[43,38],[55,35],[65,39],[70,48],[68,55],[59,58],[34,58],[36,68],[45,75],[57,77],[68,72]]],
  f:[[[61,20],[53,18],[46,23],[43,33],[43,78]],[[31,45],[61,45]]],
  g:[[[66,56],[64,43],[55,36],[43,36],[34,45],[32,58],[36,70],[47,76],[58,72],[66,63]],[[67,37],[67,76],[64,87],[55,92],[43,89]]],
  h:[[[38,18],[38,78]],[[39,53],[45,42],[55,38],[65,42],[68,52],[68,78]]],
  i:[[[50,25]],[[50,43],[50,78]]],
  k:[[[38,18],[38,78]],[[68,39],[39,61]],[[50,53],[70,78]]],
  l:[[[49,18],[49,70],[53,77],[62,77]]],
  m:[[[27,42],[27,78]],[[28,51],[35,41],[44,39],[51,47],[51,78]],[[52,50],[59,41],[68,40],[74,48],[74,78]]],
  n:[[[35,41],[35,78]],[[36,52],[44,42],[55,39],[65,45],[67,55],[67,78]]],
  o:[[[70,56],[67,43],[58,35],[46,34],[36,41],[31,53],[33,66],[41,74],[53,77],[64,71],[70,60],[70,56]]],
  p:[[[36,40],[36,91]],[[37,53],[43,42],[54,37],[65,42],[70,53],[68,66],[59,74],[47,73],[38,64]]],
  r:[[[38,41],[38,78]],[[39,54],[46,44],[55,40],[66,42]]],
  s:[[[69,41],[61,35],[49,35],[39,40],[36,48],[41,55],[58,59],[67,65],[65,72],[56,77],[44,76],[35,70]]],
  t:[[[50,22],[50,67],[54,75],[64,76]],[[35,43],[66,43]]],
  u:[[[34,41],[34,64],[38,73],[48,77],[58,73],[66,63],[66,41]],[[67,41],[67,78]]],
  w:[[[27,42],[34,77],[46,54],[55,77],[66,42],[74,77]]],
  y:[[[31,41],[38,65],[48,75],[59,69],[67,55],[70,41]],[[69,42],[67,73],[63,86],[54,92],[43,89]]]
};

function cleanupTrace() {
  if (guideFrame) cancelAnimationFrame(guideFrame);
  guideFrame = 0;
  clearTimeout(traceAdvanceTimer);
  traceAdvanceTimer = null;
  traceCompleting = false;
  guideCtx?.clearRect(0,0,guidePad.width,guidePad.height);
  $('canvasWrap')?.classList.remove('demonstrating','demoFinished','traceSuccess');
  pad?.classList.remove('locked');
}

function traceRecord(word) {
  state.letterProgress[date] = state.letterProgress[date] || {};
  return Number(state.letterProgress[date][word] || 0);
}

function setTraceRecord(word,index) {
  state.letterProgress[date] = state.letterProgress[date] || {};
  state.letterProgress[date][word] = index;
  save();
}

function prepareTrace(w) {
  letterIndex = Math.max(0, Math.min(traceRecord(w.word), w.word.length-1));
  updateTraceUI(w);
  clearPad();
  startGuideDemo(w.word[letterIndex]);
}

function updateTraceUI(w) {
  const letters = [...w.word];
  $('letterTrail').innerHTML = letters.map((letter,index) => `<span class="${index<letterIndex?'done':index===letterIndex?'current':''}">${index<letterIndex?'✓':letter}</span>`).join('');
  $('letterName').textContent = letters[letterIndex];
  $('traceLetter').textContent = letters[letterIndex];
  $('traceStatus').textContent = '先看小芽示范，再轮到你：';
  setGuide(3,`先看字母 ${letters[letterIndex]} 怎么写。`);
}

function scaledGuide(letter) {
  const source = guidePaths[letter] || [[[35,25],[65,25],[65,76],[35,76],[35,25]]];
  const scale = pad.height * .82 / 100;
  const left = (pad.width - 100 * scale) / 2;
  const top = (pad.height - 100 * scale) / 2;
  return source.map((stroke) => stroke.map(([x,y]) => ({x:left+x*scale,y:top+y*scale})));
}

function strokeLength(stroke) {
  return stroke.slice(1).reduce((sum,point,index) => sum + Math.hypot(point.x-stroke[index].x,point.y-stroke[index].y),0);
}

function drawGuideProgress(strokes, progress) {
  guideCtx.clearRect(0,0,guidePad.width,guidePad.height);
  const lengths = strokes.map(strokeLength);
  const pause = 34;
  const total = lengths.reduce((sum,length) => sum+length,0) + pause * Math.max(0,strokes.length-1);
  let remaining = total * progress;
  let head = null;

  strokes.forEach((stroke,strokeIndex) => {
    const start = stroke[0];
    guideCtx.beginPath();
    guideCtx.fillStyle = '#ff897d';
    guideCtx.arc(start.x,start.y,11,0,Math.PI*2);
    guideCtx.fill();
    guideCtx.fillStyle = '#fff';
    guideCtx.font = '900 13px Arial';
    guideCtx.textAlign = 'center';
    guideCtx.textBaseline = 'middle';
    guideCtx.fillText(String(strokeIndex+1),start.x,start.y+.5);
    if (remaining <= 0) return;
    if (stroke.length === 1) { head = start; remaining -= pause; return; }

    guideCtx.beginPath();
    guideCtx.moveTo(start.x,start.y);
    guideCtx.strokeStyle = '#ff897d';
    guideCtx.lineWidth = 16;
    guideCtx.lineCap = 'round';
    guideCtx.lineJoin = 'round';
    for (let i=1; i<stroke.length; i+=1) {
      const from = stroke[i-1];
      const to = stroke[i];
      const length = Math.hypot(to.x-from.x,to.y-from.y);
      if (remaining >= length) {
        guideCtx.lineTo(to.x,to.y);
        head = to;
        remaining -= length;
      } else if (remaining > 0) {
        const ratio = remaining/length;
        head = {x:from.x+(to.x-from.x)*ratio,y:from.y+(to.y-from.y)*ratio};
        guideCtx.lineTo(head.x,head.y);
        remaining = 0;
      }
    }
    guideCtx.stroke();
    remaining -= pause;
  });

  if (head && progress < 1) {
    guideCtx.beginPath();
    guideCtx.fillStyle = '#fff';
    guideCtx.arc(head.x,head.y,8,0,Math.PI*2);
    guideCtx.fill();
    guideCtx.strokeStyle = '#ff897d';
    guideCtx.lineWidth = 5;
    guideCtx.stroke();
  }
}

function startGuideDemo(letter) {
  if (traceCompleting) return;
  if (guideFrame) cancelAnimationFrame(guideFrame);
  const wrap = $('canvasWrap');
  wrap.classList.remove('demoFinished');
  wrap.classList.add('demonstrating');
  $('traceStatus').textContent = '看小芽从起点开始写：';
  $('watchTrace').disabled = true;
  const strokes = scaledGuide(letter);
  const started = performance.now();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duration = reduceMotion ? 320 : 1500 + strokes.length * 170;
  const animate = (now) => {
    const progress = Math.min(1,(now-started)/duration);
    drawGuideProgress(strokes,progress);
    if (progress < 1) {
      guideFrame = requestAnimationFrame(animate);
      return;
    }
    guideFrame = 0;
    wrap.classList.remove('demonstrating');
    wrap.classList.add('demoFinished');
    $('traceStatus').textContent = '轮到你啦，沿着示范写一遍：';
    $('watchTrace').disabled = false;
    setGuide(3,`轮到你写字母 ${letter} 啦！`);
  };
  guideFrame = requestAnimationFrame(animate);
}

function stopGuideDemo() {
  if (guideFrame) cancelAnimationFrame(guideFrame);
  guideFrame = 0;
  guideCtx.clearRect(0,0,guidePad.width,guidePad.height);
  $('canvasWrap').classList.remove('demonstrating','demoFinished');
  $('watchTrace').disabled = false;
}

function requiredInkDistance(letter) {
  const total = scaledGuide(letter).reduce((sum,stroke) => sum+strokeLength(stroke),0);
  return Math.max(100,Math.min(260,total*.52));
}

function updateWriteProgress() {
  const letter = currentWord().word[letterIndex];
  const percent = Math.min(100,Math.round(inkDistance/requiredInkDistance(letter)*100));
  $('writeProgressBar').style.width = `${percent}%`;
  $('writeProgress').setAttribute('aria-valuenow',String(percent));
  return percent;
}

function padPoint(event) {
  const rect = pad.getBoundingClientRect();
  return {x:(event.clientX-rect.left)*pad.width/rect.width, y:(event.clientY-rect.top)*pad.height/rect.height};
}

function clearPad() {
  pctx.clearRect(0,0,pad.width,pad.height);
  inkHistory = [];
  inkDistance = 0;
  penDown = false;
  lastPoint = null;
  updateWriteProgress();
}

function startStroke(event) {
  if (traceCompleting) return;
  event.preventDefault();
  stopGuideDemo();
  pad.setPointerCapture?.(event.pointerId);
  const point = padPoint(event);
  penDown = true;
  lastPoint = point;
  pctx.beginPath();
  pctx.moveTo(point.x,point.y);
  pctx.lineWidth = 18;
  pctx.lineCap = 'round';
  pctx.lineJoin = 'round';
  pctx.strokeStyle = '#7057db';
  $('traceStatus').textContent = '写得真认真，继续描一描：';
}

function moveStroke(event) {
  if (!penDown) return;
  event.preventDefault();
  const points = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
  points.forEach((sample) => {
    const point = padPoint(sample);
    inkDistance += Math.hypot(point.x-lastPoint.x,point.y-lastPoint.y);
    pctx.lineTo(point.x,point.y);
    lastPoint = point;
  });
  pctx.stroke();
  updateWriteProgress();
}

function endStroke(event) {
  if (!penDown) return;
  event.preventDefault();
  penDown = false;
  lastPoint = null;
  inkHistory.push({image:pctx.getImageData(0,0,pad.width,pad.height),distance:inkDistance});
  if (updateWriteProgress() >= 100) completeLetterAutomatically();
  else $('traceStatus').textContent = '再描一点点，就写好啦：';
}

function cancelStroke(event) {
  if (!penDown) return;
  event.preventDefault();
  penDown = false;
  lastPoint = null;
  $('traceStatus').textContent = '没关系，继续沿着字母写：';
}

pad.addEventListener('pointerdown',startStroke);
pad.addEventListener('pointermove',moveStroke);
pad.addEventListener('pointerup',endStroke);
pad.addEventListener('pointercancel',cancelStroke);

$('clearWrite').addEventListener('click',() => {
  if (!traceCompleting) clearPad();
});
$('undoWrite').addEventListener('click', () => {
  if (traceCompleting) return;
  inkHistory.pop();
  pctx.clearRect(0,0,pad.width,pad.height);
  const previous = inkHistory.at(-1);
  inkDistance = previous?.distance || 0;
  if (previous) pctx.putImageData(previous.image,0,0);
  updateWriteProgress();
});
$('hearWrite').addEventListener('click', () => speak(currentWord().word));
$('watchTrace').addEventListener('click', () => startGuideDemo(currentWord().word[letterIndex]));

function completeLetterAutomatically() {
  if (traceCompleting) return;
  traceCompleting = true;
  stopGuideDemo();
  const wrap = $('canvasWrap');
  wrap.classList.add('traceSuccess');
  pad.classList.add('locked');
  $('watchTrace').disabled = true;
  const w = currentWord();
  const lastLetter = letterIndex === w.word.length-1;
  $('traceStatus').textContent = lastLetter ? '整个单词写完啦！' : '写好啦，马上到下一个字母！';
  setGuide(3,lastLetter ? `${w.word} 写完啦，去领贴纸！` : '写得真棒，自动进入下一个字母。');
  $('liveMessage').textContent = lastLetter ? `${w.word} 书写完成` : `字母 ${w.word[letterIndex]} 书写完成`;

  traceAdvanceTimer = setTimeout(() => {
    traceAdvanceTimer = null;
    traceCompleting = false;
    wrap.classList.remove('traceSuccess');
    pad.classList.remove('locked');
    if (!lastLetter) {
      letterIndex += 1;
      setTraceRecord(w.word,letterIndex);
      updateTraceUI(w);
      clearPad();
      startGuideDemo(w.word[letterIndex]);
      return;
    }
    state.done[date] = [...new Set([...(state.done[date] || []),w.word])];
    state.writeDone[date] = [...new Set([...(state.writeDone[date] || []),w.word])];
    state.stickers = [...new Set([...state.stickers,w.word])];
    setTraceRecord(w.word,w.word.length);
    setFlowStep(w.word,4);
    save();
    render();
  },760);
}

function renderReward(w) {
  const items = lesson();
  const completed = state.done[date] || [];
  const doneCount = items.filter((item) => completed.includes(item.word)).length;
  $('stars').textContent = `${doneCount * 2} 颗`;
  $('rewardTotal').textContent = `${Math.max(new Set(state.stickers).size,learnedWords().size)} 张`;
  $('nextWord').innerHTML = doneCount === items.length ? '今天完成啦 <span>🎉</span>' : '下一个单词 <span>→</span>';
}

$('playAgain').addEventListener('click', () => {
  const w = currentWord();
  setTraceRecord(w.word,0);
  setFlowStep(w.word,0);
  render();
});

$('nextWord').addEventListener('click', () => {
  const items = lesson();
  const start = current;
  let next = (current+1) % items.length;
  for (let offset=1; offset<=items.length; offset+=1) {
    const candidate = (start+offset) % items.length;
    if (!wordIsDone(items[candidate].word)) { next = candidate; break; }
  }
  current = next;
  render();
});

function changeDay(offset) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate()+offset);
  date = localDate(nextDate);
  current = 0;
  render();
}

$('prevDay').addEventListener('click', () => changeDay(-1));
$('nextDay').addEventListener('click', () => changeDay(1));
$('settingsBtn').addEventListener('click', () => {
  const open = !$('settings').classList.contains('show');
  $('settings').classList.toggle('show',open);
  $('settingsBtn').setAttribute('aria-expanded',String(open));
});
$('settingsDone').addEventListener('click', () => {
  $('settings').classList.remove('show');
  $('settingsBtn').setAttribute('aria-expanded','false');
});
document.querySelectorAll('.amount').forEach((button) => {
  button.addEventListener('click', () => {
    state.amount = Number(button.dataset.n);
    current = 0;
    save();
    render();
  });
});

window.addEventListener('beforeunload',cleanupMic);
render();
