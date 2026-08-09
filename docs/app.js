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

const lessonWords = new Set(bank.map((item) => item.word));
let activeAudio = null;
let activeSpeech = null;
let englishVoice = null;
let playbackRun = 0;
let playbackMessageTimer = null;

function updateEnglishVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  englishVoice = voices.find((voice) => /^en[-_]US$/i.test(voice.lang))
    || voices.find((voice) => /^en([-_]|$)/i.test(voice.lang))
    || null;
}

if ('speechSynthesis' in window) {
  updateEnglishVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged',updateEnglishVoice);
}

function releaseAudio(record) {
  if (!record) return;
  clearTimeout(record.startTimer);
  record.element.removeEventListener('playing',record.onPlaying);
  record.element.removeEventListener('ended',record.onEnded);
  record.element.removeEventListener('error',record.onError);
  try {
    record.element.pause();
    record.element.currentTime = 0;
    record.element.removeAttribute('src');
    record.element.load();
  } catch { /* The media element may not have loaded metadata yet. */ }
  if (activeAudio === record) activeAudio = null;
}

function releaseSpeech(record) {
  if (!record) return;
  clearTimeout(record.startTimer);
  clearTimeout(record.resumeTimer);
  record.utterance.onstart = null;
  record.utterance.onend = null;
  record.utterance.onerror = null;
  if (activeSpeech === record) activeSpeech = null;
}

function stopPlayback() {
  playbackRun += 1;
  releaseAudio(activeAudio);
  releaseSpeech(activeSpeech);
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch { /* Ignore engine shutdown errors. */ }
  }
  clearTimeout(playbackMessageTimer);
  playbackMessageTimer = null;
}

function showPlaybackProblem(message,run) {
  if (run !== playbackRun) return;
  $('liveMessage').textContent = message;
  $('guideMessage').textContent = `🔊 ${message}`;
  clearTimeout(playbackMessageTimer);
  playbackMessageTimer = setTimeout(() => {
    if (run === playbackRun) setGuide(flowStep(currentWord().word));
  },3600);
}

function speakWithSystem(text,run,usedFallback=false) {
  if (run !== playbackRun) return;
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    showPlaybackProblem('当前浏览器暂时无法播放发音，请检查媒体音量后再试',run);
    return;
  }

  const synth = window.speechSynthesis;
  releaseSpeech(activeSpeech);
  try { synth.cancel(); } catch { /* Continue with a fresh utterance. */ }
  updateEnglishVoice();
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = englishVoice?.lang || 'en-US';
  if (englishVoice) utterance.voice = englishVoice;
  utterance.rate = 0.72;
  utterance.pitch = 1.08;
  const record = {utterance,run,started:false,startTimer:null,resumeTimer:null};
  activeSpeech = record;
  const finish = () => releaseSpeech(record);
  utterance.onstart = () => {
    if (run !== playbackRun || activeSpeech !== record) return;
    record.started = true;
    clearTimeout(record.startTimer);
    clearTimeout(record.resumeTimer);
  };
  utterance.onend = finish;
  utterance.onerror = (event) => {
    const isCurrent = run === playbackRun && activeSpeech === record;
    finish();
    if (isCurrent && !['canceled','interrupted'].includes(event.error)) {
      showPlaybackProblem('发音暂时没有播放出来，请再点一次',run);
    }
  };
  record.startTimer = setTimeout(() => {
    if (run !== playbackRun || activeSpeech !== record || record.started) return;
    finish();
    try { synth.cancel(); } catch { /* The start timeout already handles failure. */ }
    showPlaybackProblem('系统发音启动较慢，请再点一次',run);
  },2100);

  try {
    if (synth.paused) synth.resume();
    // Some Android browsers leave the speech engine paused after interruption.
    record.resumeTimer = setTimeout(() => {
      if (run === playbackRun && synth.paused) synth.resume();
    },0);
    synth.speak(utterance);
    if (usedFallback) showPlaybackProblem('内置音频暂时不可用，已切换为系统英文发音',run);
  } catch {
    finish();
    showPlaybackProblem('发音暂时没有播放出来，请再点一次',run);
  }
}

function speak(text) {
  stopPlayback();
  const run = playbackRun;
  const normalized = String(text).trim().toLowerCase();

  if (!lessonWords.has(normalized)) {
    speakWithSystem(text,run);
    return;
  }

  const audio = new Audio(`audio/${normalized}.wav`);
  audio.preload = 'auto';
  const record = {
    element:audio,run,started:false,fellBack:false,startTimer:null,
    onPlaying:null,onEnded:null,onError:null
  };
  activeAudio = record;
  const fallback = () => {
    if (record.fellBack || run !== playbackRun || activeAudio !== record) return;
    record.fellBack = true;
    releaseAudio(record);
    speakWithSystem(normalized,run,true);
  };
  record.onPlaying = () => {
    if (run !== playbackRun || activeAudio !== record) return;
    record.started = true;
    clearTimeout(record.startTimer);
  };
  record.onEnded = () => releaseAudio(record);
  record.onError = fallback;
  audio.addEventListener('playing',record.onPlaying);
  audio.addEventListener('ended',record.onEnded);
  audio.addEventListener('error',record.onError);
  record.startTimer = setTimeout(() => {
    if (run === playbackRun && activeAudio === record && !record.started) fallback();
  },4000);

  try {
    const started = audio.play();
    if (started?.then) started.then(record.onPlaying).catch(fallback);
  } catch {
    fallback();
  }
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
  stopPlayback();
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
    return `<button class="tab ${index===current?'active':''} ${done?'finished':''}" data-i="${index}" aria-current="${index===current?'step':'false'}" aria-label="选择并播放 ${item.word}，${item.zh}"><span class="tabPicture">${item.emoji}<i aria-hidden="true">🔊</i></span><div><b>${item.word}</b><small>${item.zh}${item.review?' · 复习':''}</small></div><em>${done?'✓':index===current?'•':'›'}</em></button>`;
  }).join('');
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      current = Number(button.dataset.i);
      const selectedWord = items[current].word;
      render();
      speak(selectedWord);
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
  ['picture','speakPicture','rewardSticker','wordBadge'].forEach((id) => {
    $(id).setAttribute('aria-label',`播放 ${w.word} 的英文发音`);
  });

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
['picture','speakPicture','rewardSticker','wordBadge'].forEach((id) => {
  $(id).addEventListener('click', () => speak(currentWord().word));
});

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

function renderChoices(w,keepNext=false) {
  $('choiceGrid').innerHTML = choiceOptions(w).map((item) => `<button class="pictureChoice" data-word="${item.word}" aria-label="播放 ${item.word} 并选择${item.zh}"><span>${item.emoji}<i aria-hidden="true">🔊</i></span><b>${item.zh}</b></button>`).join('');
  $('choiceFeedback').textContent = keepNext ? '再选一次吧，想继续时也可以去写字母' : '点一张图片试试看';
  $('choiceFeedback').className = 'choiceFeedback';
  $('choiceActions').hidden = !keepNext;
  document.querySelectorAll('.pictureChoice').forEach((button) => {
    button.addEventListener('click', () => {
      speak(button.dataset.word);
      checkChoice(button,w);
    });
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
  $('choiceActions').hidden = false;
  setGuide(2,'眼睛真亮！我们去写字母吧。');
}

$('choiceHear').addEventListener('click', () => speak(currentWord().word));
$('choiceAgain').addEventListener('click', () => {
  const w = currentWord();
  renderChoices(w,true);
  speak(w.word);
  setGuide(2,'再玩一次！听声音，重新选一张图片。');
});
$('choiceNext').addEventListener('click', () => goToStep(3));

const pad = $('pad');
const pctx = pad.getContext('2d');
let penDown = false;
let lastPoint = null;
let inkDistance = 0;
let inkHistory = [];
let letterIndex = 0;
let traceAdvanceTimer = null;
let traceCompleting = false;
let activePointerId = null;

function cleanupTrace() {
  clearTimeout(traceAdvanceTimer);
  traceAdvanceTimer = null;
  traceCompleting = false;
  $('canvasWrap')?.classList.remove('traceSuccess');
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
}

function updateTraceUI(w) {
  const letters = [...w.word];
  $('letterTrail').innerHTML = letters.map((letter,index) => `<span class="${index<letterIndex?'done':index===letterIndex?'current':''}">${index<letterIndex?'✓':letter}</span>`).join('');
  $('letterName').textContent = letters[letterIndex];
  $('traceLetter').textContent = letters[letterIndex];
  $('traceStatus').textContent = '沿着浅色字母描一遍：';
  setGuide(3,`现在写字母 ${letters[letterIndex]}，慢慢来。`);
}

function requiredInkDistance(letter) {
  if ('il'.includes(letter)) return 95;
  if ('ctuv'.includes(letter)) return 145;
  if ('mw'.includes(letter)) return 230;
  return 180;
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
  activePointerId = null;
  lastPoint = null;
  $('clearWrite').textContent = '清除重写';
  updateWriteProgress();
}

function startStroke(event) {
  if (traceCompleting || activePointerId !== null) return;
  event.preventDefault();
  activePointerId = event.pointerId;
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
  if (!penDown || activePointerId !== event.pointerId) return;
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
  if (!penDown || activePointerId !== event.pointerId) return;
  event.preventDefault();
  penDown = false;
  activePointerId = null;
  lastPoint = null;
  inkHistory.push({image:pctx.getImageData(0,0,pad.width,pad.height),distance:inkDistance});
  if (updateWriteProgress() >= 100) completeLetterAutomatically();
  else $('traceStatus').textContent = '再描一点点，就写好啦：';
}

function cancelStroke(event) {
  if (!penDown || activePointerId !== event.pointerId) return;
  event.preventDefault();
  penDown = false;
  activePointerId = null;
  lastPoint = null;
  $('traceStatus').textContent = '没关系，继续沿着字母写：';
}

pad.addEventListener('pointerdown',startStroke);
pad.addEventListener('pointermove',moveStroke);
pad.addEventListener('pointerup',endStroke);
pad.addEventListener('pointercancel',cancelStroke);

function unlockTraceForRewrite() {
  clearTimeout(traceAdvanceTimer);
  traceAdvanceTimer = null;
  traceCompleting = false;
  $('canvasWrap').classList.remove('traceSuccess');
  pad.classList.remove('locked');
}

$('clearWrite').addEventListener('click',() => {
  unlockTraceForRewrite();
  clearPad();
  $('traceStatus').textContent = '好呀，再写一次这个字母：';
  setGuide(3,`再写一次字母 ${currentWord().word[letterIndex]}，慢慢来。`);
});
$('restartWord').addEventListener('click',() => {
  const w = currentWord();
  unlockTraceForRewrite();
  letterIndex = 0;
  setTraceRecord(w.word,0);
  updateTraceUI(w);
  clearPad();
  $('traceStatus').textContent = '从第一个字母重新写起：';
  setGuide(3,`好呀，从字母 ${w.word[0]} 开始重写 ${w.word}。`);
  $('liveMessage').textContent = `${w.word} 已回到第一个字母`;
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

function completeLetterAutomatically() {
  if (traceCompleting) return;
  traceCompleting = true;
  const wrap = $('canvasWrap');
  wrap.classList.add('traceSuccess');
  pad.classList.add('locked');
  const w = currentWord();
  const lastLetter = letterIndex === w.word.length-1;
  $('traceStatus').textContent = lastLetter ? '整个单词写完啦！' : '写好啦，马上到下一个字母！';
  $('clearWrite').textContent = '再写一次';
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
      return;
    }
    state.done[date] = [...new Set([...(state.done[date] || []),w.word])];
    state.writeDone[date] = [...new Set([...(state.writeDone[date] || []),w.word])];
    state.stickers = [...new Set([...state.stickers,w.word])];
    setTraceRecord(w.word,w.word.length);
    setFlowStep(w.word,4);
    save();
    render();
  },1100);
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

$('rewardWriteAgain').addEventListener('click', () => {
  const w = currentWord();
  setTraceRecord(w.word,0);
  goToStep(3);
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
