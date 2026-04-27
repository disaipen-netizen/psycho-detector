import { useState, useEffect, useCallback, useRef } from "react";

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function Noise() {
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:.035,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>;
}
function ScanLine() {
  return (<><div style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#00ffcc55,transparent)",animation:"scan 2.6s linear infinite",pointerEvents:"none",zIndex:10}}/><style>{`@keyframes scan{0%{top:-4px}100%{top:110%}}`}</style></>);
}
function toBase64(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
}

// ─── Живой счётчик ────────────────────────────────────────────────────────────
function LiveCounter() {
  const [count,setCount]=useState(14823);
  useEffect(()=>{ const tick=()=>{ setCount(c=>c+Math.floor(Math.random()*3)+1); setTimeout(tick,8000+Math.random()*12000); }; const t=setTimeout(tick,4000); return()=>clearTimeout(t); },[]);
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#00ffcc0a",border:"1px solid #00ffcc22",borderRadius:20,padding:"6px 14px",marginBottom:20}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:"#00ffcc",boxShadow:"0 0 8px #00ffcc",display:"inline-block",animation:"pdpulse 1.5s ease infinite"}}/>
      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc88"}}>
        <span style={{color:"#00ffcc",fontWeight:700}}>{count.toLocaleString("ru")}</span> переписок проанализировано
      </span>
      <style>{`@keyframes pdpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ─── Таймер срочности ─────────────────────────────────────────────────────────
function UrgencyTimer() {
  const [secs,setSecs]=useState(24*60*60);
  useEffect(()=>{ const id=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000); return()=>clearInterval(id); },[]);
  const h=String(Math.floor(secs/3600)).padStart(2,"0");
  const m=String(Math.floor((secs%3600)/60)).padStart(2,"0");
  const s=String(secs%60).padStart(2,"0");
  const urgent=secs<3600;
  return (
    <div style={{background:urgent?"#ff2d7810":"#ffffff05",border:`1px solid ${urgent?"#ff2d7855":"#ffffff11"}`,borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:urgent?"#ff2d78":"#444"}}>⏳ Результат хранится:</span>
      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:16,fontWeight:700,color:urgent?"#ff2d78":"#888",letterSpacing:2}}>{h}:{m}:{s}</span>
    </div>
  );
}

// ─── Share Card ───────────────────────────────────────────────────────────────
function ShareCard({ data, onClose }) {
  const canvasRef=useRef(); const [ready,setReady]=useState(false);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); const W=360,H=640;
    canvas.width=W; canvas.height=H;
    ctx.fillStyle="#080810"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#00ffcc08"; ctx.lineWidth=1;
    for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.textAlign="center";
    ctx.fillStyle="#00ffcc55"; ctx.font="bold 11px monospace"; ctx.fillText("PSYCHO DETECTOR v2.1",W/2,48);
    ctx.fillStyle="#fff"; ctx.font="bold 26px sans-serif"; ctx.fillText("Кто он на самом деле?",W/2,90);
    ctx.fillStyle="#666"; ctx.font="15px sans-serif"; ctx.fillText(data.name,W/2,116);
    const toxColor=data.toxicity>70?"#ff2d78":data.toxicity>40?"#ffaa00":"#00ffcc";
    ctx.fillStyle=toxColor; ctx.font="bold 96px sans-serif"; ctx.fillText(`${data.toxicity}%`,W/2,238);
    ctx.fillStyle="#444"; ctx.font="11px monospace"; ctx.fillText("УРОВЕНЬ ТОКСИЧНОСТИ",W/2,263);
    ctx.strokeStyle="#ffffff11"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(40,286); ctx.lineTo(W-40,286); ctx.stroke();
    ctx.textAlign="left"; ctx.fillStyle="#fff"; ctx.font="24px sans-serif"; ctx.fillText(data.psychotype.icon,40,330);
    ctx.fillStyle=toxColor; ctx.font="bold 17px sans-serif"; ctx.fillText(data.psychotype.name,76,330);
    ctx.fillStyle="#666"; ctx.font="12px sans-serif"; ctx.textAlign="center";
    const words=data.psychotype.description.split(" "); let line="",ly=358;
    for(const w of words){ const t=line+w+" "; if(ctx.measureText(t).width>W-80){ctx.fillText(line,W/2,ly);line=w+" ";ly+=18;}else line=t; }
    ctx.fillText(line,W/2,ly);
    if(data.manipulation_techniques?.length){ctx.fillStyle="#ff2d7888";ctx.font="10px monospace";ctx.fillText(data.manipulation_techniques.slice(0,3).join(" · "),W/2,ly+32);}
    ctx.fillStyle="#00ffcc15"; ctx.beginPath(); ctx.roundRect(40,H-118,W-80,78,12); ctx.fill();
    ctx.strokeStyle="#00ffcc44"; ctx.stroke();
    ctx.fillStyle="#00ffcc"; ctx.font="bold 14px sans-serif"; ctx.fillText("Проверь своего собеседника",W/2,H-90);
    ctx.fillStyle="#00ffcc77"; ctx.font="12px monospace"; ctx.fillText("psycho-detector.app",W/2,H-64);
    setReady(true);
  },[data]);
  const handleDownload=()=>{ canvasRef.current.toBlob(blob=>{ const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download="psycho-result.png";a.click(); URL.revokeObjectURL(url); }); };
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0d0d1a",borderRadius:16,padding:20,maxWidth:400,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc",letterSpacing:2}}>КАРТОЧКА ДЛЯ STORY</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#444",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <canvas ref={canvasRef} style={{width:"100%",borderRadius:10,display:"block"}}/>
        <button onClick={handleDownload} disabled={!ready} style={{width:"100%",marginTop:14,background:"linear-gradient(135deg,#00ffcc,#00cc99)",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#000",cursor:"pointer",letterSpacing:1}}>⬇ Скачать и поделиться</button>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#333",textAlign:"center",marginTop:10}}>Сохрани → загрузи в Stories</p>
      </div>
    </div>
  );
}

// ─── Gauge & TraitBar ─────────────────────────────────────────────────────────
function ToxicGauge({ value }) {
  const [display,setDisplay]=useState(0); const r=54,circ=2*Math.PI*r;
  const color=value>70?"#ff2d78":value>40?"#ffaa00":"#00ffcc";
  useEffect(()=>{ let start=null; const step=ts=>{ if(!start)start=ts; const p=Math.min((ts-start)/1200,1); setDisplay(Math.round(p*value)); if(p<1)requestAnimationFrame(step); }; requestAnimationFrame(step); },[value]);
  return (
    <svg width={140} height={140} style={{overflow:"visible"}}>
      <defs><filter id="glow2"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx={70} cy={70} r={r} fill="none" stroke="#1a1a2e" strokeWidth={10}/>
      <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={circ-(circ*display/100)} strokeLinecap="round" transform="rotate(-90 70 70)" filter="url(#glow2)" style={{transition:"stroke .3s"}}/>
      <text x={70} y={65} textAnchor="middle" fill={color} style={{fontFamily:"'Rajdhani',sans-serif",fontSize:28,fontWeight:700}}>{display}%</text>
      <text x={70} y={84} textAnchor="middle" fill="#555" style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2}}>ТОКСИЧНОСТЬ</text>
    </svg>
  );
}
function TraitBar({ label, value, color, delay=0 }) {
  const [w,setW]=useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setW(value*10),delay); return()=>clearTimeout(t); },[value,delay]);
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#888"}}><span>{label}</span><span style={{color}}>{value}/10</span></div>
      <div style={{height:4,background:"#1a1a2e",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:color,borderRadius:2,transition:"width 0.8s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${color}`}}/></div>
    </div>
  );
}

// ─── 🆕 ОНБОРДИНГ — экран инструкции ─────────────────────────────────────────
const ONBOARDING_STEPS = [
  { icon:"📸", title:"Загрузи скриншот", desc:"Сделай скриншот переписки или скопируй текст сообщений" },
  { icon:"🎤", title:"Или голосовое", desc:"Запиши или загрузи голосовое сообщение — мы расшифруем и проанализируем" },
  { icon:"🧠", title:"ИИ анализирует", desc:"Нейросеть определит психотип, манипуляции и скрытые намерения" },
  { icon:"🔓", title:"Получи результат", desc:"Базовый анализ бесплатно. Полный разбор — всего за 1$" },
];

function ScreenOnboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,opacity:.05,backgroundImage:"linear-gradient(#00ffcc 1px,transparent 1px),linear-gradient(90deg,#00ffcc 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

      <div style={{zIndex:1,textAlign:"center",maxWidth:340,width:"100%"}}>
        {/* Logo */}
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:5,color:"#00ffcc88",marginBottom:32}}>PSYCHO DETECTOR</p>

        {/* Card */}
        <div style={{background:"#0d0d1a",border:"1px solid #00ffcc22",borderRadius:20,padding:"40px 28px",marginBottom:28,minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          <div style={{fontSize:56,marginBottom:20}}>{current.icon}</div>
          <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:24,color:"#fff",margin:"0 0 12px"}}>{current.title}</h2>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#666",lineHeight:1.5,margin:0}}>{current.desc}</p>
          <ScanLine/>
        </div>

        {/* Dots */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>
          {ONBOARDING_STEPS.map((_,i)=>(
            <div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?"#00ffcc":i<step?"#00ffcc55":"#222",transition:"all .3s"}}/>
          ))}
        </div>

        {/* Buttons */}
        <button onClick={()=>isLast?onDone():setStep(s=>s+1)} style={{width:"100%",background:isLast?"linear-gradient(135deg,#00ffcc,#00cc99)":"linear-gradient(135deg,#00ffcc22,#00ffcc11)",border:`1px solid ${isLast?"#00ffcc":"#00ffcc44"}`,borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:17,color:isLast?"#000":"#00ffcc",cursor:"pointer",letterSpacing:1,marginBottom:10,transition:"all .3s"}}>
          {isLast?"🚀 Начать анализ":"Далее →"}
        </button>
        {!isLast&&(
          <button onClick={onDone} style={{background:"none",border:"none",fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#333",cursor:"pointer",letterSpacing:2}}>ПРОПУСТИТЬ</button>
        )}
      </div>
    </div>
  );
}

// ─── 🆕 ПОДДЕРЖКА — кнопка и модалка ─────────────────────────────────────────
function SupportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:20,right:20,zIndex:50,width:44,height:44,borderRadius:"50%",background:"#0d0d1a",border:"1px solid #00ffcc33",color:"#00ffcc",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px #00ffcc22"}}>?</button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:20}}>
          <div style={{background:"#0d0d1a",border:"1px solid #00ffcc22",borderRadius:"16px 16px 16px 16px",padding:24,width:"100%",maxWidth:440}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <span style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:20,color:"#fff"}}>Помощь и поддержка</span>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#444",fontSize:22,cursor:"pointer"}}>✕</button>
            </div>

            {[
              { icon:"💬", label:"Написать в поддержку", sub:"Ответим в течение часа", color:"#00ffcc", href:"https://t.me/psycho_support_bot" },
              { icon:"📖", label:"Инструкция по использованию", sub:"Как загружать скриншоты и голосовые", color:"#00ffcc", action:"onboarding" },
              { icon:"🐛", label:"Сообщить об ошибке", sub:"Расскажи что пошло не так", color:"#ffaa00", href:"https://t.me/psycho_support_bot?start=bug" },
              { icon:"💡", label:"Предложить идею", sub:"Мы читаем каждое сообщение", color:"#888", href:"https://t.me/psycho_support_bot?start=idea" },
            ].map((item,i)=>(
              <a key={i} href={item.href||"#"} target="_blank" rel="noreferrer"
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:"1px solid #ffffff08",textDecoration:"none",cursor:"pointer"}}>
                <span style={{fontSize:24}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:16,color:item.color}}>{item.label}</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",marginTop:2}}>{item.sub}</div>
                </div>
                <span style={{color:"#333",fontSize:16}}>›</span>
              </a>
            ))}

            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#2a2a3a",textAlign:"center",marginTop:16}}>PSYCHO DETECTOR v2.1 · psycho-detector.app</p>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Screen 1: Welcome ────────────────────────────────────────────────────────
function ScreenWelcome({ onAnalyze }) {
  const [hover,setHover]=useState(false);
  const [mode,setMode]=useState("image"); // image | text | voice
  const [text,setText]=useState("");
  const [pulse,setPulse]=useState(false);
  const [loading,setLoading]=useState(false);
  const [recording,setRecording]=useState(false);
  const [audioBlob,setAudioBlob]=useState(null);
  const [audioURL,setAudioURL]=useState(null);
  const fileRef=useRef();
  const audioRef=useRef();
  const mediaRef=useRef();

  useEffect(()=>{ const id=setInterval(()=>setPulse(p=>!p),1800); return()=>clearInterval(id); },[]);

  const handleFile=async e=>{ const file=e.target.files[0]; if(!file)return; setLoading(true); const b64=await toBase64(file); onAnalyze({image:b64}); };

  // 🆕 Голосовая запись
  const startRecording=async()=>{
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream); mediaRef.current=mr;
      const chunks=[];
      mr.ondataavailable=e=>chunks.push(e.data);
      mr.onstop=()=>{
        const blob=new Blob(chunks,{type:"audio/webm"});
        setAudioBlob(blob); setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t=>t.stop());
      };
      mr.start(); setRecording(true);
    } catch(e){ alert("Нет доступа к микрофону"); }
  };

  const stopRecording=()=>{ mediaRef.current?.stop(); setRecording(false); };

  const handleVoiceFile=async e=>{ const file=e.target.files[0]; if(!file)return; setAudioBlob(file); setAudioURL(URL.createObjectURL(file)); };

  const analyzeVoice=async()=>{
    if(!audioBlob) return; setLoading(true);
    const b64=await toBase64(audioBlob);
    onAnalyze({audio:b64, audioType: audioBlob.type||"audio/webm"});
  };

  const MODES=[
    {id:"image", icon:"📸", label:"Скриншот"},
    {id:"text",  icon:"✏️", label:"Текст"},
    {id:"voice", icon:"🎤", label:"Голосовое"},
  ];

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 24px 80px",position:"relative"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,opacity:.05,backgroundImage:"linear-gradient(#00ffcc 1px,transparent 1px),linear-gradient(90deg,#00ffcc 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

      {/* Eye */}
      <div style={{width:90,height:90,borderRadius:"50%",position:"relative",background:"radial-gradient(circle at 40% 40%,#0d1f2d,#050510)",border:"1.5px solid #00ffcc44",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,zIndex:1,boxShadow:pulse?"0 0 40px #00ffcc55":"0 0 20px #00ffcc22",transition:"box-shadow 1.8s ease"}}>
        <svg width={46} height={28} viewBox="0 0 52 32"><ellipse cx={26} cy={16} rx={25} ry={15} fill="none" stroke="#00ffcc" strokeWidth={1.5}/><circle cx={26} cy={16} r={8} fill="#00ffcc22" stroke="#00ffcc" strokeWidth={1.5}/><circle cx={26} cy={16} r={3.5} fill="#00ffcc"/><circle cx={28} cy={14} r={1.2} fill="#fff" opacity={.7}/></svg>
        <ScanLine/>
      </div>

      <div style={{textAlign:"center",zIndex:1,maxWidth:360,width:"100%"}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:5,color:"#00ffcc88",marginBottom:14}}>PSYCHO DETECTOR v2.1</p>
        <LiveCounter/>
        <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:40,lineHeight:1.05,margin:"0 0 12px",color:"#fff",letterSpacing:-1}}>Кто он<br/><span style={{color:"#00ffcc"}}>на самом</span><br/>деле?</h1>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#666",lineHeight:1.5,margin:"0 0 24px"}}>Загрузи скриншот, текст или голосовое — нейросеть раскроет психотип и манипуляции</p>

        {/* Mode toggle — 3 вкладки */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:"#111118",border:"1px solid #222",borderRadius:20,padding:"4px"}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,background:mode===m.id?"#00ffcc":"transparent",color:mode===m.id?"#000":"#555",border:"none",borderRadius:14,padding:"7px 0",fontFamily:"'Share Tech Mono',monospace",fontSize:10,cursor:"pointer",fontWeight:mode===m.id?700:400,transition:"all .2s"}}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* ── Скриншот ── */}
        {mode==="image"&&(
          <><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          <div onClick={()=>!loading&&fileRef.current.click()} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
            style={{border:`2px dashed ${hover?"#00ffcc":"#00ffcc44"}`,borderRadius:16,padding:"32px 24px",cursor:loading?"wait":"pointer",background:hover?"#00ffcc08":"transparent",transition:"all .3s",position:"relative",overflow:"hidden"}}>
            <div style={{fontSize:32,marginBottom:8}}>{loading?"⏳":"⬆"}</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:17,color:hover?"#00ffcc":"#fff",transition:"color .3s"}}>{loading?"Загружаем...":"Загрузить скриншот"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#444",marginTop:4}}>JPG, PNG — из галереи</div>
            {hover&&<ScanLine/>}
          </div></>
        )}

        {/* ── Текст ── */}
        {mode==="text"&&(
          <><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Вставь текст переписки сюда..."
            style={{width:"100%",minHeight:130,background:"#0d0d1a",border:"1px solid #00ffcc33",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ccc",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
          <button onClick={()=>text.trim().length>=20&&onAnalyze({text})} disabled={text.length<20}
            style={{width:"100%",marginTop:10,background:text.length>=20?"linear-gradient(135deg,#00ffcc22,#00ffcc11)":"#111",border:`1px solid ${text.length>=20?"#00ffcc66":"#222"}`,borderRadius:10,padding:"13px",cursor:text.length>=20?"pointer":"not-allowed",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:text.length>=20?"#00ffcc":"#333",transition:"all .3s"}}>
            🔍 Анализировать
          </button></>
        )}

        {/* ── 🆕 Голосовое ── */}
        {mode==="voice"&&(
          <div style={{background:"#0d0d1a",border:"1px solid #00ffcc22",borderRadius:16,padding:20}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",letterSpacing:2,margin:"0 0 16px"}}>ЗАПИШИ ИЛИ ЗАГРУЗИ ГОЛОСОВОЕ</p>

            {/* Кнопка записи */}
            <button onClick={recording?stopRecording:startRecording}
              style={{width:"100%",background:recording?"linear-gradient(135deg,#ff2d78,#cc0055)":"linear-gradient(135deg,#00ffcc22,#00ffcc11)",border:`1px solid ${recording?"#ff2d78":"#00ffcc44"}`,borderRadius:12,padding:"18px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:17,color:recording?"#fff":"#00ffcc",cursor:"pointer",marginBottom:12,letterSpacing:1,transition:"all .3s",animation:recording?"recpulse 1s ease infinite":"none"}}>
              {recording?"⏹ Остановить запись":"🎤 Начать запись"}
            </button>
            <style>{`@keyframes recpulse{0%,100%{box-shadow:0 0 0 0 #ff2d7855}50%{box-shadow:0 0 0 12px transparent}}`}</style>

            {/* Или загрузить файл */}
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#333",margin:"0 0 10px",textAlign:"center"}}>— или —</p>
            <input ref={audioRef} type="file" accept="audio/*" style={{display:"none"}} onChange={handleVoiceFile}/>
            <button onClick={()=>audioRef.current.click()} style={{width:"100%",background:"transparent",border:"1px dashed #333",borderRadius:10,padding:"12px",fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#555",cursor:"pointer",marginBottom:16}}>
              📁 Загрузить аудио файл
            </button>

            {/* Превью записи */}
            {audioURL&&(
              <div style={{marginBottom:16}}>
                <audio controls src={audioURL} style={{width:"100%",borderRadius:8}}/>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#00ffcc88",textAlign:"center",marginTop:8}}>✓ Аудио готово к анализу</p>
              </div>
            )}

            <button onClick={analyzeVoice} disabled={!audioBlob||loading}
              style={{width:"100%",background:audioBlob?"linear-gradient(135deg,#00ffcc22,#00ffcc11)":"#111",border:`1px solid ${audioBlob?"#00ffcc66":"#222"}`,borderRadius:10,padding:"13px",cursor:audioBlob?"pointer":"not-allowed",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:audioBlob?"#00ffcc":"#333",transition:"all .3s"}}>
              {loading?"Анализируем...":"🔍 Анализировать голосовое"}
            </button>

            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#2a2a3a",marginTop:12,lineHeight:1.6}}>
              Поддерживаются MP3, OGG, M4A, WebM.<br/>Whisper AI расшифрует и проанализирует.
            </p>
          </div>
        )}

        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#2a2a3a",marginTop:16}}>ПЕРВЫЙ АНАЛИЗ БЕСПЛАТНО · ДАННЫЕ НЕ СОХРАНЯЮТСЯ</p>
      </div>
    </div>
  );
}

// ─── Screen 2: Scanning ───────────────────────────────────────────────────────
const STEPS=["Обрабатываем входящие данные...","Изучаем синтаксис и тональность...","Ищем скрытый газлайтинг...","Сопоставляем с базой психотипов...","Выявляем манипулятивные паттерны...","Формируем психологический профиль..."];

function ScreenScanning({ isVoice }) {
  const [step,setStep]=useState(0); const [progress,setProgress]=useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setProgress(p=>p>=95?p:p+0.7),50); return()=>clearInterval(iv); },[]);
  useEffect(()=>{ setStep(Math.min(STEPS.length-1,Math.floor(progress/(100/STEPS.length)))); },[progress]);
  const voiceSteps=["Расшифровываем аудио через Whisper AI...","Анализируем тональность голоса...","Ищем скрытый газлайтинг...","Сопоставляем с базой психотипов...","Выявляем манипулятивные паттерны...","Формируем психологический профиль..."];
  const currentSteps=isVoice?voiceSteps:STEPS;
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,position:"relative"}}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes spinr{from{transform:rotate(0)}to{transform:rotate(-360deg)}} @keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
      <div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid #00ffcc33",animation:"spin 4s linear infinite"}}/>
        <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"1px dashed #ff2d7833",animation:"spinr 3s linear infinite"}}/>
        <div style={{width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,#00ffcc18,transparent 70%)",border:"1.5px solid #00ffcc66",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 30px #00ffcc33"}}>
          <span style={{fontSize:38}}>{isVoice?"🎤":"🔍"}</span>
        </div>
      </div>
      <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,color:"#00ffcc",marginTop:36,animation:"blink 1.2s ease infinite",textAlign:"center",maxWidth:280}}>{currentSteps[step]}</p>
      <div style={{width:"100%",maxWidth:320,marginTop:24}}>
        <div style={{height:3,background:"#111",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#00ffcc,#ff2d78)",borderRadius:2,transition:"width .1s linear",boxShadow:"0 0 10px #00ffcc"}}/></div>
        <div style={{textAlign:"right",marginTop:6,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#333"}}>{Math.round(progress)}%</div>
      </div>
    </div>
  );
}

// ─── Screen 3: Result ─────────────────────────────────────────────────────────
function ScreenResult({ data, onReset }) {
  const [unlocked,setUnlocked]=useState(false);
  const [showResp,setShowResp]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const toxColor=data.toxicity>70?"#ff2d78":data.toxicity>40?"#ffaa00":"#00ffcc";
  return (
    <div style={{minHeight:"100vh",padding:"28px 20px 100px",maxWidth:480,margin:"0 auto"}}>
      {showShare&&<ShareCard data={data} onClose={()=>setShowShare(false)}/>}
      <div style={{textAlign:"center",marginBottom:18}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:4,color:"#00ffcc88",margin:"0 0 6px"}}>АНАЛИЗ ЗАВЕРШЁН</p>
        <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:26,color:"#fff",margin:"0 0 8px"}}>{data.name} — профиль готов</h2>
        {data.summary&&<p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#666",margin:0,lineHeight:1.5}}>{data.summary}</p>}
      </div>
      <UrgencyTimer/>
      <div style={{background:"#0d0d1a",border:`1px solid ${toxColor}44`,borderRadius:16,padding:"24px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:20,boxShadow:`0 0 40px ${toxColor}11`}}>
        <ToxicGauge value={data.toxicity}/>
        <div style={{flex:1}}>
          <div style={{fontSize:32,marginBottom:4}}>{data.psychotype.icon}</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,color:toxColor,marginBottom:4}}>{data.psychotype.name}</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#666",lineHeight:1.4}}>{data.psychotype.description}</div>
        </div>
      </div>
      {data.manipulation_techniques?.length>0&&(
        <div style={{marginBottom:14,display:"flex",flexWrap:"wrap",gap:6}}>
          {data.manipulation_techniques.map(t=><span key={t} style={{background:"#ff2d7815",color:"#ff2d78",border:"1px solid #ff2d7833",borderRadius:20,padding:"4px 12px",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:1}}>{t}</span>)}
        </div>
      )}
      <div style={{marginBottom:14}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:3,color:"#333",marginBottom:10}}>УЛИКИ</p>
        {(data.evidence||[]).map((e,i)=>{ const c=i===0?"#ff2d78":"#ffaa00"; return (
          <div key={i} style={{background:"#0d0d1a",border:`1px solid ${c}33`,borderLeft:`3px solid ${c}`,borderRadius:"0 10px 10px 0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,color:c,marginBottom:6}}>"{e.quote}"</div>
            <span style={{background:c+"22",color:c,fontSize:9,fontFamily:"'Share Tech Mono',monospace",padding:"2px 8px",borderRadius:20,letterSpacing:1,display:"inline-block",marginBottom:6}}>{e.label}</span>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#666"}}>{e.explanation}</div>
          </div>
        );})}
      </div>
      <div style={{background:"#0d0d1a",border:"1px solid #ffffff0a",borderRadius:16,padding:"20px",marginBottom:14}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:3,color:"#333",margin:"0 0 16px"}}>ТЁМНЫЕ ЧЕРТЫ</p>
        <TraitBar label="Манипулятивность" value={data.dark_traits?.manipulation||0} color="#ff2d78" delay={0}/>
        <TraitBar label="Эмпатия"          value={data.dark_traits?.empathy||0}      color="#00ffcc" delay={200}/>
        <TraitBar label="Доминирование"    value={data.dark_traits?.dominance||0}    color="#ffaa00" delay={400}/>
      </div>
      {!unlocked?(
        <div style={{background:"linear-gradient(135deg,#1a0d20,#0d0d1a)",border:"1px solid #ff2d7855",borderRadius:16,padding:"24px 20px",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>🔒</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:20,color:"#fff",marginBottom:8}}>Глубокий разбор личности</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#555",marginBottom:20,lineHeight:1.5}}>Главная слабость · Идеальный ответ · Как защититься</div>
          <button onClick={()=>setUnlocked(true)} style={{background:"linear-gradient(135deg,#ff2d78,#ff6b35)",border:"none",borderRadius:10,padding:"14px 32px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#fff",cursor:"pointer",boxShadow:"0 0 30px #ff2d7855",letterSpacing:1}}>⚡ Разблокировать за 1$</button>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#2a2a3a",marginTop:12}}>ОПЛАТА ЧЕРЕЗ TELEGRAM STARS</div>
        </div>
      ):(
        <div style={{background:"#0d0d1a",border:"1px solid #00ffcc33",borderRadius:16,padding:"20px",marginBottom:14}}>
          {data.boundary_violation&&<><p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:3,color:"#00ffcc88",margin:"0 0 8px"}}>НАРУШЕНИЕ ГРАНИЦ</p><p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",lineHeight:1.6,margin:"0 0 18px"}}>🛡️ {data.boundary_violation}</p></>}
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:3,color:"#00ffcc88",margin:"0 0 8px"}}>ГЛАВНАЯ СЛАБОСТЬ</p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ccc",lineHeight:1.6,margin:"0 0 18px"}}>⚠️ {data.main_weakness}</p>
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:3,color:"#00ffcc88",margin:"0 0 10px"}}>ИДЕАЛЬНЫЙ ОТВЕТ</p>
          <button onClick={()=>setShowResp(r=>!r)} style={{width:"100%",background:"#00ffcc11",border:"1px solid #00ffcc44",borderRadius:10,padding:"14px",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#00ffcc",letterSpacing:.5}}>
            {showResp?`💬 ${data.ideal_response}`:"💬 Показать как ответить"}
          </button>
        </div>
      )}
      <button onClick={()=>setShowShare(true)} style={{width:"100%",background:"linear-gradient(135deg,#0d2d1a,#0a1a2d)",border:"1px solid #00ffcc33",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:"#00ffcc",cursor:"pointer",letterSpacing:1,marginBottom:10}}>📤 Поделиться в Story</button>
      <button onClick={onReset} style={{width:"100%",background:"transparent",border:"1px solid #222",borderRadius:12,padding:"11px",fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#333",cursor:"pointer",letterSpacing:2}}>НОВЫЙ АНАЛИЗ</button>
    </div>
  );
}

// ─── 🆕 Error screen с поддержкой ────────────────────────────────────────────
function ScreenError({ message, onReset }) {
  const isApiError = message?.includes("DOCTYPE") || message?.includes("404") || message?.includes("API");
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:24,color:"#ff2d78",marginBottom:10}}>Ошибка анализа</h2>
      <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#555",maxWidth:320,lineHeight:1.6,marginBottom:8}}>{message}</p>

      {isApiError&&(
        <div style={{background:"#ff2d7810",border:"1px solid #ff2d7833",borderRadius:10,padding:"12px 16px",maxWidth:320,marginBottom:20,textAlign:"left"}}>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#ff2d78",margin:"0 0 6px",fontWeight:600}}>Возможная причина:</p>
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#666",margin:0,lineHeight:1.6}}>Не добавлен OPENAI_API_KEY в Vercel.<br/>Settings → Environment Variables → добавь ключ → Redeploy</p>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:300}}>
        <button onClick={onReset} style={{background:"#ff2d7822",border:"1px solid #ff2d7855",borderRadius:10,padding:"12px 28px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#ff2d78",cursor:"pointer"}}>
          🔄 Попробовать снова
        </button>
        <a href="https://t.me/psycho_support_bot" target="_blank" rel="noreferrer"
          style={{background:"#00ffcc11",border:"1px solid #00ffcc33",borderRadius:10,padding:"12px 28px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#00ffcc",textDecoration:"none",display:"block"}}>
          💬 Написать в поддержку
        </a>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("onboarding");
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [isVoice,setIsVoice]=useState(false);

  // Показываем онбординг только первый раз
  useEffect(()=>{
    const seen=localStorage.getItem("pd_onboarding");
    if(seen) setScreen("welcome");
  },[]);

  const handleAnalyze=useCallback(async payload=>{
    setIsVoice(!!payload.audio);
    setScreen("scanning");
    try {
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Неизвестная ошибка");
      setResult(data); setScreen("result");
    } catch(e){ setError(e.message); setScreen("error"); }
  },[]);

  const doneOnboarding=()=>{ localStorage.setItem("pd_onboarding","1"); setScreen("welcome"); };
  const reset=()=>{ setScreen("welcome"); setResult(null); setError(""); };

  return (
    <div style={{background:"#080810",color:"#e0e0e0",minHeight:"100vh",position:"relative",overflowX:"hidden"}}>
      <Noise/>
      {screen==="onboarding" && <ScreenOnboarding onDone={doneOnboarding}/>}
      {screen==="welcome"    && <ScreenWelcome onAnalyze={handleAnalyze}/>}
      {screen==="scanning"   && <ScreenScanning isVoice={isVoice}/>}
      {screen==="result"     && result && <ScreenResult data={result} onReset={reset}/>}
      {screen==="error"      && <ScreenError message={error} onReset={reset}/>}
      {/* Кнопка поддержки видна на всех экранах кроме онбординга */}
      {screen!=="onboarding" && <SupportButton/>}
    </div>
  );
}
