import { useState, useEffect, useCallback, useRef } from "react";

// --- tiny helpers -------------------------------------------------------------
function Noise() {
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:.035,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>;
}
function ScanLine() {
  return (<><div style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#00ffcc55,transparent)",animation:"scan 2.6s linear infinite",pointerEvents:"none",zIndex:10}}/><style>{`@keyframes scan{0%{top:-4px}100%{top:110%}}`}</style></>);
}
function toBase64(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{
      // Для изображений — сжимаем через canvas
      if(file.type.startsWith("image/")) {
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement("canvas");
          // Максимум 1200px по длинной стороне
          const MAX=1200;
          let w=img.width, h=img.height;
          if(w>MAX||h>MAX){ if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
          canvas.width=w; canvas.height=h;
          const ctx=canvas.getContext("2d");
          ctx.drawImage(img,0,0,w,h);
          const compressed=canvas.toDataURL("image/jpeg",0.7);
          res(compressed.split(",")[1]);
        };
        img.src=r.result;
      } else {
        res(r.result.split(",")[1]);
      }
    };
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

// --- Живой счётчик ------------------------------------------------------------
function LiveCounter() {
  const [count,setCount]=useState(14823);
  useEffect(()=>{
    // Загружаем реальный счётчик с сервера
    fetch("/api/counter").then(r=>r.json()).then(d=>{ if(d.count) setCount(14823+d.count); }).catch(()=>{});
    // Анимация для живости
    const tick=()=>{ setCount(c=>c+Math.floor(Math.random()*2)+1); setTimeout(tick,12000+Math.random()*18000); };
    const t=setTimeout(tick,6000); return()=>clearTimeout(t);
  },[]);
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

// --- Таймер срочности ---------------------------------------------------------
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

// --- Share Card ---------------------------------------------------------------
function ShareCard({ data, onClose }) {
  const canvasRef=useRef();
  const [imgUrl,setImgUrl]=useState(null);
  const [copied,setCopied]=useState(false);

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
    // Конвертируем в img для мобильных
    setImgUrl(canvas.toDataURL("image/png"));
  },[data]);

  const handleShare = async () => {
    // Пробуем Web Share API (работает на мобильных)
    if (navigator.share && imgUrl) {
      try {
        const res = await fetch(imgUrl);
        const blob = await res.blob();
        const file = new File([blob], "psycho-result.png", { type: "image/png" });
        await navigator.share({ files: [file], title: "Psycho Detector", text: `${data.name} — токсичность ${data.toxicity}%` });
        return;
      } catch(e) { /* fallback */ }
    }
    // Fallback — скачать
    if (imgUrl) {
      const a = document.createElement("a");
      a.href = imgUrl; a.download = "psycho-result.png"; a.click();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("t.me/psychodetector_bot/PsychoDetector");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      {/* Скрытый canvas для генерации */}
      <canvas ref={canvasRef} style={{display:"none"}}/>

      <div style={{background:"#0d0d1a",borderRadius:16,padding:20,maxWidth:400,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc",letterSpacing:2}}>КАРТОЧКА ДЛЯ STORY</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#444",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Картинка — на мобильном зажми для сохранения */}
        {imgUrl && (
          <div style={{position:"relative",marginBottom:12}}>
            <img src={imgUrl} alt="Psycho Result"
              style={{width:"100%",borderRadius:10,display:"block"}}/>
    
          </div>
        )}

        {/* Кнопка поделиться (Web Share API) */}
        <button onClick={handleShare} style={{width:"100%",marginBottom:10,background:"linear-gradient(135deg,#00ffcc,#00cc99)",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#000",cursor:"pointer",letterSpacing:1}}>
          Поделиться картинкой
        </button>

        {/* Кнопка скопировать ссылку */}
        <button onClick={handleCopyLink} style={{width:"100%",background:copied?"#00ffcc22":"transparent",border:"1px solid #00ffcc33",borderRadius:10,padding:"11px",fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#00ffcc",cursor:"pointer",transition:"all .3s"}}>
          {copied ? "✓ Ссылка скопирована!" : "Скопировать ссылку на бота"}
        </button>


      </div>
    </div>
  );
}

// --- Gauge & TraitBar ---------------------------------------------------------
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
      <text x={70} y={84} textAnchor="middle" fill="#555" style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2}}>ТОКСИЧНОСТЬ</text>
    </svg>
  );
}
function TraitBar({ label, value, color, delay=0 }) {
  const [w,setW]=useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setW(value*10),delay); return()=>clearTimeout(t); },[value,delay]);
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#aaa"}}><span>{label}</span><span style={{color}}>{value}/10</span></div>
      <div style={{height:4,background:"#1a1a2e",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${w}%`,background:color,borderRadius:2,transition:"width 0.8s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${color}`}}/></div>
    </div>
  );
}

// --- 🆕 ОНБОРДИНГ — экран инструкции -----------------------------------------
const ONBOARDING_STEPS = [
  { icon:"📸", title:"Загрузи скриншот", desc:"Сделай скриншот переписки или скопируй текст сообщений" },
  { icon:"🎤", title:"Или голосовое", desc:"Запиши или загрузи голосовое сообщение — мы расшифруем и проанализируем" },
  { icon:"🧠", title:"ИИ анализирует", desc:"Нейросеть определит психотип, манипуляции и скрытые намерения" },
  { icon:"🔓", title:"Получи результат", desc:"Базовый анализ бесплатно. Полный разбор — всего за 1$" },
  { icon:"💡", title:"Важно знать", desc:"Это инструмент для рефлексии, а не диагноз. ИИ анализирует паттерны общения, но не заменяет живого специалиста. При признаках абьюза или насилия — обратись к психологу или на горячую линию помощи.", isDisclaimer:true },
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
        <div style={{background:current.isDisclaimer?"#1a0d1a":"#0d0d1a",border:`1px solid ${current.isDisclaimer?"#ffaa0044":"#00ffcc22"}`,borderRadius:20,padding:"40px 28px",marginBottom:28,minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
          <div style={{fontSize:56,marginBottom:20}}>{current.icon}</div>
          <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:24,color:current.isDisclaimer?"#ffaa00":"#fff",margin:"0 0 12px"}}>{current.title}</h2>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:current.isDisclaimer?15:16,color:current.isDisclaimer?"#bbb":"#888",lineHeight:1.6,margin:0}}>{current.desc}</p>
          {!current.isDisclaimer&&<ScanLine/>}
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
          <button onClick={onDone} style={{background:"none",border:"none",fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#666",cursor:"pointer",letterSpacing:1}}>ПРОПУСТИТЬ</button>
        )}
      </div>
    </div>
  );
}

// --- 🆕 ПОДДЕРЖКА — кнопка и модалка -----------------------------------------
// --- 🆕 ДИСКЛЕЙМЕР В РЕЗУЛЬТАТЕ ---------------------------------------------
function ResultDisclaimer() {
  return (
    <div style={{background:"#1a1a0d",border:"1px solid #ffaa0033",borderRadius:10,padding:"12px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>💡</span>
      <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#aaa",lineHeight:1.5,margin:0}}>
        Это аналитический инструмент, а не диагноз. При серьёзных проблемах обратись к психологу — это нормально просить помощи.
      </p>
    </div>
  );
}

// --- 🆕 КНОПКА "НУЖНА ПОМОЩЬ?" ----------------------------------------------
function HelpButton() {
  const [open,setOpen]=useState(false);
  return (
    <>
      <button onClick={()=>setOpen(true)} style={{position:"fixed",top:14,right:64,zIndex:50,minWidth:56,height:56,borderRadius:28,background:"linear-gradient(135deg,#3d0a0a,#1a0d0d)",border:"2px solid #ff2d78",color:"#ff2d78",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"0 14px",boxShadow:"0 0 25px #ff2d7855",fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>
        <span style={{fontSize:18}}>🆘</span><span>SOS</span>
      </button>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:20}} onClick={()=>setOpen(false)}>
          <div style={{background:"#0d0d1a",border:"1px solid #ff2d7833",borderRadius:16,padding:24,width:"100%",maxWidth:440,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#ff2d78",letterSpacing:3,margin:"0 0 4px"}}>ПОДДЕРЖКА</p>
                <span style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:22,color:"#fff"}}>Нужна помощь?</span>
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#444",fontSize:22,cursor:"pointer"}}>✕</button>
            </div>

            <div style={{background:"#1a0a1a",border:"1px solid #ff2d7833",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#bbb",margin:0,lineHeight:1.5}}>
                Если ты в сложной ситуации — не оставайся один(одна). Эти контакты помогут анонимно и бесплатно.
              </p>
            </div>

            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#888",letterSpacing:2,marginBottom:10}}>КАЗАХСТАН</p>
            <div style={{marginBottom:16}}>
              <div style={{background:"#0a0a14",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,color:"#fff",margin:"0 0 4px"}}>Телефон доверия</p>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#00ffcc",margin:"0 0 4px"}}>150</p>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:"#666",margin:0}}>Анонимно, бесплатно, круглосуточно</p>
              </div>
              <div style={{background:"#0a0a14",borderRadius:10,padding:"12px 14px"}}>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,color:"#fff",margin:"0 0 4px"}}>Кризисная линия</p>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#00ffcc",margin:"0 0 4px"}}>1415</p>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:"#666",margin:0}}>Помощь при насилии</p>
              </div>
            </div>

            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#888",letterSpacing:2,marginBottom:10}}>РОССИЯ</p>
            <div style={{marginBottom:16}}>
              <div style={{background:"#0a0a14",borderRadius:10,padding:"12px 14px"}}>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,color:"#fff",margin:"0 0 4px"}}>Телефон доверия</p>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#00ffcc",margin:"0 0 4px"}}>8-800-2000-122</p>
                <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:"#666",margin:0}}>Анонимно, бесплатно, круглосуточно</p>
              </div>
            </div>

            <div style={{background:"linear-gradient(135deg,#0d1f2d,#0a1a0d)",border:"1px solid #00ffcc33",borderRadius:12,padding:"14px 16px",marginTop:14}}>
              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2,color:"#00ffcc",margin:"0 0 8px"}}>СКОРО</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#fff",margin:"0 0 6px"}}>Консультация с психологом</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#888",margin:"0 0 10px",lineHeight:1.5}}>
                Скоро здесь появятся проверенные специалисты для онлайн-консультаций. Если ты психолог и хочешь сотрудничать — напиши нам.
              </p>
              <a href="https://t.me/psycho_support_bot?start=psycholog" target="_blank" rel="noreferrer" style={{display:"inline-block",background:"#00ffcc22",border:"1px solid #00ffcc44",borderRadius:8,padding:"8px 14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,color:"#00ffcc",textDecoration:"none"}}>
                Я психолог →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- 🆕 ПРОГНОЗ ОТНОШЕНИЙ -----------------------------------------------------
function RelationshipForecast({ toxicity, psychotype }) {
  if(toxicity===undefined) return null;

  let forecast, color, icon;
  if(toxicity < 25) {
    forecast = "Динамика здоровая. Если так продолжать — отношения будут крепнуть, доверие расти. Береги это.";
    color = "#00ffcc"; icon = "🌱";
  } else if(toxicity < 50) {
    forecast = "Есть напряжение, но не критично. Через 3-6 месяцев без изменений вы можете отдалиться. Стоит обсудить что не так открыто.";
    color = "#ffaa00"; icon = "⚖️";
  } else if(toxicity < 75) {
    forecast = "Динамика тревожная. Через 6 месяцев без серьёзных перемен скорее всего — эмоциональное истощение, потеря себя, конфликты будут чаще.";
    color = "#ff8800"; icon = "⚠️";
  } else {
    forecast = "Очень тревожная динамика. Поведение собеседника может усиливаться. Подумай о границах и обратись к специалисту — это серьёзно.";
    color = "#ff2d78"; icon = "🚨";
  }

  return (
    <div style={{background:`linear-gradient(135deg,#0d0d1a,${color}11)`,border:`1px solid ${color}33`,borderRadius:16,padding:"18px 20px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:24}}>{icon}</span>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2,color:color,margin:0}}>ПРОГНОЗ ДИНАМИКИ</p>
      </div>
      <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",lineHeight:1.6,margin:0}}>{forecast}</p>
    </div>
  );
}

// --- 🆕 ЕЖЕДНЕВНЫЙ ИНСАЙТ -----------------------------------------------------
const DAILY_INSIGHTS = [
  { title:"Газлайтинг", text:"Если после разговора ты часто думаешь «может я неправа?» — это может быть признак газлайтинга. Здоровый разговор оставляет ясность, а не сомнения в себе." },
  { title:"Бомбардировка любовью", text:"Резкое идеализирование в начале отношений (грандиозные подарки, постоянное внимание) часто заканчивается обесцениванием. Здоровая любовь развивается постепенно." },
  { title:"Серый камень", text:"Если ты в общении с манипулятором — техника «серый камень». Отвечай нейтрально, без эмоций. Им становится неинтересно манипулировать тем кто не реагирует." },
  { title:"Триангуляция", text:"Когда человек намеренно упоминает других чтобы вызвать ревность или сравнивает тебя с кем-то — это манипулятивный приём, не настоящие чувства." },
  { title:"Эмоциональный шантаж", text:"«Если ты меня любишь, ты сделаешь...» — классическая фраза эмоционального шантажа. Настоящая любовь не требует доказательств через угрозы." },
  { title:"Границы — это нормально", text:"Сказать «нет» близкому человеку — не предательство. Здоровые отношения предполагают что у каждого есть право на личное пространство." },
  { title:"Любовь не должна быть болью", text:"Если отношения постоянно тяжёлые — это не «настоящая любовь». Настоящая любовь — это поддержка и комфорт, а не страдания." },
];

function DailyInsight() {
  const [open,setOpen]=useState(false);
  const today = new Date().getDate();
  const insight = DAILY_INSIGHTS[today % DAILY_INSIGHTS.length];

  return (
    <>
      <div onClick={()=>setOpen(true)} style={{background:"linear-gradient(135deg,#0d1f2d,#1a0d2d)",border:"1px solid #00ffcc33",borderRadius:14,padding:"14px 18px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:22}}>💡</span>
        <div style={{flex:1,textAlign:"left"}}>
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2,color:"#00ffcc88",margin:"0 0 2px"}}>ИНСАЙТ ДНЯ</p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:17,color:"#fff",margin:0}}>{insight.title}</p>
        </div>
        <span style={{color:"#00ffcc",fontSize:18}}>→</span>
      </div>
      {open&&(
        <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setOpen(false)}>
          <div style={{background:"#0d0d1a",border:"1px solid #00ffcc33",borderRadius:16,padding:28,maxWidth:400,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",fontSize:48,marginBottom:14}}>💡</div>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:3,color:"#00ffcc",margin:"0 0 8px",textAlign:"center"}}>ИНСАЙТ ДНЯ</p>
            <h3 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:24,color:"#fff",margin:"0 0 14px",textAlign:"center"}}>{insight.title}</h3>
            <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#bbb",lineHeight:1.6,margin:"0 0 20px",textAlign:"center"}}>{insight.text}</p>
            <button onClick={()=>setOpen(false)} style={{width:"100%",background:"linear-gradient(135deg,#00ffcc,#00cc99)",border:"none",borderRadius:10,padding:"12px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:"#000",cursor:"pointer"}}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// --- 🆕 ТЕСТ "КТО Я В ОТНОШЕНИЯХ" --------------------------------------------
const TEST_QUESTIONS = [
  { q:"Когда партнёр не отвечает на сообщение пару часов, я:", a:[
    {t:"Спокойно занимаюсь своими делами",s:"secure"},
    {t:"Начинаю волноваться и проверять онлайн",s:"anxious"},
    {t:"Мне всё равно, я тоже не всегда отвечаю",s:"avoidant"},
    {t:"Сомневаюсь — то спокойно, то тревожно",s:"disorganized"},
  ]},
  { q:"Если в отношениях конфликт, я обычно:", a:[
    {t:"Стараюсь спокойно обсудить и найти решение",s:"secure"},
    {t:"Эмоционально реагирую, нужны заверения в любви",s:"anxious"},
    {t:"Отстраняюсь, нужно время побыть одному",s:"avoidant"},
    {t:"То ищу близости, то хочу убежать",s:"disorganized"},
  ]},
  { q:"Когда близкий человек делится переживаниями:", a:[
    {t:"Внимательно слушаю и поддерживаю",s:"secure"},
    {t:"Чувствую сильную эмпатию, иногда слишком",s:"anxious"},
    {t:"Не знаю как реагировать, мне неловко",s:"avoidant"},
    {t:"По-разному, зависит от настроения",s:"disorganized"},
  ]},
  { q:"Близость с партнёром для меня:", a:[
    {t:"Комфортна и естественна",s:"secure"},
    {t:"Очень важна, иногда боюсь её потерять",s:"anxious"},
    {t:"Иногда душит, нужно личное пространство",s:"avoidant"},
    {t:"Желанна и пугает одновременно",s:"disorganized"},
  ]},
  { q:"Если партнёр критикует, я:", a:[
    {t:"Спокойно выслушиваю и думаю над словами",s:"secure"},
    {t:"Расстраиваюсь, боюсь что он/она разлюбит",s:"anxious"},
    {t:"Защищаюсь, мне это неприятно",s:"avoidant"},
    {t:"Реагирую остро, потом замыкаюсь",s:"disorganized"},
  ]},
  { q:"После расставания я обычно:", a:[
    {t:"Грущу, но восстанавливаюсь и иду дальше",s:"secure"},
    {t:"Долго не могу отпустить, ищу примирения",s:"anxious"},
    {t:"Быстро переключаюсь, не люблю драм",s:"avoidant"},
    {t:"То отпускаю, то возвращаюсь снова и снова",s:"disorganized"},
  ]},
  { q:"Доверять новому партнёру:", a:[
    {t:"Естественно, если он показывает себя надёжным",s:"secure"},
    {t:"Сложно, постоянно нужны подтверждения",s:"anxious"},
    {t:"Сложно, я предпочитаю не зависеть",s:"avoidant"},
    {t:"Очень сложно, страшно",s:"disorganized"},
  ]},
  { q:"Когда мне грустно, я:", a:[
    {t:"Обращаюсь за поддержкой к близким",s:"secure"},
    {t:"Очень нуждаюсь во внимании",s:"anxious"},
    {t:"Хочу остаться один(одна), справлюсь сам(а)",s:"avoidant"},
    {t:"Не знаю что мне нужно",s:"disorganized"},
  ]},
];

const TEST_RESULTS = {
  secure: {
    name:"Надёжный тип",
    icon:"🌱",
    color:"#00ffcc",
    description:"У тебя здоровая привязанность. Ты комфортно чувствуешь себя в близости и в одиночестве. Умеешь доверять, открыто говорить о чувствах, выстраивать границы. Это здоровая база для отношений.",
    advice:"Ты — пример здоровых отношений. Поддерживай это в себе и помогай партнёру если у него другой тип."
  },
  anxious: {
    name:"Тревожный тип",
    icon:"💭",
    color:"#ff2d78",
    description:"Ты остро нуждаешься в близости и подтверждении любви. Боишься потерять отношения, можешь быть слишком эмоциональной. Часто чувствуешь себя «слишком».",
    advice:"Учись успокаивать себя сам(а). Партнёр не должен 24/7 доказывать любовь. Развивай свои интересы вне отношений."
  },
  avoidant: {
    name:"Избегающий тип",
    icon:"🏔",
    color:"#888888",
    description:"Ты ценишь независимость и личное пространство. Близость может тебя тяготить, эмоции партнёра — пугать. Предпочитаешь решать всё сам(а).",
    advice:"Уязвимость — это не слабость. Попробуй открываться партнёру маленькими шагами. Близость не отнимает свободу."
  },
  disorganized: {
    name:"Тревожно-избегающий",
    icon:"🌪",
    color:"#ffaa00",
    description:"Ты одновременно хочешь близости и боишься её. Реакции противоречивы — то ищешь, то отталкиваешь. Часто чувствуешь себя в эмоциональных качелях.",
    advice:"Этот тип чаще всего связан с травмой. Работа с психологом поможет понять что происходит и найти баланс."
  }
};

function AttachmentTest({ onClose }) {
  const [step,setStep] = useState(0);
  const [answers,setAnswers] = useState([]);

  const answer = (style) => {
    const newAnswers = [...answers, style];
    if(newAnswers.length === TEST_QUESTIONS.length) {
      setAnswers(newAnswers);
      setStep(TEST_QUESTIONS.length); // показать результат
    } else {
      setAnswers(newAnswers);
      setStep(s=>s+1);
    }
  };

  const result = (() => {
    const counts = {};
    answers.forEach(a => counts[a] = (counts[a]||0) + 1);
    let max = 0, type = "secure";
    Object.entries(counts).forEach(([k,v]) => { if(v>max){max=v;type=k;} });
    return TEST_RESULTS[type];
  })();

  const restart = () => { setStep(0); setAnswers([]); };

  return (
    <div style={{position:"fixed",inset:0,background:"#080810",zIndex:200,overflowY:"auto"}}>
      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 20px 80px"}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:14,cursor:"pointer",marginBottom:20,fontFamily:"'Share Tech Mono',monospace",letterSpacing:2}}>← НАЗАД</button>

        {step < TEST_QUESTIONS.length ? (
          <>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:3,color:"#00ffcc",margin:"0 0 8px"}}>ТЕСТ · {step+1} / {TEST_QUESTIONS.length}</p>
            <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:22,color:"#fff",margin:"0 0 24px",lineHeight:1.3}}>{TEST_QUESTIONS[step].q}</h2>

            {TEST_QUESTIONS[step].a.map((opt,i)=>(
              <button key={i} onClick={()=>answer(opt.s)} style={{width:"100%",background:"#0d0d1a",border:"1px solid #ffffff15",borderRadius:12,padding:"16px 18px",marginBottom:10,fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",cursor:"pointer",textAlign:"left",lineHeight:1.5,transition:"all .2s"}}
                onTouchStart={e=>{e.currentTarget.style.borderColor="#00ffcc";e.currentTarget.style.background="#0d1f2d"}}
                onTouchEnd={e=>{e.currentTarget.style.borderColor="#ffffff15";e.currentTarget.style.background="#0d0d1a"}}>
                {opt.t}
              </button>
            ))}

            <div style={{height:3,background:"#1a1a2e",borderRadius:2,marginTop:24,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(step/TEST_QUESTIONS.length)*100}%`,background:"#00ffcc",transition:"width .3s"}}/>
            </div>
          </>
        ) : (
          <>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:3,color:"#00ffcc",margin:"0 0 8px",textAlign:"center"}}>ТВОЙ РЕЗУЛЬТАТ</p>
            <div style={{textAlign:"center",fontSize:64,margin:"20px 0"}}>{result.icon}</div>
            <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:30,color:result.color,margin:"0 0 16px",textAlign:"center"}}>{result.name}</h2>
            <div style={{background:"#0d0d1a",border:`1px solid ${result.color}33`,borderRadius:14,padding:"18px",marginBottom:14}}>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#bbb",lineHeight:1.6,margin:0}}>{result.description}</p>
            </div>
            <div style={{background:"linear-gradient(135deg,#0d2d1a,#0a1a2d)",border:"1px solid #00ffcc33",borderRadius:14,padding:"18px",marginBottom:20}}>
              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2,color:"#00ffcc",margin:"0 0 8px"}}>РЕКОМЕНДАЦИЯ</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",lineHeight:1.6,margin:0}}>{result.advice}</p>
            </div>

            <button onClick={()=>{
              const txt = `Я прошла тест в Psycho Detector — мой тип привязанности: ${result.name} ${result.icon}\n\nПройди и ты: t.me/psychodetector_bot/PsychoDetector`;
              if(navigator.share) navigator.share({text:txt});
              else navigator.clipboard.writeText(txt);
            }} style={{width:"100%",background:"linear-gradient(135deg,#00ffcc,#00cc99)",border:"none",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#000",cursor:"pointer",marginBottom:10}}>
              Поделиться результатом
            </button>
            <button onClick={restart} style={{width:"100%",background:"transparent",border:"1px solid #333",borderRadius:12,padding:"12px",fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#666",cursor:"pointer",letterSpacing:2}}>
              ПРОЙТИ ЕЩЁ РАЗ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- 🆕 ПРОФИЛИ ПСИХОТИПОВ (свайп) -------------------------------------------
const PSYCHO_PROFILES = [
  { icon:"🪞", name:"Холодный Нарцисс", color:"#888888", traits:["Эгоцентризм","Низкая эмпатия","Самовлюблённость"],
    desc:"Считает себя особенным. Не способен глубоко сопереживать. Использует других для подкрепления своей значимости.",
    signs:"Постоянно говорит о себе. Обесценивает достижения других. Не извиняется. Использует тебя для статуса."
  },
  { icon:"💨", name:"Газлайтер", color:"#ff2d78", traits:["Манипулятивность","Отрицание реальности","Перекладывание вины"],
    desc:"Заставляет сомневаться в собственном восприятии. Отрицает свои слова и действия. Перекручивает события.",
    signs:"«Ты всё придумала», «Этого не было», «Ты слишком чувствительная». После разговора ты чувствуешь себя сумасшедшей."
  },
  { icon:"🎭", name:"Эмоциональный Манипулятор", color:"#ffaa00", traits:["Шантаж","Виктимизация","Контроль"],
    desc:"Использует эмоции как оружие. Играет жертву или агрессора в зависимости от ситуации.",
    signs:"«Если ты меня любишь, ты...», обиды без причины, молчаливое наказание, угрозы себе или уходом."
  },
  { icon:"🕸", name:"Контролёр", color:"#cc6600", traits:["Ревнивость","Слежка","Изоляция"],
    desc:"Хочет знать всё о твоей жизни. Изолирует от друзей и семьи. Контролирует время, деньги, общение.",
    signs:"Постоянные вопросы где ты и с кем. Критика твоих друзей. Контроль расходов. «Они тебя не любят, только я»."
  },
  { icon:"❄️", name:"Эмоционально Недоступный", color:"#3d8bdb", traits:["Закрытость","Отстранение","Холодность"],
    desc:"Избегает глубоких разговоров. Не выражает чувств. Дистанцируется когда становится слишком близко.",
    signs:"«Я не люблю говорить об этом». Не делится переживаниями. Исчезает после близости. Боится обязательств."
  },
  { icon:"🌪", name:"Качели", color:"#7B2FBE", traits:["Непредсказуемость","Идеализация","Обесценивание"],
    desc:"То боготворит, то обесценивает. Резкие смены настроения и отношения. Создаёт эмоциональную зависимость.",
    signs:"Сегодня «ты лучшая», завтра «ты ничего не значишь». После ссоры — бомба любви. Ты не знаешь чего ждать."
  },
];

function PsychoProfiles({ onClose }) {
  const [index,setIndex] = useState(0);
  const profile = PSYCHO_PROFILES[index];

  return (
    <div style={{position:"fixed",inset:0,background:"#080810",zIndex:200,overflowY:"auto"}}>
      <div style={{maxWidth:480,margin:"0 auto",padding:"24px 20px 80px"}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:14,cursor:"pointer",marginBottom:14,fontFamily:"'Share Tech Mono',monospace",letterSpacing:2}}>← НАЗАД</button>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:3,color:"#00ffcc",margin:"0 0 4px"}}>ПСИХОТИПЫ · {index+1} / {PSYCHO_PROFILES.length}</p>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#666",margin:"0 0 24px"}}>Узнай о разных типах поведения</p>

        <div style={{background:`linear-gradient(135deg,#0d0d1a,${profile.color}15)`,border:`1px solid ${profile.color}44`,borderRadius:20,padding:"28px 22px",marginBottom:20,minHeight:380}}>
          <div style={{textAlign:"center",fontSize:64,marginBottom:16}}>{profile.icon}</div>
          <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:26,color:profile.color,margin:"0 0 16px",textAlign:"center"}}>{profile.name}</h2>

          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:18}}>
            {profile.traits.map(t=>(
              <span key={t} style={{background:`${profile.color}15`,color:profile.color,border:`1px solid ${profile.color}33`,borderRadius:20,padding:"4px 12px",fontFamily:"'Share Tech Mono',monospace",fontSize:11}}>{t}</span>
            ))}
          </div>

          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ccc",lineHeight:1.6,margin:"0 0 18px"}}>{profile.desc}</p>

          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2,color:profile.color,margin:"0 0 8px"}}>ПРИЗНАКИ</p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",lineHeight:1.6,margin:0}}>{profile.signs}</p>
        </div>

        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0} style={{flex:1,background:index===0?"#0a0a14":"#0d0d1a",border:"1px solid #ffffff15",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:index===0?"#333":"#aaa",cursor:index===0?"default":"pointer"}}>
            ← Назад
          </button>
          <button onClick={()=>setIndex(i=>Math.min(PSYCHO_PROFILES.length-1,i+1))} disabled={index===PSYCHO_PROFILES.length-1} style={{flex:1,background:"linear-gradient(135deg,#00ffcc22,#00ffcc11)",border:"1px solid #00ffcc44",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:"#00ffcc",cursor:"pointer"}}>
            Далее →
          </button>
        </div>

        <div style={{display:"flex",gap:4,justifyContent:"center"}}>
          {PSYCHO_PROFILES.map((_,i)=>(
            <div key={i} style={{width:i===index?24:6,height:6,borderRadius:3,background:i===index?"#00ffcc":"#333",transition:"all .3s"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

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

// --- Screen 1: Welcome --------------------------------------------------------
function ScreenWelcome({ onAnalyze, onRedFlags, onOpenTest, onOpenProfiles }) {
  const [mode,setMode]=useState("image");
  const [text,setText]=useState("");
  const [pulse,setPulse]=useState(false);
  const [loading,setLoading]=useState(false);
  const [recording,setRecording]=useState(false);
  const [images,setImages]=useState([]); // массив {file, url}
  const [audios,setAudios]=useState([]); // массив {file, url}
  const [analyzeTarget,setAnalyzeTarget]=useState("other"); // other=собеседник, me=я
  const [imageContext,setImageContext]=useState(""); // доп контекст от пользователя
  const imgRef=useRef(); const audRef=useRef(); const mediaRef=useRef();

  useEffect(()=>{ const id=setInterval(()=>setPulse(p=>!p),1800); return()=>clearInterval(id); },[]);

  // --- Добавить скриншоты (до 10) --
  const handleImages=e=>{
    const files=Array.from(e.target.files);
    const items=files.map(f=>({file:f,url:URL.createObjectURL(f)}));
    setImages(prev=>[...prev,...items].slice(0,10));
    e.target.value="";
  };
  const removeImage=i=>setImages(prev=>prev.filter((_,idx)=>idx!==i));

  // --- Добавить аудио (до 5) --
  const handleAudios=e=>{
    const files=Array.from(e.target.files);
    const items=files.map(f=>({file:f,url:URL.createObjectURL(f)}));
    setAudios(prev=>[...prev,...items].slice(0,5));
    e.target.value="";
  };
  const removeAudio=i=>setAudios(prev=>prev.filter((_,idx)=>idx!==i));

  // --- Запись голоса --
  const startRec=async()=>{
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream); mediaRef.current=mr;
      const chunks=[];
      mr.ondataavailable=e=>chunks.push(e.data);
      mr.onstop=()=>{
        const blob=new Blob(chunks,{type:"audio/webm"});
        const file=new File([blob],`voice_${Date.now()}.webm`,{type:"audio/webm"});
        setAudios(prev=>[...prev,{file,url:URL.createObjectURL(blob)}].slice(0,5));
        stream.getTracks().forEach(t=>t.stop());
      };
      mr.start(); setRecording(true);
    } catch(e){ alert("Нет доступа к микрофону"); }
  };
  const stopRec=()=>{ mediaRef.current?.stop(); setRecording(false); };

  // --- Анализировать --
  const analyze=async()=>{
    setLoading(true);
    try {
      if(mode==="image"&&images.length>0){
        const b64s=await Promise.all(images.map(i=>toBase64(i.file)));
        const types=images.map(i=>i.file.type||"image/jpeg");
        onAnalyze({images:b64s,imageTypes:types,analyzeTarget,imageContext:imageContext.trim()});
      } else if(mode==="voice"&&audios.length>0){
        const b64s=await Promise.all(audios.map(a=>toBase64(a.file)));
        const types=audios.map(a=>a.file.type||"audio/webm");
        onAnalyze({audios:b64s,audioTypes:types});
      } else if(mode==="text"&&text.trim().length>=20){
        onAnalyze({text});
      }
    } catch(e){ setLoading(false); }
  };

  const canAnalyze=(mode==="image"&&images.length>0)||(mode==="voice"&&audios.length>0)||(mode==="text"&&text.length>=20);
  const MODES=[{id:"image",icon:"",label:"Скриншоты"},{id:"text",icon:"",label:"Текст"},{id:"voice",icon:"",label:"Голосовые"}];

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px 100px",position:"relative"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,opacity:.05,backgroundImage:"linear-gradient(#00ffcc 1px,transparent 1px),linear-gradient(90deg,#00ffcc 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

      {/* Eye */}
      <div style={{width:88,height:88,borderRadius:"50%",position:"relative",background:"radial-gradient(circle at 40% 40%,#0d1f2d,#050510)",border:"1.5px solid #00ffcc44",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,zIndex:1,boxShadow:pulse?"0 0 40px #00ffcc55":"0 0 20px #00ffcc22",transition:"box-shadow 1.8s ease"}}>
        <svg width={46} height={28} viewBox="0 0 52 32"><ellipse cx={26} cy={16} rx={25} ry={15} fill="none" stroke="#00ffcc" strokeWidth={1.5}/><circle cx={26} cy={16} r={8} fill="#00ffcc22" stroke="#00ffcc" strokeWidth={1.5}/><circle cx={26} cy={16} r={3.5} fill="#00ffcc"/><circle cx={28} cy={14} r={1.2} fill="#fff" opacity={.7}/></svg>
        <ScanLine/>
      </div>

      <div style={{textAlign:"center",zIndex:1,maxWidth:380,width:"100%"}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:5,color:"#00ffcc88",marginBottom:14}}>PSYCHO DETECTOR v2.1</p>
        <LiveCounter/>
        <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:38,lineHeight:1.05,margin:"0 0 12px",color:"#fff",letterSpacing:-1}}>Узнай кто<br/><span style={{color:"#00ffcc"}}>на самом</span><br/>деле рядом</h1>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#aaa",lineHeight:1.5,margin:"0 0 6px"}}>Партнёр · Коллега · Подруга · Новый знакомый</p>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#888",lineHeight:1.5,margin:"0 0 20px"}}>Голосовое, скриншот или текст — ИИ раскроет скрытые намерения</p>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:16,background:"#111118",border:"1px solid #222",borderRadius:20,padding:"4px"}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,background:mode===m.id?"#00ffcc":"#1a1a2e",color:mode===m.id?"#000":"#aaaaaa",border:mode===m.id?"none":"1px solid #333",borderRadius:14,padding:"10px 0",fontFamily:"'Rajdhani',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
              {m.label}
            </button>
          ))}
        </div>

        {/* -- СКРИНШОТЫ -- */}
        {mode==="image"&&(
          <div style={{background:"#0d0d1a",border:"1px solid #00ffcc22",borderRadius:16,padding:16}}>
            {/* Превью добавленных */}
            {images.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                {images.map((img,i)=>(
                  <div key={i} style={{position:"relative",width:72,height:72,borderRadius:8,overflow:"hidden",border:"1px solid #00ffcc33"}}>
                    <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <button onClick={()=>removeImage(i)} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"#ff2d78",border:"none",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleImages}/>
            <div onClick={()=>imgRef.current.click()} style={{border:"2px dashed #00ffcc33",borderRadius:12,padding:"20px",cursor:"pointer",textAlign:"center",transition:"all .3s"}}
              onTouchStart={e=>e.currentTarget.style.borderColor="#00ffcc"}
              onTouchEnd={e=>e.currentTarget.style.borderColor="#00ffcc33"}>
              <div style={{fontSize:28,marginBottom:6}}>⬆</div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#fff"}}>
                {images.length>0?`Добавить ещё (${images.length}/10)`:"Выбрать скриншоты"}
              </div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",marginTop:4}}>
                Можно выбрать несколько сразу
              </div>
            </div>

            {/* Чьи сообщения анализировать */}
            {images.length>0&&(
              <div style={{marginTop:14,background:"#0d1a1a",border:"1px solid #00ffcc22",borderRadius:12,padding:"14px"}}>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc",letterSpacing:2,margin:"0 0 10px"}}>ЧЬИ СООБЩЕНИЯ АНАЛИЗИРОВАТЬ?</p>
                <div style={{display:"flex",gap:8}}>
                  {[
                    {id:"other", label:"Собеседника", hint:"(не мои)"},
                    {id:"me",    label:"Мои",          hint:"(как я выгляжу)"},
                  ].map(opt=>(
                    <button key={opt.id} onClick={()=>setAnalyzeTarget(opt.id)}
                      style={{flex:1,background:analyzeTarget===opt.id?"#00ffcc":"#111",
                        border:`1px solid ${analyzeTarget===opt.id?"#00ffcc":"#333"}`,
                        borderRadius:10,padding:"10px 8px",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,
                        color:analyzeTarget===opt.id?"#000":"#888"}}>{opt.label}</div>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,
                        color:analyzeTarget===opt.id?"#000a":"#444"}}>{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Дополнительный контекст */}
            {images.length>0&&(
              <div style={{marginTop:10}}>
                <textarea
                  value={imageContext}
                  onChange={e=>setImageContext(e.target.value)}
                  placeholder={`Необязательно: уточни контекст\n\nНапример:\n• "Слева Дархан — мой коллега"\n• "Это WhatsApp, зелёные — мои сообщения"\n• "Хочу понять манипулирует ли он мной"`}
                  style={{width:"100%",minHeight:90,background:"#0a0a14",
                    border:"1px solid #ffffff15",borderRadius:10,padding:"12px",
                    fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",
                    resize:"none",outline:"none",boxSizing:"border-box",
                    lineHeight:1.5,marginTop:4}}
                />
              </div>
            )}
          </div>
        )}

        {/* -- ТЕКСТ -- */}
        {mode==="text"&&(
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Вставь текст переписки сюда..."
            style={{width:"100%",minHeight:140,background:"#0d0d1a",border:"1px solid #00ffcc33",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ccc",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
        )}

        {/* -- ГОЛОСОВЫЕ -- */}
        {mode==="voice"&&(
          <div style={{background:"#0d0d1a",border:"1px solid #00ffcc22",borderRadius:16,padding:16}}>
            {/* Превью добавленных */}
            {audios.length>0&&(
              <div style={{marginBottom:12}}>
                {audios.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#111",borderRadius:10,padding:"8px 12px",marginBottom:8}}>
                    <span style={{fontSize:20}}>🎤</span>
                    <div style={{flex:1,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc88",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {a.file.name||`Запись ${i+1}`}
                    </div>
                    <button onClick={()=>removeAudio(i)} style={{background:"#ff2d7833",border:"1px solid #ff2d7855",borderRadius:6,color:"#ff2d78",fontSize:11,cursor:"pointer",padding:"2px 8px"}}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Запись */}
            <button onClick={recording?stopRec:startRec} style={{width:"100%",background:recording?"linear-gradient(135deg,#ff2d78,#cc0055)":"linear-gradient(135deg,#00ffcc22,#00ffcc11)",border:`1px solid ${recording?"#ff2d78":"#00ffcc44"}`,borderRadius:12,padding:"16px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:recording?"#fff":"#00ffcc",cursor:"pointer",marginBottom:10,letterSpacing:1,transition:"all .3s",animation:recording?"recpulse 1s ease infinite":"none"}}>
              {recording?"⏹ Остановить запись":"Записать голосовое"}
            </button>
            <style>{`@keyframes recpulse{0%,100%{box-shadow:0 0 0 0 #ff2d7855}50%{box-shadow:0 0 0 12px transparent}}`}</style>

            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#333",margin:"0 0 10px",textAlign:"center"}}>— или загрузи файлы —</p>
            <input ref={audRef} type="file" accept="audio/*" multiple style={{display:"none"}} onChange={handleAudios}/>
            <button onClick={()=>audRef.current.click()} style={{width:"100%",background:"transparent",border:"1px dashed #333",borderRadius:10,padding:"12px",fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#555",cursor:"pointer"}}>
              Загрузить аудио ({audios.length}/5)
            </button>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#556655",marginTop:10,lineHeight:1.6,textAlign:"center"}}>MP3, OGG, M4A, WebM</p>
            <div style={{marginTop:12,background:"#0d1a0d",border:"1px solid #00ffcc22",borderRadius:10,padding:"10px 14px"}}>
              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#00ffcc88",margin:"0 0 6px",letterSpacing:2}}>КАК СКАЧАТЬ ГОЛОСОВОЕ ИЗ TELEGRAM:</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",margin:"0 0 6px",lineHeight:1.5}}>1. Зажми голосовое сообщение → Сохранить</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",margin:"0 0 6px",lineHeight:1.5}}>2. Или перешли боту @psychodetector_bot напрямую</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#00ffcc",margin:0,lineHeight:1.5}}>→ Бот автоматически проанализирует!</p>
            </div>
          </div>
        )}

        {/* -- Кнопка анализа -- */}
        <button onClick={analyze} disabled={!canAnalyze||loading}
          style={{width:"100%",marginTop:14,
            background:canAnalyze?"linear-gradient(135deg,#00ffcc,#00cc99)":"linear-gradient(135deg,#1a1a2e,#111)",
            border:`2px solid ${canAnalyze?"#00ffcc":"#444"}`,
            borderRadius:12,padding:"16px",cursor:canAnalyze?"pointer":"default",
            fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,
            color:canAnalyze?"#000":"#666",transition:"all .3s",letterSpacing:1}}>
          {loading?"⏳ Анализируем...":canAnalyze?"Анализировать":"Выбери файлы или введи текст"}
        </button>

        {/* Красные флаги */}
        <button onClick={()=>onRedFlags()} style={{width:"100%",marginTop:10,background:"#1a0a0a",border:"1px solid #ff2d7866",borderRadius:12,padding:"13px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#ff2d78",cursor:"pointer",letterSpacing:.5}}>
          🚩 Проверить сообщение или скриншот на красные флаги
        </button>

        {/* Инсайт дня */}
        <div style={{marginTop:16}}>
          <DailyInsight/>
        </div>

        {/* Дополнительные фишки */}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button onClick={()=>onOpenTest()} style={{flex:1,background:"#0d0d1a",border:"1px solid #ffffff15",borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:6}}>🧬</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:"#fff",lineHeight:1.3}}>Кто я в отношениях?</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#888",marginTop:4}}>тест из 8 вопросов</div>
          </button>
          <button onClick={()=>onOpenProfiles()} style={{flex:1,background:"#0d0d1a",border:"1px solid #ffffff15",borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:6}}>🎭</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:"#fff"}}>Психотипы</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#888",marginTop:4}}>обучающие карточки</div>
          </button>
        </div>

        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#779977",marginTop:14,letterSpacing:1}}>✓ ПЕРВЫЙ АНАЛИЗ БЕСПЛАТНО · ДАННЫЕ НЕ СОХРАНЯЮТСЯ</p>
      </div>
    </div>
  );
}

// --- Screen 2: Scanning -------------------------------------------------------
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

// --- 🆕 Советы психолога блок ------------------------------------------------
function AdviceBlock({ advice }) {
  const [open,setOpen]=useState(false);
  if(!advice) return null;
  return (
    <div style={{background:"linear-gradient(135deg,#0d1f2d,#0a1a0d)",border:"1px solid #00ffcc33",borderRadius:16,padding:"20px",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}></span>
          <div>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2,color:"#00ffcc",margin:"0 0 2px"}}>ОБЩИЕ РЕКОМЕНДАЦИИ</p>
            <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:"#fff",margin:0}}>{advice.title||"Как взаимодействовать с этим типом"}</p>
          </div>
        </div>
        <span style={{color:"#00ffcc",fontSize:18,transition:"transform .3s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </div>
      {open&&(
        <div style={{marginTop:16}}>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ccc",lineHeight:1.6,margin:"0 0 14px",borderLeft:"3px solid #00ffcc",paddingLeft:12}}>
            {advice.short}
          </p>
          {advice.tactics?.length>0&&(
            <div style={{marginBottom:14}}>
              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#00ffcc",letterSpacing:2,marginBottom:8}}>ЧТО ДЕЛАТЬ:</p>
              {advice.tactics.map((t,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                  <span style={{color:"#00ffcc",fontFamily:"'Share Tech Mono',monospace",fontSize:12,marginTop:2}}>0{i+1}</span>
                  <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#aaa",margin:0,lineHeight:1.5}}>{t}</p>
                </div>
              ))}
            </div>
          )}
          {advice.warning&&(
            <div style={{background:"#ff2d7810",border:"1px solid #ff2d7833",borderRadius:10,padding:"10px 14px"}}>
              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#ff2d78",letterSpacing:2,margin:"0 0 4px"}}>ЧЕГО НЕ ДЕЛАТЬ:</p>
              <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ff2d78aa",margin:0,lineHeight:1.5}}>⛔ {advice.warning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 🆕 Красные флаги модалка ------------------------------------------------
function RedFlagsModal({ onClose, onAnalyze }) {
  const [msg,setMsg]=useState("");
  const [rfImage,setRfImage]=useState(null);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const rfFileRef=useRef();

  const handleRfImage=async e=>{
    const file=e.target.files[0]; if(!file) return;
    const b64=await toBase64(file);
    setRfImage({b64,type:file.type||"image/jpeg"});
  };

  const check=async()=>{
    if(msg.trim().length<5 && !rfImage) return;
    setLoading(true);
    try {
      const payload = rfImage
        ? {images:[rfImage.b64],imageTypes:[rfImage.type]}
        : {text:`Проверь это сообщение на красные флаги и манипуляции: "${msg}"`,redFlagsMode:true};
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)});
      const data=await res.json();
      setResult(data);
    } catch(e){}
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:20}}>
      <div style={{background:"#0d0d1a",border:"1px solid #ff2d7833",borderRadius:16,padding:24,width:"100%",maxWidth:440,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#ff2d78",letterSpacing:3,margin:"0 0 4px"}}>ДЕТЕКТОР</p>
            <span style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:20,color:"#fff"}}>🚩 Красные флаги</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#444",fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#aaa",marginBottom:16,lineHeight:1.5}}>
          Вставь текст или загрузи скриншот — проверим есть ли тревожные признаки
        </p>
        {/* Загрузка скриншота */}
        <input ref={rfFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleRfImage}/>
        {rfImage?(
          <div style={{position:"relative",marginBottom:12}}>
            <img src={URL.createObjectURL(new Blob([]))} alt="" style={{display:"none"}}/>
            <div style={{background:"#ff2d7815",border:"1px solid #ff2d7844",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ff2d78"}}>Скриншот загружен</span>
              <button onClick={()=>setRfImage(null)} style={{background:"none",border:"none",color:"#ff2d78",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
          </div>
        ):(
          <button onClick={()=>rfFileRef.current.click()} style={{width:"100%",background:"#1a0a0a",border:"1px dashed #ff2d7844",borderRadius:10,padding:"11px",fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ff2d7888",cursor:"pointer",marginBottom:10}}>
            Загрузить скриншот
          </button>
        )}
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:"#444",textAlign:"center",margin:"0 0 8px"}}>— или вставь текст —</p>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)}
          placeholder="Вставь сообщение здесь..."
          style={{width:"100%",minHeight:100,background:"#111",border:"1px solid #ff2d7833",borderRadius:10,padding:"12px",
            fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#ccc",resize:"none",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {!result?(
          <button onClick={check} disabled={(msg.length<5&&!rfImage)||loading} style={{width:"100%",
            background:(msg.length>=5||rfImage)?"linear-gradient(135deg,#ff2d78,#ff6b35)":"#111",
            border:"none",borderRadius:10,padding:"13px",fontFamily:"'Rajdhani',sans-serif",
            fontWeight:700,fontSize:16,color:(msg.length>=5||rfImage)?"#fff":"#333",cursor:(msg.length>=5||rfImage)?"pointer":"not-allowed"}}>
            {loading?"Проверяем...":"Проверить"}
          </button>
        ):(
          <div>
            <div style={{background:result.toxicity>50?"#ff2d7815":"#00ffcc15",border:`1px solid ${result.toxicity>50?"#ff2d7855":"#00ffcc55"}`,borderRadius:12,padding:16,marginBottom:12,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:8}}>{result.toxicity>70?"🚨":result.toxicity>40?"⚠️":"✅"}</div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:22,color:result.toxicity>50?"#ff2d78":"#00ffcc",marginBottom:4}}>
                {result.toxicity>70?"Тревожные признаки!":result.toxicity>40?"Есть поводы для внимания":"Всё выглядит нормально"}
              </div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#666"}}>
                Токсичность: {result.toxicity}%
              </div>
            </div>
            {result.manipulation_techniques?.length>0&&(
              <div style={{marginBottom:12}}>
                <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#ff2d78",letterSpacing:2,marginBottom:8}}>НАЙДЕНО:</p>
                {result.manipulation_techniques.map(t=>(
                  <span key={t} style={{display:"inline-block",background:"#ff2d7815",color:"#ff2d78",border:"1px solid #ff2d7833",borderRadius:20,padding:"4px 12px",fontFamily:"'Share Tech Mono',monospace",fontSize:10,margin:"0 6px 6px 0"}}>{t}</span>
                ))}
              </div>
            )}
            <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#bbb",lineHeight:1.6,marginBottom:14}}>{result.summary}</p>
            <button onClick={()=>setResult(null)} style={{width:"100%",background:"transparent",border:"1px solid #333",borderRadius:10,padding:"11px",fontFamily:"'Share Tech Mono',monospace",fontSize:15,color:"#888",cursor:"pointer"}}>
              ПРОВЕРИТЬ ЕЩЁ ОДНО
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Screen 3: Result ---------------------------------------------------------
function ScreenResult({ data, onReset }) {
  const [unlocked,setUnlocked]=useState(true); // Бесплатно до набора аудитории
  const [showResp,setShowResp]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const toxColor=data.toxicity>70?"#ff2d78":data.toxicity>40?"#ffaa00":"#00ffcc";
  return (
    <div style={{minHeight:"100vh",padding:"28px 20px 100px",maxWidth:480,margin:"0 auto"}}>
      {showShare&&<ShareCard data={data} onClose={()=>setShowShare(false)}/>}
      <div style={{textAlign:"center",marginBottom:18}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2,color:"#00ffcc",margin:"0 0 6px"}}>АНАЛИЗ ЗАВЕРШЁН</p>
        <h2 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:26,color:"#fff",margin:"0 0 8px"}}>{data.name} — профиль готов</h2>
        {data.summary&&<p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#aaa",margin:0,lineHeight:1.6}}>{data.summary}</p>}
      </div>
      <UrgencyTimer/>
      <ResultDisclaimer/>
      <RelationshipForecast toxicity={data.toxicity} psychotype={data.psychotype}/>
      <div style={{background:"#0d0d1a",border:`1px solid ${toxColor}44`,borderRadius:16,padding:"24px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:20,boxShadow:`0 0 40px ${toxColor}11`}}>
        <ToxicGauge value={data.toxicity}/>
        <div style={{flex:1}}>
          <div style={{fontSize:32,marginBottom:4}}>{data.psychotype.icon}</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,color:toxColor,marginBottom:4}}>{data.psychotype.name}</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#aaa",lineHeight:1.5}}>{data.psychotype.description}</div>
        </div>
      </div>
      {data.manipulation_techniques?.length>0&&(
        <div style={{marginBottom:14,display:"flex",flexWrap:"wrap",gap:6}}>
          {data.manipulation_techniques.map(t=><span key={t} style={{background:"#ff2d7815",color:"#ff2d78",border:"1px solid #ff2d7833",borderRadius:20,padding:"4px 12px",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:1}}>{t}</span>)}
        </div>
      )}
      <div style={{marginBottom:14}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:3,color:"#666",marginBottom:10}}>УЛИКИ</p>
        {(data.evidence||[]).map((e,i)=>{ const c=i===0?"#ff2d78":"#ffaa00"; return (
          <div key={i} style={{background:"#0d0d1a",border:`1px solid ${c}33`,borderLeft:`3px solid ${c}`,borderRadius:"0 10px 10px 0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,color:c,marginBottom:6}}>"{e.quote}"</div>
            <span style={{background:c+"22",color:c,fontSize:11,fontFamily:"'Share Tech Mono',monospace",padding:"2px 8px",borderRadius:20,letterSpacing:1,display:"inline-block",marginBottom:6}}>{e.label}</span>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#aaa",marginTop:4,lineHeight:1.5}}>{e.explanation}</div>
          </div>
        );})}
      </div>
      <div style={{background:"#0d0d1a",border:"1px solid #ffffff0a",borderRadius:16,padding:"20px",marginBottom:14}}>
        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:3,color:"#666",margin:"0 0 16px"}}>ТЁМНЫЕ ЧЕРТЫ</p>
        <TraitBar label="Манипулятивность" value={data.dark_traits?.manipulation||0} color="#ff2d78" delay={0}/>
        <TraitBar label="Эмпатия"          value={data.dark_traits?.empathy||0}      color="#00ffcc" delay={200}/>
        <TraitBar label="Доминирование"    value={data.dark_traits?.dominance||0}    color="#ffaa00" delay={400}/>
      </div>
      {!unlocked?(
        <div style={{background:"linear-gradient(135deg,#1a0d20,#0d0d1a)",border:"1px solid #ff2d7855",borderRadius:16,padding:"24px 20px",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}></div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:20,color:"#fff",marginBottom:8}}>Глубокий разбор личности</div>
          <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#aaa",marginBottom:20,lineHeight:1.5}}>Главная слабость · Варианты ответа · Как защититься</div>
          <button onClick={()=>setUnlocked(true)} style={{background:"linear-gradient(135deg,#ff2d78,#ff6b35)",border:"none",borderRadius:10,padding:"14px 32px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#fff",cursor:"pointer",boxShadow:"0 0 30px #ff2d7855",letterSpacing:1}}>Разблокировать за 1$</button>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#2a2a3a",marginTop:12}}>ОПЛАТА ЧЕРЕЗ TELEGRAM STARS</div>
        </div>
      ):(
        <div style={{background:"#0d0d1a",border:"1px solid #00ffcc33",borderRadius:16,padding:"20px",marginBottom:14}}>
          {data.boundary_violation&&<><p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:3,color:"#00ffcc",margin:"0 0 8px"}}>НАРУШЕНИЕ ГРАНИЦ</p><p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#ccc",lineHeight:1.6,margin:"0 0 18px"}}>🛡️ {data.boundary_violation}</p></>}
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2,color:"#00ffcc",margin:"0 0 8px"}}>ГЛАВНАЯ СЛАБОСТЬ</p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,color:"#ddd",lineHeight:1.6,margin:"0 0 18px"}}>⚠️ {data.main_weakness}</p>
          <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:2,color:"#00ffcc",margin:"0 0 10px"}}>ВАРИАНТЫ ОТВЕТА</p>
          <button onClick={()=>setShowResp(r=>!r)} style={{width:"100%",background:"#00ffcc11",border:"1px solid #00ffcc44",borderRadius:10,padding:"14px",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#00ffcc",letterSpacing:.5}}>
            {showResp?`💬 ${data.ideal_response}`:"Показать варианты ответа"}
          </button>
        </div>
      )}
      {/* Общие рекомендации */}
      <AdviceBlock advice={data.advice}/>

      {/* Тест на самооценку */}
      <div style={{background:"#0d0d1a",border:"1px solid #ffffff0a",borderRadius:16,padding:"20px",marginBottom:14,textAlign:"center"}}>
        <span style={{fontSize:32,display:"block",marginBottom:8}}>🪞</span>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#fff",margin:"0 0 6px"}}>А как выглядишь ты?</p>
        <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#888",margin:"0 0 14px",lineHeight:1.5}}>Дай другу проанализировать твои сообщения — узнай свой психотип</p>
        <button onClick={()=>{
          const text="Привет! Проверь мои сообщения - узнай мой психотип 👁\nt.me/psychodetector_bot/PsychoDetector";
          if(navigator.share){navigator.share({text});}
          else{navigator.clipboard.writeText(text);}
        }} style={{background:"linear-gradient(135deg,#1a1a2e,#0d0d1a)",border:"1px solid #ffffff22",borderRadius:10,padding:"10px 24px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:"#888",cursor:"pointer"}}>
          Отправить другу
        </button>
      </div>

      <button onClick={()=>setShowShare(true)} style={{width:"100%",background:"linear-gradient(135deg,#0d2d1a,#0a1a2d)",border:"1px solid #00ffcc33",borderRadius:12,padding:"14px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:"#00ffcc",cursor:"pointer",letterSpacing:1,marginBottom:10}}>Поделиться в Story</button>
      <button onClick={onReset} style={{width:"100%",background:"transparent",border:"1px solid #222",borderRadius:12,padding:"11px",fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#666",cursor:"pointer",letterSpacing:1}}>Новый анализ</button>
    </div>
  );
}

// --- 🆕 Error screen с поддержкой --------------------------------------------
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
          Попробовать снова
        </button>
        <a href="https://t.me/psycho_support_bot" target="_blank" rel="noreferrer"
          style={{background:"#00ffcc11",border:"1px solid #00ffcc33",borderRadius:10,padding:"12px 28px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:16,color:"#00ffcc",textDecoration:"none",display:"block"}}>
          Написать в поддержку
        </a>
      </div>
    </div>
  );
}

// --- ROOT ---------------------------------------------------------------------
function safeGet(key){try{return localStorage.getItem(key);}catch(e){return null;}}
function safeSet(key,val){try{localStorage.setItem(key,val);}catch(e){}}

// --- 🆕 ОБЯЗАТЕЛЬНЫЙ ДИСКЛЕЙМЕР ПРИ ЗАПУСКЕ ---------------------------------
function MandatoryDisclaimer({ onAccept }) {
  return (
    <div style={{minHeight:"100vh",background:"#080810",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",position:"relative"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,opacity:.04,backgroundImage:"linear-gradient(#ff2d78 1px,transparent 1px),linear-gradient(90deg,#ff2d78 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

      <div style={{zIndex:1,maxWidth:440,width:"100%",textAlign:"center"}}>
        {/* Восклицательный знак */}
        <div style={{width:96,height:96,margin:"0 auto 24px",borderRadius:"50%",background:"linear-gradient(135deg,#3d0a0a,#1a0d0d)",border:"3px solid #ff2d78",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px #ff2d7866"}}>
          <span style={{fontSize:54,color:"#ff2d78",fontWeight:900,lineHeight:1}}>!</span>
        </div>

        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,letterSpacing:4,color:"#ff2d78",margin:"0 0 12px"}}>ВАЖНО ПРОЧИТАТЬ</p>

        <h1 style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:30,color:"#fff",margin:"0 0 24px",lineHeight:1.2}}>
          Перед использованием
        </h1>

        <div style={{background:"#1a0d0d",border:"1px solid #ff2d7833",borderRadius:16,padding:"24px 22px",marginBottom:20,textAlign:"left"}}>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:17,color:"#fff",lineHeight:1.6,margin:"0 0 16px",fontWeight:600}}>
            Это аналитический инструмент, а не диагноз.
          </p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",lineHeight:1.7,margin:"0 0 16px"}}>
            ИИ анализирует паттерны общения, но <span style={{color:"#ff2d78",fontWeight:600}}>не заменяет консультацию психолога</span>.
          </p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",lineHeight:1.7,margin:"0 0 16px"}}>
            Результаты — это повод для размышления и рефлексии, а не окончательная характеристика человека.
          </p>
          <p style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:"#ddd",lineHeight:1.7,margin:0}}>
            При признаках абьюза, насилия или серьёзных проблем — <span style={{color:"#ff2d78",fontWeight:600}}>обязательно обратись к специалисту</span> или на горячую линию помощи.
          </p>
        </div>

        <button onClick={onAccept} style={{width:"100%",background:"linear-gradient(135deg,#00ffcc,#00cc99)",border:"none",borderRadius:14,padding:"16px",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:18,color:"#000",cursor:"pointer",letterSpacing:1,boxShadow:"0 0 30px #00ffcc44"}}>
          Понятно, продолжить
        </button>

        <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#555",marginTop:16,letterSpacing:1}}>
          Нажимая «Продолжить», ты соглашаешься с условиями
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [screen,setScreen]=useState("welcome");
  const [disclaimerAccepted,setDisclaimerAccepted]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [isVoice,setIsVoice]=useState(false);
  const [showRedFlags,setShowRedFlags]=useState(false);
  const [showTest,setShowTest]=useState(false);
  const [showProfiles,setShowProfiles]=useState(false);

  useEffect(()=>{
    try{ if(!safeGet("pd_ob")) setScreen("onboarding"); }catch(e){}
  },[]);

  const handleAnalyze=useCallback(async payload=>{
    setIsVoice(!!(payload.audios||payload.audio));
    setScreen("scanning");
    try {
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Неизвестная ошибка");
      setResult(data); setScreen("result");
    } catch(e){ setError(e.message); setScreen("error"); }
  },[]);

  const doneOnboarding=()=>{ safeSet("pd_ob","1"); setScreen("welcome"); };
  const reset=()=>{ setScreen("welcome"); setResult(null); setError(""); };

  // Дисклеймер показывается при каждом запуске
  if(!disclaimerAccepted) {
    return <MandatoryDisclaimer onAccept={()=>setDisclaimerAccepted(true)}/>;
  }

  return (
    <div style={{background:"#080810",color:"#e0e0e0",minHeight:"100vh",position:"relative",overflowX:"hidden"}}>
      <Noise/>
      {screen==="onboarding" && <ScreenOnboarding onDone={doneOnboarding}/>}
      {screen==="welcome"    && <>
        {showRedFlags && <RedFlagsModal onClose={()=>setShowRedFlags(false)} onAnalyze={handleAnalyze}/>}
        {showTest && <AttachmentTest onClose={()=>setShowTest(false)}/>}
        {showProfiles && <PsychoProfiles onClose={()=>setShowProfiles(false)}/>}
        <ScreenWelcome onAnalyze={handleAnalyze} onRedFlags={()=>setShowRedFlags(true)} onOpenTest={()=>setShowTest(true)} onOpenProfiles={()=>setShowProfiles(true)}/>
      </>}
      {screen==="scanning"   && <ScreenScanning isVoice={isVoice}/>}
      {screen==="result"     && result && <>
        {showRedFlags && <RedFlagsModal onClose={()=>setShowRedFlags(false)} onAnalyze={handleAnalyze}/>}
        <ScreenResult data={result} onReset={reset}/>
      </>}
      {screen==="error"      && <ScreenError message={error} onReset={reset}/>}
      {/* Кнопка поддержки видна на всех экранах кроме онбординга */}
      {screen!=="onboarding" && <SupportButton/>}
      {screen!=="onboarding" && <HelpButton/>}
    </div>
  );
}
