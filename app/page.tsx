"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Word={word:string;phonetic:string;zh:string;emoji:string;bubble:string;sentence:string;tone:string;theme:string;score:number;tip:string};
const bank:Word[]=[
 {word:"apple",phonetic:"/ˈæp.əl/",zh:"苹果",emoji:"🍎",bubble:"Yummy!",sentence:"An apple is red.",tone:"coral",theme:"水果乐园",score:92,tip:"开头的 /æ/ 音很清楚！"},
 {word:"banana",phonetic:"/bəˈnɑː.nə/",zh:"香蕉",emoji:"🍌",bubble:"Sweet!",sentence:"I like bananas.",tone:"yellow",theme:"水果乐园",score:90,tip:"每个音节都读得很完整！"},
 {word:"orange",phonetic:"/ˈɒr.ɪndʒ/",zh:"橙子",emoji:"🍊",bubble:"Juicy!",sentence:"The orange is round.",tone:"coral",theme:"水果乐园",score:91,tip:"结尾的 /dʒ/ 音很棒！"},
 {word:"grape",phonetic:"/ɡreɪp/",zh:"葡萄",emoji:"🍇",bubble:"Pop!",sentence:"These grapes are purple.",tone:"violet",theme:"水果乐园",score:93,tip:"长元音 /eɪ/ 很清楚！"},
 {word:"cat",phonetic:"/kæt/",zh:"小猫",emoji:"🐱",bubble:"Meow!",sentence:"The cat is cute.",tone:"violet",theme:"动物朋友",score:88,tip:"短短的 /æ/ 音读得很好！"},
 {word:"dog",phonetic:"/dɒɡ/",zh:"小狗",emoji:"🐶",bubble:"Woof!",sentence:"The dog can run.",tone:"yellow",theme:"动物朋友",score:95,tip:"结尾的 /g/ 音很有力！"},
 {word:"bird",phonetic:"/bɜːd/",zh:"小鸟",emoji:"🐦",bubble:"Tweet!",sentence:"A bird can fly.",tone:"mint",theme:"动物朋友",score:90,tip:"中间的长音读得很稳！"},
 {word:"fish",phonetic:"/fɪʃ/",zh:"小鱼",emoji:"🐟",bubble:"Splash!",sentence:"The fish can swim.",tone:"mint",theme:"动物朋友",score:92,tip:"结尾的 /ʃ/ 音很轻！"},
 {word:"red",phonetic:"/red/",zh:"红色",emoji:"🔴",bubble:"Bright!",sentence:"My ball is red.",tone:"coral",theme:"彩虹颜色",score:94,tip:"开头的 /r/ 音很自然！"},
 {word:"blue",phonetic:"/bluː/",zh:"蓝色",emoji:"🔵",bubble:"Cool!",sentence:"The sky is blue.",tone:"mint",theme:"彩虹颜色",score:91,tip:"结尾的 /uː/ 音拉得很好！"},
 {word:"green",phonetic:"/ɡriːn/",zh:"绿色",emoji:"🟢",bubble:"Fresh!",sentence:"The leaf is green.",tone:"mint",theme:"彩虹颜色",score:90,tip:"长音 /iː/ 很清楚！"},
 {word:"yellow",phonetic:"/ˈjel.əʊ/",zh:"黄色",emoji:"🟡",bubble:"Sunny!",sentence:"The sun is yellow.",tone:"yellow",theme:"彩虹颜色",score:93,tip:"两个音节衔接得很好！"},
 {word:"mom",phonetic:"/mɒm/",zh:"妈妈",emoji:"👩",bubble:"Hello!",sentence:"My mom is kind.",tone:"coral",theme:"我的家人",score:94,tip:"两个 /m/ 音都很清楚！"},
 {word:"dad",phonetic:"/dæd/",zh:"爸爸",emoji:"👨",bubble:"Hi!",sentence:"My dad is funny.",tone:"mint",theme:"我的家人",score:92,tip:"开头和结尾都读得很完整！"},
 {word:"baby",phonetic:"/ˈbeɪ.bi/",zh:"宝宝",emoji:"👶",bubble:"Giggle!",sentence:"The baby is happy.",tone:"yellow",theme:"我的家人",score:91,tip:"重音放得很准确！"},
 {word:"family",phonetic:"/ˈfæm.əl.i/",zh:"家人",emoji:"👨‍👩‍👧",bubble:"Together!",sentence:"I love my family.",tone:"violet",theme:"我的家人",score:89,tip:"三个音节读得很有节奏！"},
 {word:"book",phonetic:"/bʊk/",zh:"书",emoji:"📚",bubble:"Read!",sentence:"This is my book.",tone:"violet",theme:"快乐课堂",score:93,tip:"短元音 /ʊ/ 很准确！"},
 {word:"pen",phonetic:"/pen/",zh:"笔",emoji:"✏️",bubble:"Write!",sentence:"I have a pen.",tone:"yellow",theme:"快乐课堂",score:94,tip:"每个音都很清楚！"},
 {word:"bag",phonetic:"/bæɡ/",zh:"书包",emoji:"🎒",bubble:"Ready!",sentence:"My bag is purple.",tone:"coral",theme:"快乐课堂",score:91,tip:"结尾的 /g/ 音很棒！"},
 {word:"school",phonetic:"/skuːl/",zh:"学校",emoji:"🏫",bubble:"Let’s go!",sentence:"I go to school.",tone:"mint",theme:"快乐课堂",score:90,tip:"辅音组合 /sk/ 读得很好！"}
];
const key="sprout-english-v2";
function dayNumber(date:string){return Math.floor((new Date(`${date}T12:00:00`).getTime()-new Date("2026-01-01T12:00:00").getTime())/86400000)}
function isoDate(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}

function WritingPad({word,onSpeak,onComplete}:{word:string;onSpeak:()=>void;onComplete:()=>void}){
 const canvas=useRef<HTMLCanvasElement|null>(null), drawing=useRef(false), history=useRef<ImageData[]>([]); const [mode,setMode]=useState<"trace"|"free">("trace"); const [hasInk,setHasInk]=useState(false);
 function ctx(){return canvas.current?.getContext("2d")||null}
 function point(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)*(e.currentTarget.width/r.width),y:(e.clientY-r.top)*(e.currentTarget.height/r.height)}}
 function down(e:React.PointerEvent<HTMLCanvasElement>){const c=ctx();if(!c)return;e.currentTarget.setPointerCapture(e.pointerId);const p=point(e);c.beginPath();c.moveTo(p.x,p.y);c.lineWidth=10;c.lineCap="round";c.lineJoin="round";c.strokeStyle="#7258d8";drawing.current=true}
 function move(e:React.PointerEvent<HTMLCanvasElement>){if(!drawing.current)return;const c=ctx();if(!c)return;const p=point(e);c.lineTo(p.x,p.y);c.stroke()}
 function up(){if(!drawing.current||!canvas.current)return;drawing.current=false;history.current.push(ctx()!.getImageData(0,0,canvas.current.width,canvas.current.height));setHasInk(true)}
 function clear(){ctx()?.clearRect(0,0,canvas.current!.width,canvas.current!.height);history.current=[];setHasInk(false)}
 function undo(){history.current.pop();const c=ctx();if(!c||!canvas.current)return;c.clearRect(0,0,canvas.current.width,canvas.current.height);const last=history.current.at(-1);if(last)c.putImageData(last,0,0);setHasInk(!!last)}
 useEffect(()=>{clear()},[word,mode]);
 return <section className="writing-panel"><div className="writing-head"><div><b>✍️ 写一写：{word}</b><small>用手指、触控笔或鼠标书写</small></div><div className="mode-tabs"><button className={mode==="trace"?"selected":""} onClick={()=>setMode("trace")}>描红</button><button className={mode==="free"?"selected":""} onClick={()=>setMode("free")}>自由写</button></div></div><div className="canvas-wrap">{mode==="trace"&&<span>{word}</span>}<canvas ref={canvas} width="900" height="260" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/></div><div className="writing-actions"><button onClick={onSpeak}>🔊 听发音</button><button onClick={undo}>↶ 撤销</button><button onClick={clear}>清除</button><button className="finish-write" disabled={!hasInk} onClick={onComplete}>完成书写 ⭐</button></div></section>
}

export default function Home(){
 const today=isoDate(new Date()); const [date,setDate]=useState(today); const [amount,setAmount]=useState(3); const [current,setCurrent]=useState(0); const [done,setDone]=useState<Record<string,string[]>>({}); const [recording,setRecording]=useState(false); const [result,setResult]=useState(false); const [settings,setSettings]=useState(false); const [writing,setWriting]=useState(false); const [writeDone,setWriteDone]=useState<Record<string,string[]>>({}); const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||"{}");setDone(saved.done||{});setWriteDone(saved.writeDone||{});setAmount(saved.amount||3)}catch{}},[]);
 useEffect(()=>{localStorage.setItem(key,JSON.stringify({done,writeDone,amount}))},[done,writeDone,amount]);
 const lesson=useMemo(()=>{const n=Math.max(0,dayNumber(date));const start=(n*amount)%bank.length;const fresh=Array.from({length:amount},(_,i)=>bank[(start+i)%bank.length]);const learned=new Set(Object.values(done).flat());if(n%3===0&&learned.size&&fresh.length>2){const review=bank.find(w=>learned.has(w.word)&&!fresh.some(x=>x.word===w.word));if(review)fresh[fresh.length-1]={...review,theme:`复习 · ${review.theme}`}}return fresh},[date,amount,done]);
 useEffect(()=>{setCurrent(0);setResult(false);setRecording(false);setWriting(false)},[date,amount]);
 const item=lesson[current]||bank[0], completed=done[date]||[], complete=lesson.filter(w=>completed.includes(w.word)).length;
 function speak(text:string){if(!("speechSynthesis" in window))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=.72;u.pitch=1.08;speechSynthesis.speak(u)}
 async function practice(){setResult(false);setRecording(true);let stream:MediaStream|undefined;try{stream=await navigator.mediaDevices?.getUserMedia({audio:true})}catch{}timer.current=setTimeout(()=>{stream?.getTracks().forEach(t=>t.stop());setRecording(false);setResult(true);setDone(x=>({...x,[date]:Array.from(new Set([...(x[date]||[]),item.word]))}))},2200)}
 function changeDay(step:number){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+step);setDate(isoDate(d))}
 const label=date===today?"今天":new Date(`${date}T12:00:00`).toLocaleDateString("zh-CN",{month:"short",day:"numeric"});
 return <main>
  <header className="topbar"><div className="brand"><span className="brand-mark">A</span><span><b>小芽英语</b><small>和小芽一起开口说</small></span></div><div className="date-nav"><button onClick={()=>changeDay(-1)}>‹</button><b>{label}</b><button onClick={()=>changeDay(1)}>›</button></div><div className="today"><span>本日学习</span><b>{complete} / {lesson.length}</b><div className="mini-progress"><i style={{width:`${complete/lesson.length*100}%`}}/></div></div><button className="parent" onClick={()=>setSettings(!settings)}>⚙️ <span>家长设置</span></button></header>
  {settings&&<section className="settings"><div><b>每日学习数量</b><small>建议初学者每天 3 个词</small></div>{[3,4,5].map(n=><button key={n} className={amount===n?"selected":""} onClick={()=>setAmount(n)}>{n} 个</button>)}<button className="close" onClick={()=>setSettings(false)}>完成</button></section>}
  <section className="hero"><div><p className="eyebrow">DAY {String(Math.max(1,dayNumber(date)+1)).padStart(2,"0")} · {lesson[0]?.theme}</p><h1>你好，小小探险家！<br/><span>{date===today?"今天":"这一天"}学 {lesson.length} 个单词</span></h1><p className="subtitle">每天一点点，听一听，再勇敢地说出来。</p></div><div className="mascot"><span>⭐</span><div>Hi!</div></div></section>
  <section className="workspace"><nav className="word-list"><p>{label}的单词</p>{lesson.map((w,i)=><button key={`${w.word}-${i}`} onClick={()=>{setCurrent(i);setResult(false)}} className={`word-tab ${i===current?"active":""}`}><span className={`tab-emoji ${w.tone}`}>{w.emoji}</span><span><b>{w.word}</b><small>{w.zh}{w.theme.startsWith("复习")?" · 复习":""}</small></span>{completed.includes(w.word)?<i className="done">✓</i>:<i className="arrow">›</i>}</button>)}<div className="streak"><span>🔥</span><p><b>已积累 {new Set(Object.values(done).flat()).size} 个单词</b><small>学习记录保存在这台设备</small></p></div></nav>
  <article className="lesson-card"><div className="step-line"><span className="on">1 听一听</span><i/><span className={recording||result?"on":""}>2 读一读</span><i/><span className={writing?"on":""}>3 写一写</span><i/><span className={result||writeDone[date]?.includes(item.word)?"on":""}>4 得星星</span></div><div className={`picture ${item.tone}`}><span>{item.emoji}</span><div className="bubble">{item.bubble}</div></div><div className="word-heading"><h2>{item.word}</h2><p>{item.phonetic} · {item.zh}</p></div><div className="skill-buttons"><button className="listen" onClick={()=>speak(item.word)}><span>🔊</span><b>听单词发音</b><small>点我听一听</small></button><button className={`write-button ${writing?"active":""}`} onClick={()=>setWriting(!writing)}><span>✍️</span><b>写一写</b><small>{writeDone[date]?.includes(item.word)?"已完成":"描红或自由写"}</small></button></div><p className="example"><span>例句</span> {item.sentence} <button onClick={()=>speak(item.sentence)}>🔈</button></p>
  {writing&&<WritingPad word={item.word} onSpeak={()=>speak(item.word)} onComplete={()=>{setWriteDone(x=>({...x,[date]:Array.from(new Set([...(x[date]||[]),item.word]))}));setWriting(false)}}/>}
  {!result?<div className={`practice ${recording?"is-recording":""}`}><div className="waves"><i/><i/><i/><i/><i/></div><button onClick={practice}><span>🎙️</span></button><div className="practice-copy"><b>{recording?"正在听你读…":"轮到你啦！"}</b><small>{recording?`大声读：${item.word}`:"点击麦克风，大声读出单词"}</small></div></div>:<div className="result"><div className="score"><b>{item.score}</b><span>分</span></div><div><h3>太棒啦！ ⭐</h3><p>{item.tip}</p><small>演示评分 · 正式版将接入音素级评测</small></div><button onClick={practice}>再读一次</button></div>}
  <div className="next-row"><span>本日获得 <b>{complete*2} ⭐</b></span><button onClick={()=>{setCurrent((current+1)%lesson.length);setResult(false)}}>{current===lesson.length-1?"回到第一个":"下一个单词"} <b>→</b></button></div></article></section>
  <footer><span>💡</span><p><b>智能复习</b> 每隔几天，课程会自动加入一个学过的单词；更换设备时学习记录不会自动同步。</p></footer>
 </main>
}
