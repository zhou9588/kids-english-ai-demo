"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  { word: "apple", sound: "/ˈæp.əl/", zh: "苹果", emoji: "🍎", color: "coral", sentence: "An apple is red." },
  { word: "cat", sound: "/kæt/", zh: "小猫", emoji: "🐱", color: "violet", sentence: "The cat is cute." },
  { word: "dog", sound: "/dɒɡ/", zh: "小狗", emoji: "🐶", color: "yellow", sentence: "The dog can run." },
];

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [learned, setLearned] = useState<boolean[]>([false, false, false]);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<{ score: number; title: string; tip: string } | null>(null);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = words[current];

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setMessage("当前浏览器不支持语音播放"); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.72;
    utter.pitch = 1.08;
    window.speechSynthesis.speak(utter);
    setMessage("仔细听，再跟我读一遍吧！");
  }

  async function startPractice() {
    setResult(null);
    setMessage("");
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      setRecording(true);
      timer.current = setTimeout(() => {
        stream?.getTracks().forEach((track) => track.stop());
        finishPractice();
      }, 2600);
    } catch {
      setMessage("没有开启麦克风也没关系，先听一听，再点击模拟评分吧。");
      setRecording(true);
      timer.current = setTimeout(finishPractice, 1800);
    }
  }

  function finishPractice() {
    setRecording(false);
    const scores = [92, 88, 95];
    const next = [...learned];
    next[current] = true;
    setLearned(next);
    setResult({ score: scores[current], title: "太棒啦！", tip: current === 0 ? "开头的 /æ/ 音很清楚，再慢慢读一次会更棒。" : current === 1 ? "短短的 /æ/ 音读得很好！" : "结尾的 /g/ 音很有力！" });
  }

  function chooseWord(index: number) {
    if (timer.current) clearTimeout(timer.current);
    setRecording(false);
    setResult(null);
    setMessage("");
    setCurrent(index);
  }

  const complete = learned.filter(Boolean).length;

  return (
    <main>
      <div className="sky-deco star-one">✦</div><div className="sky-deco star-two">✦</div>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">A</span><span><b>小芽英语</b><small>和小芽一起开口说</small></span></div>
        <div className="today"><span>今日学习</span><b>{complete} / {words.length}</b><div className="mini-progress"><i style={{ width: `${(complete / words.length) * 100}%` }} /></div></div>
        <button className="parent" aria-label="家长中心">👨‍👩‍👧 <span>家长中心</span></button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">LESSON 01 · 我的动物朋友</p>
          <h1>你好，小小探险家！<br/><span>今天学 3 个新单词</span></h1>
          <p className="subtitle">先听一听，再勇敢地大声读出来吧。</p>
        </div>
        <div className="mascot" aria-hidden="true"><span>⭐</span><div>Hi!</div></div>
      </section>

      <section className="workspace">
        <nav className="word-list" aria-label="选择单词">
          <p>今天的单词</p>
          {words.map((word, index) => (
            <button key={word.word} onClick={() => chooseWord(index)} className={`word-tab ${index === current ? "active" : ""}`}>
              <span className={`tab-emoji ${word.color}`}>{word.emoji}</span>
              <span><b>{word.word}</b><small>{word.zh}</small></span>
              {learned[index] ? <i className="done">✓</i> : <i className="arrow">›</i>}
            </button>
          ))}
          <div className="streak"><span>🔥</span><p><b>连续学习 1 天</b><small>明天再来，小火苗会长大！</small></p></div>
        </nav>

        <article className="lesson-card">
          <div className="step-line"><span className="on">1 听一听</span><i></i><span className={recording || result ? "on" : ""}>2 读一读</span><i></i><span className={result ? "on" : ""}>3 得星星</span></div>
          <div className={`picture ${item.color}`}><span>{item.emoji}</span><div className="bubble">{current === 0 ? "Yummy!" : current === 1 ? "Meow!" : "Woof!"}</div></div>
          <div className="word-heading"><h2>{item.word}</h2><p>{item.sound} · {item.zh}</p></div>
          <button className="listen" onClick={() => speak(item.word)}><span>🔊</span><b>听单词发音</b><small>点我听一听</small></button>
          <p className="example"><span>例句</span> {item.sentence} <button onClick={() => speak(item.sentence)} aria-label="播放例句">🔈</button></p>

          {!result ? (
            <div className={`practice ${recording ? "is-recording" : ""}`}>
              <div className="waves"><i/><i/><i/><i/><i/></div>
              <button onClick={recording ? finishPractice : startPractice} disabled={false} aria-label={recording ? "结束跟读" : "开始跟读"}><span>🎙️</span></button>
              <div className="practice-copy"><b>{recording ? "正在听你读…" : "轮到你啦！"}</b><small>{recording ? `大声读：${item.word}` : "点击麦克风，大声读出单词"}</small></div>
              {message && <p className="message">{message}</p>}
            </div>
          ) : (
            <div className="result" aria-live="polite">
              <div className="score"><b>{result.score}</b><span>分</span></div>
              <div><h3>{result.title} <span>⭐</span></h3><p>{result.tip}</p><small>演示评分 · 正式版将接入音素级评测</small></div>
              <button onClick={startPractice}>再读一次</button>
            </div>
          )}

          <div className="next-row"><span>本课获得 <b>{complete * 2} ⭐</b></span><button onClick={() => chooseWord((current + 1) % words.length)}>{current === words.length - 1 ? "回到第一个" : "下一个单词"} <b>→</b></button></div>
        </article>
      </section>
      <footer><span>💡</span><p><b>给家长的小提示</b> 每天练习 5–10 分钟就够啦。多鼓励、少纠错，让孩子爱上开口说英语！</p></footer>
    </main>
  );
}
