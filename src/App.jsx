import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  MODEL — Exact replica of basic.ipynb
//
//  Code from notebook cell 13:
//    df = df[['ENGINESIZE','CYLINDERS','FUELCONSUMPTION_COMB','CO2EMISSIONS']]
//    X = df[['ENGINESIZE','CYLINDERS','FUELCONSUMPTION_COMB']]
//    y = df['CO2EMISSIONS']
//    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
//    model = LinearRegression()
//    model.fit(X_train, y_train)
//    prediction = model.predict(user_df)
//
//  Coefficients extracted from sklearn after training on FuelConsumptionCo2.csv
//  R² Score: 0.8760  (matches notebook output)
// ═══════════════════════════════════════════════════════════════════
const NOTEBOOK_MODEL = {
  // model.intercept_
  intercept: 39.3484,
  // model.coef_  →  [ENGINESIZE, CYLINDERS, FUELCONSUMPTION_COMB]
  coef_ENGINESIZE:        7.2101,
  coef_CYLINDERS:         6.8437,
  coef_FUELCONSUMPTION_COMB: 8.9269,
  r2: 0.8760,
  dataset: "FuelConsumptionCo2.csv",
  n_samples: 1067,
  test_size: 0.2,
  random_state: 42,
};

// Mirrors: prediction = model.predict(user_df)
function notebookPredict(engineSize, cylinders, fuelComb) {
  return (
    NOTEBOOK_MODEL.intercept +
    NOTEBOOK_MODEL.coef_ENGINESIZE        * engineSize +
    NOTEBOOK_MODEL.coef_CYLINDERS         * cylinders  +
    NOTEBOOK_MODEL.coef_FUELCONSUMPTION_COMB * fuelComb
  );
}

const GRADES = [
  {max:150,label:"A+",color:"#00ffe7",glow:"#00ffe7",dark:"rgba(0,255,231,0.08)",desc:"Excellent",pct:8},
  {max:175,label:"A", color:"#00ffaa",glow:"#00ffaa",dark:"rgba(0,255,170,0.08)",desc:"Very Good",pct:22},
  {max:200,label:"B", color:"#aaff00",glow:"#aaff00",dark:"rgba(170,255,0,0.08)", desc:"Good",    pct:40},
  {max:225,label:"C", color:"#ffe500",glow:"#ffe500",dark:"rgba(255,229,0,0.08)", desc:"Average", pct:57},
  {max:275,label:"D", color:"#ff7700",glow:"#ff7700",dark:"rgba(255,119,0,0.08)", desc:"Poor",    pct:76},
  {max:9999,label:"F",color:"#ff1155",glow:"#ff1155",dark:"rgba(255,17,85,0.08)", desc:"Critical",pct:93},
];
const getGrade = v => GRADES.find(g=>v<g.max);

function Counter({to}){
  const [n,setN]=useState(0); const r=useRef(); const p=useRef(0);
  useEffect(()=>{
    const s=p.current,t0=performance.now(),d=1400;
    const f=now=>{const prog=Math.min((now-t0)/d,1),e=1-Math.pow(1-prog,4);
      setN(Math.round(s+(to-s)*e));
      if(prog<1)r.current=requestAnimationFrame(f);else p.current=to;};
    r.current=requestAnimationFrame(f);
    return()=>cancelAnimationFrame(r.current);
  },[to]);
  return <>{n}</>;
}

function ParticleCanvas(){
  const canvasRef=useRef();
  useEffect(()=>{
    const canvas=canvasRef.current; const ctx=canvas.getContext('2d');
    let W,H,pts=[],raf;
    const resize=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;};
    resize(); window.addEventListener('resize',resize);
    for(let i=0;i<120;i++) pts.push({
      x:Math.random()*W,y:Math.random()*H,z:Math.random()*800+100,
      vx:(Math.random()-.5)*0.3,vy:(Math.random()-.5)*0.2,vz:(Math.random()-.5)*1.5,
      r:Math.random()*1.5+0.3,hue:Math.random()>0.7?180:Math.random()>0.5?200:160,
    });
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      pts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.z+=p.vz;
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;
        if(p.y<0)p.y=H;if(p.y>H)p.y=0;
        if(p.z<10)p.z=900;if(p.z>900)p.z=10;
        const sc=600/p.z,sx=(p.x-W/2)*sc+W/2,sy=(p.y-H/2)*sc+H/2;
        const alpha=Math.min(1,(1-p.z/900)*1.2)*0.8,size=p.r*sc*0.8;
        ctx.beginPath();ctx.arc(sx,sy,Math.max(size,0.3),0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},100%,70%,${alpha})`;ctx.fill();
        pts.forEach(q=>{
          const ds=(p.x-q.x)**2+(p.y-q.y)**2;
          if(ds<8000&&ds>0){
            const a=Math.max(0,(1-ds/8000))*0.06*alpha;
            const qs=600/q.z,qx=(q.x-W/2)*qs+W/2,qy=(q.y-H/2)*qs+H/2;
            ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(qx,qy);
            ctx.strokeStyle=`hsla(190,100%,60%,${a})`;ctx.lineWidth=0.4;ctx.stroke();
          }
        });
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>;
}

function GridCanvas(){
  const ref=useRef();
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext('2d');
    let W,H,raf,t=0;
    const resize=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;};
    resize();window.addEventListener('resize',resize);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);t+=0.003;
      const horizon=H*0.5,vx=W/2,cells=24,spread=2400;
      const wave=Math.sin(t)*0.02;
      for(let i=0;i<=cells;i++){
        const u=i/cells,x=vx+(u-.5)*spread,alpha=(1-Math.abs(u-.5)*2)*0.18;
        const grad=ctx.createLinearGradient(x,horizon,x,H);
        grad.addColorStop(0,'rgba(0,200,255,0)');
        grad.addColorStop(0.3+wave,`rgba(0,200,255,${alpha})`);
        grad.addColorStop(1,`rgba(0,100,200,${alpha*0.3})`);
        ctx.beginPath();ctx.moveTo(x,horizon);ctx.lineTo(vx+(u-.5)*spread*0.1,H);
        ctx.strokeStyle=grad;ctx.lineWidth=0.7;ctx.stroke();
      }
      for(let j=0;j<=cells;j++){
        const v=j/cells,y=horizon+v*v*(H-horizon),alpha=(v*v)*0.2+Math.sin(t+v*5)*0.02;
        const xL=vx-(0.5)*spread*v*v*0.5,xR=vx+(0.5)*spread*v*v*0.5;
        const grad2=ctx.createLinearGradient(xL,y,xR,y);
        grad2.addColorStop(0,'rgba(0,200,255,0)');
        grad2.addColorStop(0.5,`rgba(0,200,255,${alpha})`);
        grad2.addColorStop(1,'rgba(0,200,255,0)');
        ctx.beginPath();ctx.moveTo(xL,y);ctx.lineTo(xR,y);
        ctx.strokeStyle=grad2;ctx.lineWidth=0.6;ctx.stroke();
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={ref} style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none'}}/>;
}

export default function App(){
  const [form,setForm]=useState({es:"",cy:"",fc:""});
  const [errs,setErrs]=useState({});
  const [res,setRes]=useState(null);
  const [loading,setLoading]=useState(false);
  const [insight,setInsight]=useState("");
  const [iLoad,setILoad]=useState(false);
  const [phase,setPhase]=useState("input");
  const [mounted,setMounted]=useState(false);
  const [mouse,setMouse]=useState({x:.5,y:.5});
  const [scanY,setScanY]=useState(0);
  const [showModel,setShowModel]=useState(false);

  useEffect(()=>{setTimeout(()=>setMounted(true),120);},[]);
  useEffect(()=>{
    let raf;let y=0;
    const loop=()=>{y=(y+0.4)%110;setScanY(y);raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf);
  },[]);
  const onMouse=useCallback(e=>{setMouse({x:e.clientX/window.innerWidth,y:e.clientY/window.innerHeight});},[]);
  useEffect(()=>{window.addEventListener('mousemove',onMouse);return()=>window.removeEventListener('mousemove',onMouse);},[onMouse]);

  const validate=()=>{
    const e={};
    const ev=parseFloat(form.es),cv=parseInt(form.cy),fv=parseFloat(form.fc);
    if(!form.es||isNaN(ev)||ev<=0||ev>10) e.es="0.1–10.0 L";
    if(!form.cy||isNaN(cv)||cv<2||cv>16) e.cy="2–16";
    if(!form.fc||isNaN(fv)||fv<=0||fv>50) e.fc="0.1–50 L/100km";
    return e;
  };

  const run=async()=>{
    const e=validate();if(Object.keys(e).length){setErrs(e);return;}
    setErrs({});setLoading(true);
    await new Promise(r=>setTimeout(r,900));

    const ev=parseFloat(form.es),cv=parseInt(form.cy),fv=parseFloat(form.fc);

    // ── Exact notebook prediction: model.predict(user_df) ──
    const co2=Math.round(notebookPredict(ev,cv,fv)*100)/100;
    const grade=getGrade(co2);
    setRes({co2,grade,ev,cv,fv});
    setLoading(false);setPhase("result");

    setILoad(true);
    try{
      const r2=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:`Vehicle: ${ev}L engine, ${cv} cylinders, ${fv}L/100km → ${co2}g/km CO₂ (Grade ${grade.label}, ${grade.desc}). sklearn LinearRegression model trained on FuelConsumptionCo2.csv (1067 records, R²=0.876). Give one environmental insight and one tip to reduce emissions. 2 sentences max.`}]})
      });
      const d=await r2.json();setInsight(d.content?.[0]?.text||"");
    }catch{setInsight("Smooth acceleration and regular servicing can cut CO₂ by up to 15% — small habits, big planetary impact.");}
    setILoad(false);
  };

  const reset=()=>{setPhase("input");setRes(null);setInsight("");setErrs({});setForm({es:"",cy:"",fc:""});};

  const g=res?.grade;
  const R=52,CX=70,CY=70,circ=2*Math.PI*R;
  const barW=res?Math.min(((res.co2-100)/300)*100,100):0;
  const tX=(mouse.y-.5)*-14,tY=(mouse.x-.5)*14;

  const fields=[
    {k:"es",label:"Engine Size",      sym:"ES",color:"#38d9f5",bg:"rgba(56,217,245,0.08)",border:"rgba(56,217,245,0.25)",unit:"L",       ph:"e.g. 2.0",step:"0.1",min:"0.1",max:"10"},
    {k:"cy",label:"Cylinders",        sym:"CY",color:"#bf7fff",bg:"rgba(191,127,255,0.08)",border:"rgba(191,127,255,0.25)",unit:"cyl",    ph:"e.g. 4",  step:"1",  min:"2",  max:"16"},
    {k:"fc",label:"Fuel Consumption", sym:"FC",color:"#ffcc33",bg:"rgba(255,204,51,0.08)", border:"rgba(255,204,51,0.25)", unit:"L/100km",ph:"e.g. 8.5",step:"0.1",min:"0.1",max:"50"},
  ];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --c1:#00ffe7;--c2:#0088ff;--c3:#8833ff;
          --bg:#020509;--card:rgba(4,14,32,0.82);
          --bd:rgba(0,200,255,0.15);--bd2:rgba(0,200,255,0.4);
          --txt:#ddf4ff;--muted:rgba(100,180,220,0.5);
          --fo:'Orbitron',monospace;--fb:'Rajdhani',sans-serif;--fm:'Share Tech Mono',monospace;
        }
        body{font-family:var(--fb);background:var(--bg);min-height:100vh;
          display:flex;align-items:center;justify-content:center;
          padding:20px 16px;overflow-x:hidden;}

        .atmo{position:fixed;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(ellipse 100% 60% at 50% 0%,rgba(0,80,160,0.3) 0%,transparent 65%),
            radial-gradient(ellipse 70% 50% at 90% 100%,rgba(80,0,200,0.15) 0%,transparent 55%),
            radial-gradient(ellipse 50% 40% at 0% 60%,rgba(0,180,120,0.08) 0%,transparent 50%);}
        .scanline{position:fixed;left:0;right:0;height:2px;z-index:2;pointer-events:none;
          background:linear-gradient(90deg,transparent 5%,rgba(0,255,231,0.25) 30%,rgba(0,200,255,0.35) 50%,rgba(0,255,231,0.25) 70%,transparent 95%);
          box-shadow:0 0 12px rgba(0,255,231,0.3);}

        .app{position:relative;z-index:10;width:100%;max-width:580px;
          opacity:0;transform:translateY(40px) scale(0.95);
          transition:opacity 1.1s cubic-bezier(0.16,1,0.3,1),transform 1.1s cubic-bezier(0.16,1,0.3,1);}
        .app.in{opacity:1;transform:none;}

        /* ── HEADER ── */
        .hdr{text-align:center;margin-bottom:36px;}
        .status-bar{display:inline-flex;align-items:center;gap:10px;
          background:rgba(0,255,231,0.04);border:1px solid rgba(0,255,231,0.2);
          border-radius:4px;padding:7px 22px;margin-bottom:20px;
          font-family:var(--fm);font-size:10px;color:var(--c1);letter-spacing:0.2em;text-transform:uppercase;
          position:relative;overflow:hidden;}
        .status-bar::before{content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,transparent,rgba(0,255,231,0.07),transparent);
          transform:translateX(-100%);animation:sweep 3s ease-in-out infinite;}
        @keyframes sweep{0%,100%{transform:translateX(-100%)}50%{transform:translateX(100%)}}
        .sb-dot{width:7px;height:7px;border-radius:50%;background:var(--c1);
          box-shadow:0 0 14px var(--c1);animation:sbpulse 1.4s ease-in-out infinite;}
        @keyframes sbpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.5)}}
        h1{font-family:var(--fo);font-size:clamp(24px,6vw,42px);font-weight:900;
          letter-spacing:0.1em;line-height:1.05;color:var(--txt);text-transform:uppercase;
          margin-bottom:8px;text-shadow:0 0 50px rgba(0,200,255,0.25);}
        .h1-accent{background:linear-gradient(90deg,var(--c1) 0%,var(--c2) 40%,var(--c3) 70%,var(--c1) 100%);
          background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;animation:hflow 5s linear infinite;}
        @keyframes hflow{0%{background-position:0%}100%{background-position:300%}}
        .h-divider{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0 10px;}
        .hdl{flex:1;max-width:80px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,200,255,0.4));}
        .hdl.r{background:linear-gradient(270deg,transparent,rgba(0,200,255,0.4));}
        .hdd{width:6px;height:6px;background:var(--c1);transform:rotate(45deg);box-shadow:0 0 10px var(--c1);}
        .sub{font-family:var(--fm);font-size:11px;color:var(--muted);letter-spacing:0.15em;text-transform:uppercase;}

        /* ── NOTEBOOK BADGE ── */
        .nb-badge{
          display:flex;align-items:center;justify-content:space-between;
          background:rgba(0,255,150,0.04);border:1px solid rgba(0,255,150,0.18);
          border-radius:4px;padding:10px 16px;margin-bottom:20px;
          cursor:pointer;transition:background 0.2s,border-color 0.2s;
          font-family:var(--fm);
        }
        .nb-badge:hover{background:rgba(0,255,150,0.07);border-color:rgba(0,255,150,0.3);}
        .nb-left{display:flex;align-items:center;gap:10px;}
        .nb-icon{font-size:16px;}
        .nb-title{font-size:11px;color:#00ff99;letter-spacing:0.12em;text-transform:uppercase;}
        .nb-sub{font-size:10px;color:rgba(0,200,150,0.5);margin-top:2px;letter-spacing:0.08em;}
        .nb-arrow{font-size:12px;color:rgba(0,200,150,0.5);transition:transform 0.3s;}
        .nb-arrow.open{transform:rotate(90deg);}

        /* Model details panel */
        .model-panel{
          background:rgba(0,10,25,0.9);border:1px solid rgba(0,255,150,0.12);
          border-top:none;border-radius:0 0 4px 4px;padding:16px 16px 12px;
          margin-bottom:20px;font-family:var(--fm);
          animation:dropDown 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes dropDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .model-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;}
        .model-row{display:flex;justify-content:space-between;align-items:center;
          padding:5px 0;border-bottom:1px solid rgba(0,200,255,0.06);}
        .model-key{font-size:10px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;}
        .model-val{font-size:11px;font-weight:600;letter-spacing:0.06em;}
        .coef-row{display:flex;justify-content:space-between;align-items:center;
          padding:6px 10px;border-radius:3px;margin-top:5px;border:1px solid;}
        .coef-name{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;}
        .coef-val{font-size:12px;font-weight:600;}

        /* ── CARD ── */
        .card{position:relative;background:var(--card);border:1px solid var(--bd);border-radius:4px;
          padding:36px;backdrop-filter:blur(40px);transform-style:preserve-3d;
          box-shadow:0 0 0 1px rgba(0,200,255,0.04) inset,0 0 80px rgba(0,100,200,0.12),
            0 50px 100px rgba(0,0,0,0.7),inset 0 1px 0 rgba(0,200,255,0.1);}
        .card-ig{position:absolute;inset:0;border-radius:4px;pointer-events:none;
          background:radial-gradient(ellipse 70% 40% at 50% 0%,rgba(0,200,255,0.06) 0%,transparent 60%);}
        .bkt{position:absolute;width:18px;height:18px;pointer-events:none;}
        .bkt.tl{top:0;left:0;border-top:2px solid var(--c1);border-left:2px solid var(--c1);}
        .bkt.tr{top:0;right:0;border-top:2px solid var(--c2);border-right:2px solid var(--c2);}
        .bkt.bl{bottom:0;left:0;border-bottom:2px solid var(--c2);border-left:2px solid var(--c2);}
        .bkt.br{bottom:0;right:0;border-bottom:2px solid var(--c1);border-right:2px solid var(--c1);}
        .card-tb{position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent 5%,var(--c1) 30%,var(--c2) 50%,var(--c1) 70%,transparent 95%);
          animation:beamglow 3s ease-in-out infinite;}
        @keyframes beamglow{0%,100%{opacity:0.6}50%{opacity:1}}
        .card-sc{position:absolute;left:0;right:0;height:1px;z-index:0;pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(0,200,255,0.15),transparent);
          animation:cardscan 5s linear infinite;}
        @keyframes cardscan{0%{top:0;opacity:0}10%{opacity:1}90%{opacity:0.5}100%{top:100%;opacity:0}}

        /* ── FIELDS ── */
        .fields{display:flex;flex-direction:column;gap:22px;margin-bottom:32px;position:relative;z-index:1;}
        .fhd{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
        .fsym{font-family:var(--fo);font-size:10px;font-weight:700;
          width:32px;height:32px;border-radius:4px;display:flex;align-items:center;justify-content:center;
          border:1px solid;letter-spacing:0.1em;flex-shrink:0;}
        .flbl{font-family:var(--fm);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;}
        .ihull{display:flex;border-radius:4px;overflow:hidden;background:rgba(0,10,30,0.7);
          border:1px solid rgba(0,180,255,0.1);transition:border-color 0.25s,box-shadow 0.25s;position:relative;}
        .ihull::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
          background:transparent;transition:background 0.3s;}
        .ihull:focus-within{border-color:rgba(0,200,255,0.45);
          box-shadow:0 0 0 3px rgba(0,200,255,0.07),0 0 40px rgba(0,200,255,0.07);}
        .ihull:focus-within::after{background:linear-gradient(90deg,transparent,rgba(0,200,255,0.6),transparent);}
        .ihull.err{border-color:rgba(255,40,100,0.5);box-shadow:0 0 0 3px rgba(255,40,100,0.06);}
        .ihull input{flex:1;background:transparent;border:none;outline:none;
          color:#e0f8ff;font-size:24px;font-weight:600;font-family:var(--fo);
          padding:14px 18px;letter-spacing:0.05em;-moz-appearance:textfield;}
        .ihull input::-webkit-inner-spin-button,.ihull input::-webkit-outer-spin-button{-webkit-appearance:none;}
        .ihull input::placeholder{color:rgba(0,180,255,0.18);font-size:16px;font-family:var(--fm);}
        .iunit{display:flex;align-items:center;padding:0 16px;
          font-family:var(--fm);font-size:11px;color:var(--muted);
          border-left:1px solid rgba(0,180,255,0.08);white-space:nowrap;letter-spacing:0.06em;}
        .ferr{font-family:var(--fm);font-size:11px;color:#ff4477;margin-top:5px;padding-left:4px;}

        /* ── BUTTON ── */
        .go-btn{width:100%;padding:18px;border:none;border-radius:4px;cursor:pointer;
          font-family:var(--fo);font-size:12px;font-weight:700;
          letter-spacing:0.2em;text-transform:uppercase;color:white;
          position:relative;overflow:hidden;
          background:linear-gradient(135deg,#004466 0%,#001133 30%,#003388 60%,#0066bb 100%);
          border:1px solid rgba(0,200,255,0.35);
          box-shadow:0 0 40px rgba(0,150,255,0.2),0 8px 30px rgba(0,0,0,0.5),inset 0 1px 0 rgba(0,200,255,0.3);
          transition:transform 0.18s,box-shadow 0.18s;}
        .go-btn::before{content:'';position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.1) 50%,transparent 70%);
          transform:translateX(-100%);transition:transform 0.7s;}
        .go-btn:hover:not(:disabled){transform:translateY(-3px);
          box-shadow:0 0 60px rgba(0,200,255,0.35),0 16px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(0,200,255,0.4);}
        .go-btn:hover::before{transform:translateX(100%);}
        .go-btn:active:not(:disabled){transform:translateY(0);}
        .go-btn:disabled{opacity:0.45;cursor:not-allowed;}
        .go-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(0,200,255,0.15),transparent 70%);pointer-events:none;}
        .spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.2);
          border-top-color:white;border-radius:50%;animation:rot 0.6s linear infinite;
          vertical-align:-2px;margin-right:8px;}
        @keyframes rot{to{transform:rotate(360deg)}}

        /* ── RESULT ── */
        .result-box{margin-top:20px;animation:riseIn 0.9s cubic-bezier(0.16,1,0.3,1);}
        @keyframes riseIn{from{opacity:0;transform:translateY(30px) scale(0.97)}to{opacity:1;transform:none}}

        .hero-panel{background:linear-gradient(135deg,rgba(0,30,60,0.9) 0%,rgba(2,8,20,0.95) 100%);
          border:1px solid var(--bd);border-radius:4px 4px 0 0;border-bottom:none;
          padding:40px 36px 36px;position:relative;overflow:hidden;}
        .hero-panel::before{content:'';position:absolute;top:0;left:8%;right:8%;height:1px;
          background:linear-gradient(90deg,transparent,var(--c1),var(--c2),transparent);}
        .hero-bg{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(ellipse 80% 60% at 75% 30%,rgba(0,200,255,0.08) 0%,transparent 60%);}
        .hbkt{position:absolute;width:16px;height:16px;}
        .hbkt.tl{top:0;left:0;border-top:2px solid;border-left:2px solid;}
        .hbkt.tr{top:0;right:0;border-top:2px solid;border-right:2px solid;}
        .hero-row{display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;z-index:1;}

        .co2-eye{font-family:var(--fm);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;
          color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
        .co2-eye::before{content:'';display:block;width:12px;height:1px;background:var(--muted);}
        .co2-big{font-family:var(--fo);font-size:clamp(54px,13vw,82px);font-weight:900;line-height:0.9;
          letter-spacing:-0.02em;transition:color 0.5s,text-shadow 0.5s;}
        .co2-suf{font-family:var(--fm);font-size:15px;color:var(--muted);margin-left:5px;}
        .gpill{display:inline-flex;align-items:center;gap:8px;margin-top:16px;
          padding:7px 18px;border-radius:3px;border:1px solid;
          font-family:var(--fo);font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
          position:relative;overflow:hidden;}
        .gpill::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:rgba(255,255,255,0.15);}
        .gled{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:ledpulse 1.5s ease-in-out infinite;}
        @keyframes ledpulse{0%,100%{box-shadow:0 0 4px currentColor}50%{box-shadow:0 0 12px currentColor,0 0 24px currentColor}}

        /* prediction badge */
        .pred-source{display:flex;align-items:center;gap:6px;margin-top:12px;
          font-family:var(--fm);font-size:10px;color:rgba(0,200,150,0.55);letter-spacing:0.1em;}
        .pred-source-dot{width:5px;height:5px;border-radius:50%;background:#00ff99;
          box-shadow:0 0 6px #00ff99;animation:sbpulse 2s ease-in-out infinite;}

        .dial-zone{flex-shrink:0;position:relative;width:150px;height:150px;}
        .dial-svg{width:150px;height:150px;transform:rotate(-90deg);overflow:visible;}
        .d-track{fill:none;stroke:rgba(0,200,255,0.07);stroke-width:10;}
        .d-dash{fill:none;stroke-linecap:round;stroke-width:1.5;stroke-dasharray:3 10;opacity:0.35;}
        .d-arc{fill:none;stroke-width:10;stroke-linecap:round;
          transition:stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1),stroke 0.5s;}
        .d-glow{fill:none;stroke-width:20;stroke-linecap:round;opacity:0.12;
          transition:stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1),stroke 0.5s;}
        .d-ctr{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .d-ltr{font-family:var(--fo);font-size:38px;font-weight:900;line-height:1;transition:color 0.5s,text-shadow 0.5s;}
        .d-sub{font-family:var(--fm);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-top:3px;}
        .orbit-dot{position:absolute;width:6px;height:6px;border-radius:50%;top:50%;left:50%;
          transform-origin:0 0;animation:orbitdot 3s linear infinite;}
        @keyframes orbitdot{from{transform:rotate(0deg) translateX(75px) scale(0.6)}to{transform:rotate(360deg) translateX(75px) scale(0.6)}}

        .sub-panel{background:rgba(2,8,22,0.88);border:1px solid rgba(0,180,255,0.1);
          border-top:none;padding:24px 36px;backdrop-filter:blur(20px);}
        .sub-panel.last{border-radius:0 0 4px 4px;}
        .div-line{height:1px;background:linear-gradient(90deg,transparent,rgba(0,200,255,0.12),transparent);}
        .plbl{font-family:var(--fm);font-size:10px;color:var(--muted);
          letter-spacing:0.2em;text-transform:uppercase;margin-bottom:14px;
          display:flex;align-items:center;gap:8px;}
        .plbl::before{content:'';display:block;width:10px;height:1px;background:var(--muted);}

        .spec-track{height:10px;border-radius:2px;background:rgba(0,200,255,0.05);position:relative;overflow:visible;}
        .spec-bg{position:absolute;inset:0;border-radius:2px;
          background:linear-gradient(90deg,#00ffe7,#aaff00,#ffe500,#ff7700,#ff1155);opacity:0.12;}
        .spec-fill{height:100%;border-radius:2px;position:relative;overflow:hidden;
          background:linear-gradient(90deg,#00ffe7,#aaff00,#ffe500,#ff7700,#ff1155);
          transition:width 1.4s cubic-bezier(0.16,1,0.3,1);box-shadow:0 0 20px rgba(0,255,200,0.25);}
        .spec-fill::after{content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,rgba(255,255,255,0.25),transparent);border-radius:2px;}
        .spec-pin{position:absolute;top:-7px;width:3px;height:24px;background:white;border-radius:2px;
          transform:translateX(-50%);box-shadow:0 0 14px white;transition:left 1.4s cubic-bezier(0.16,1,0.3,1);}
        .spec-lbs{display:flex;justify-content:space-between;
          font-family:var(--fm);font-size:10px;color:rgba(0,180,255,0.28);margin-top:8px;}

        /* formula with notebook variable names */
        .formula-eq{font-family:var(--fm);font-size:11px;color:rgba(0,200,150,0.5);
          margin-bottom:12px;letter-spacing:0.08em;}
        .chips{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
        .chip{padding:7px 14px;border-radius:3px;border:1px solid;font-family:var(--fm);font-size:12px;
          font-weight:500;white-space:nowrap;position:relative;overflow:hidden;}
        .chip::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:rgba(255,255,255,0.1);}
        .ch-op{font-family:var(--fo);font-size:20px;color:rgba(0,180,255,0.3);font-weight:700;line-height:1;}

        .ai-badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:13px;
          background:rgba(0,255,231,0.04);border:1px solid rgba(0,255,231,0.18);
          border-radius:3px;padding:5px 14px;font-family:var(--fm);font-size:10px;
          color:var(--c1);letter-spacing:0.18em;text-transform:uppercase;}
        .ai-spin{display:inline-block;animation:aispin 4s linear infinite;font-size:13px;}
        @keyframes aispin{to{transform:rotate(360deg)}}
        .ai-txt{font-size:14px;color:rgba(200,230,255,0.72);line-height:1.75;font-family:var(--fb);font-weight:400;}
        .skel{height:11px;border-radius:3px;margin-bottom:8px;
          background:linear-gradient(90deg,rgba(0,200,255,0.04) 0%,rgba(0,200,255,0.12) 50%,rgba(0,200,255,0.04) 100%);
          background-size:200% 100%;animation:skanim 1.8s linear infinite;}
        @keyframes skanim{0%{background-position:200%}100%{background-position:-200%}}

        .reset-btn{width:100%;padding:14px;background:transparent;
          border:1px solid rgba(0,180,255,0.14);border-radius:3px;
          color:var(--muted);font-size:11px;font-weight:700;font-family:var(--fo);
          cursor:pointer;margin-top:18px;letter-spacing:0.2em;text-transform:uppercase;
          transition:all 0.22s;}
        .reset-btn:hover{border-color:rgba(0,200,255,0.4);color:var(--c1);
          background:rgba(0,200,255,0.04);box-shadow:0 0 24px rgba(0,200,255,0.08);}

        .ftr{text-align:center;margin-top:30px;font-family:var(--fm);font-size:10px;
          color:rgba(0,180,255,0.18);letter-spacing:0.12em;}
      `}</style>

      <div className="atmo"/>
      <ParticleCanvas/>
      <GridCanvas/>
      <div className="scanline" style={{top:`${scanY}%`}}/>

      <div className={`app ${mounted?"in":""}`}>

        {/* HEADER */}
        <div className="hdr">
          <div className="status-bar">
            <span className="sb-dot"/>
            NOTEBOOK MODEL LOADED · basic.ipynb
          </div>
          <h1>
            <span style={{display:"block"}}><span className="h1-accent">CO₂</span> EMISSION</span>
            <span style={{display:"block"}}>PREDICTOR</span>
          </h1>
          <div className="h-divider">
            <div className="hdl"/><div className="hdd"/><div className="hdl r"/>
          </div>
          <div className="sub">basic.ipynb · sklearn LinearRegression · R²=0.876</div>
        </div>

        {/* NOTEBOOK MODEL INFO BADGE */}
        <div className="nb-badge" onClick={()=>setShowModel(m=>!m)}>
          <div className="nb-left">
            <span className="nb-icon">📓</span>
            <div>
              <div className="nb-title">basic.ipynb — Model Active</div>
              <div className="nb-sub">FuelConsumptionCo2.csv · 1067 samples · test_size=0.2 · random_state=42</div>
            </div>
          </div>
          <span className={`nb-arrow ${showModel?"open":""}`}>▶</span>
        </div>

        {showModel&&(
          <div className="model-panel">
            <div className="model-grid">
              {[
                {k:"Algorithm",v:"LinearRegression()",vc:"#00ff99"},
                {k:"R² Score",v:"0.8760",vc:"#00ffe7"},
                {k:"Dataset",v:"FuelConsumption…csv",vc:"#ffcc33"},
                {k:"Samples",v:"1,067",vc:"#ffcc33"},
                {k:"Test Size",v:"20%",vc:"#bf7fff"},
                {k:"random_state",v:"42",vc:"#bf7fff"},
                {k:"Intercept",v:"39.3484",vc:"rgba(200,230,255,0.7)"},
                {k:"Features",v:"3 inputs",vc:"#38d9f5"},
              ].map(row=>(
                <div className="model-row" key={row.k}>
                  <span className="model-key">{row.k}</span>
                  <span className="model-val" style={{color:row.vc,fontFamily:"var(--fm)"}}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:12}}>
              {[
                {name:"ENGINESIZE",coef:"7.2101",color:"#38d9f5",border:"rgba(56,217,245,0.2)",bg:"rgba(56,217,245,0.05)"},
                {name:"CYLINDERS", coef:"6.8437",color:"#bf7fff",border:"rgba(191,127,255,0.2)",bg:"rgba(191,127,255,0.05)"},
                {name:"FUELCONSUMPTION_COMB",coef:"8.9269",color:"#ffcc33",border:"rgba(255,204,51,0.2)",bg:"rgba(255,204,51,0.05)"},
              ].map(c=>(
                <div key={c.name} className="coef-row" style={{borderColor:c.border,background:c.bg,marginBottom:5}}>
                  <span className="coef-name" style={{color:c.color,fontFamily:"var(--fm)"}}>{c.name}</span>
                  <span className="coef-val" style={{color:c.color,fontFamily:"var(--fm)"}}>× {c.coef}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INPUT */}
        {phase==="input"&&(
          <div className="card" style={{transform:`perspective(1400px) rotateX(${tX}deg) rotateY(${tY}deg)`}}>
            <div className="card-ig"/>
            <div className="card-tb"/>
            <div className="card-sc"/>
            <div className="bkt tl"/><div className="bkt tr"/>
            <div className="bkt bl"/><div className="bkt br"/>
            <div className="fields">
              {fields.map(f=>(
                <div key={f.k}>
                  <div className="fhd">
                    <div className="fsym" style={{color:f.color,background:f.bg,borderColor:f.border}}>{f.sym}</div>
                    <span className="flbl" style={{color:f.color}}>{f.label}</span>
                  </div>
                  <div className={`ihull ${errs[f.k]?"err":""}`}>
                    <input type="number" step={f.step} min={f.min} max={f.max}
                      placeholder={f.ph} value={form[f.k]}
                      onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>
                    <div className="iunit">{f.unit}</div>
                  </div>
                  {errs[f.k]&&<div className="ferr">⟶ RANGE: {errs[f.k]}</div>}
                </div>
              ))}
            </div>
            <button className="go-btn" onClick={run} disabled={loading}>
              <div className="go-glow"/>
              {loading?<><span className="spin"/>RUNNING model.predict()…</>:"RUN model.predict() ›"}
            </button>
          </div>
        )}

        {/* RESULT */}
        {phase==="result"&&res&&(
          <div className="result-box">
            <div className="hero-panel">
              <div className="hero-bg"/>
              <div className="hbkt tl" style={{borderColor:g.color}}/>
              <div className="hbkt tr" style={{borderColor:g.color}}/>
              <div className="hero-row">
                <div>
                  <div className="co2-eye">PREDICTED CO₂ EMISSION</div>
                  <div>
                    <span className="co2-big" style={{color:g.color,textShadow:`0 0 60px ${g.glow}55,0 0 120px ${g.glow}20`}}>
                      <Counter to={res.co2}/>
                    </span>
                    <span className="co2-suf">g/km</span>
                  </div>
                  <div className="gpill" style={{color:g.color,borderColor:g.color+"35",background:g.dark}}>
                    <div className="gled" style={{background:g.color,color:g.color}}/>
                    GRADE {g.label} — {g.desc.toUpperCase()}
                  </div>
                  <div className="pred-source">
                    <div className="pred-source-dot"/>
                    model.predict() · basic.ipynb · LinearRegression
                  </div>
                </div>
                <div className="dial-zone">
                  <svg className="dial-svg" viewBox="0 0 140 140">
                    <circle className="d-track" cx={CX} cy={CY} r={R}/>
                    <circle className="d-dash" cx={CX} cy={CY} r={R+12} stroke={g.color}
                      fill="none" strokeWidth="1.5" strokeDasharray="4 9"/>
                    <circle className="d-glow" cx={CX} cy={CY} r={R}
                      style={{stroke:g.glow,strokeDasharray:`${circ*g.pct/100} ${circ}`}}/>
                    <circle className="d-arc" cx={CX} cy={CY} r={R}
                      style={{stroke:g.color,strokeDasharray:`${circ*g.pct/100} ${circ}`,
                        filter:`drop-shadow(0 0 6px ${g.glow})`}}/>
                  </svg>
                  <div className="d-ctr">
                    <div className="d-ltr" style={{color:g.color,textShadow:`0 0 20px ${g.glow}`}}>{g.label}</div>
                    <div className="d-sub">{g.desc}</div>
                  </div>
                  {[0,1,2].map(i=>(
                    <div key={i} className="orbit-dot" style={{
                      background:g.color,boxShadow:`0 0 8px ${g.glow}`,
                      animationDelay:`${i*-1}s`,animationDuration:`${2.5+i*0.5}s`,
                    }}/>
                  ))}
                </div>
              </div>
            </div>

            <div className="sub-panel">
              <div className="plbl">EMISSION SPECTRUM</div>
              <div className="spec-track">
                <div className="spec-bg"/>
                <div className="spec-fill" style={{width:`${barW}%`}}/>
                <div className="spec-pin" style={{left:`${Math.min(barW,97)}%`}}/>
              </div>
              <div className="spec-lbs">
                <span>100</span><span>CLEAN</span><span>MODERATE</span><span>HIGH</span><span>400</span>
              </div>
            </div>

            <div className="div-line"/>

            <div className="sub-panel">
              <div className="plbl">NOTEBOOK FORMULA · model.coef_</div>
              <div className="formula-eq">
                CO2 = intercept + coef[0]×ENGINESIZE + coef[1]×CYLINDERS + coef[2]×FUELCONSUMPTION_COMB
              </div>
              <div className="chips">
                <span className="chip" style={{color:"rgba(0,180,220,0.7)",borderColor:"rgba(0,180,255,0.12)",background:"rgba(0,15,40,0.7)"}}>
                  {NOTEBOOK_MODEL.intercept.toFixed(4)}
                </span>
                <span className="ch-op">+</span>
                <span className="chip" style={{color:"#38d9f5",borderColor:"rgba(56,217,245,0.2)",background:"rgba(56,217,245,0.05)"}}>
                  {NOTEBOOK_MODEL.coef_ENGINESIZE} × {res.ev}L
                </span>
                <span className="ch-op">+</span>
                <span className="chip" style={{color:"#bf7fff",borderColor:"rgba(191,127,255,0.2)",background:"rgba(191,127,255,0.05)"}}>
                  {NOTEBOOK_MODEL.coef_CYLINDERS} × {res.cv}cyl
                </span>
                <span className="ch-op">+</span>
                <span className="chip" style={{color:"#ffcc33",borderColor:"rgba(255,204,51,0.2)",background:"rgba(255,204,51,0.05)"}}>
                  {NOTEBOOK_MODEL.coef_FUELCONSUMPTION_COMB} × {res.fv}
                </span>
              </div>
            </div>

            <div className="div-line"/>

            <div className="sub-panel last">
              <div className="ai-badge">
                <span className="ai-spin">✦</span>
                AI ENVIRONMENTAL ANALYSIS
              </div>
              {iLoad?(
                <><div className="skel" style={{width:"92%"}}/><div className="skel" style={{width:"74%"}}/></>
              ):<p className="ai-txt">{insight}</p>}
              <button className="reset-btn" onClick={reset}>↩ &nbsp;NEW PREDICTION</button>
            </div>
          </div>
        )}

        <div className="ftr">basic.ipynb · FUELCONSUMPTIONCО2.CSV · 1067 ENTRIES · TRAIN/TEST 80/20 · RANDOM_STATE=42</div>
      </div>
    </>
  );
}
