import { useState } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const GUNS = [
  {id:1,name:"6.5 Creedmoor",full:"Custom 6.5CM Bolt Rifle",cal:"6.5 Creedmoor",barrelLife:3000,cleanEvery:250,svcEvery:1500},
  {id:2,name:"Staccato P",full:"Staccato P 2011",cal:"9mm",barrelLife:40000,cleanEvery:800,svcEvery:5000},
  {id:3,name:"AR-15",full:"Custom AR-15",cal:"5.56mm NATO",barrelLife:20000,cleanEvery:400,svcEvery:2000},
  {id:4,name:"A400 Xcel",full:"Beretta A400 Xcel",cal:"12 Gauge",barrelLife:50000,cleanEvery:350,svcEvery:3000},
  {id:5,name:"700 SPS",full:"Remington 700 SPS",cal:".308 Win",barrelLife:5000,cleanEvery:200,svcEvery:1500},
];

const ORDERS = [
  {id:1,gunId:1,type:"Upgrade",status:"Complete",priority:"Medium",title:"Timney 510 Trigger Install",desc:"Replaced factory trigger. Pull weight set to 8oz.",parts:"Timney 510",cost:245,date:"2025-11-15",notes:"8.2oz measured after 500rd break-in."},
  {id:2,gunId:1,type:"Issue",status:"In Progress",priority:"High",title:"Inconsistent Bolt Lift",desc:"Occasional resistance on handloads. Headspace change after barrel swap?",parts:"Headspace gauges",cost:0,date:"2026-02-20",notes:"Go gauge chambers fine. Tenon torque verified at 80ft-lbs."},
  {id:3,gunId:2,type:"Upgrade",status:"Open",priority:"Medium",title:"Dawson Precision Sight Install",desc:"Fiber optic front and competition rear for USPSA Open.",parts:"Dawson FO .300, Carry 1 Rear",cost:110,date:"2026-03-01",notes:"Parts on order. Need MGW sight pusher."},
  {id:4,gunId:4,type:"Maintenance",status:"Complete",priority:"Low",title:"Annual Gas System Service",desc:"Full A400 gas service. Cleaned piston, replaced O-ring.",parts:"A400 O-ring kit",cost:22,date:"2025-09-10",notes:"Heavy carbon. Slip 2000. Action smoother."},
  {id:5,gunId:5,type:"Issue",status:"Open",priority:"High",title:"Ejector Failure",desc:"Ejector stopped functioning. Manual extraction required.",parts:"700 ejector plunger + spring",cost:18,date:"2026-01-12",notes:"~2,800 rounds. Parts ordered."},
];

const SESSIONS = [
  {id:101,gunId:1,date:"2025-09-12",rounds:40,dist:200,moa:0.45,cond:"Calm",issues:[],notes:"New barrel break-in.",cleaned:false},
  {id:102,gunId:1,date:"2025-10-04",rounds:60,dist:300,moa:0.50,cond:"10mph wind",issues:[],notes:"Wind call practice.",cleaned:true},
  {id:103,gunId:1,date:"2025-11-01",rounds:80,dist:400,moa:0.52,cond:"Calm",issues:[],notes:"NRL practice day.",cleaned:false},
  {id:104,gunId:1,date:"2025-12-14",rounds:50,dist:200,moa:0.58,cond:"Cold 28°F",issues:["flier"],notes:"Fliers in cold.",cleaned:true},
  {id:105,gunId:1,date:"2026-01-18",rounds:75,dist:300,moa:0.71,cond:"15mph wind",issues:["group_opening"],notes:"Groups larger. Wind or me?",cleaned:false},
  {id:106,gunId:1,date:"2026-02-08",rounds:90,dist:400,moa:0.88,cond:"Calm",issues:["group_opening","vertical"],notes:"Vertical stringing on a calm day.",cleaned:false},
  {id:107,gunId:1,date:"2026-03-01",rounds:55,dist:200,moa:0.92,cond:"Calm",issues:["group_opening","vertical"],notes:"Still vertical at 200yd. Not wind.",cleaned:false},
  {id:201,gunId:2,date:"2025-10-10",rounds:200,dist:25,moa:null,cond:"Indoor",issues:[],notes:"USPSA classifier.",cleaned:false},
  {id:202,gunId:2,date:"2025-11-22",rounds:350,dist:25,moa:null,cond:"Indoor",issues:["fte"],notes:"Single FTE at round 280.",cleaned:true},
  {id:203,gunId:2,date:"2026-01-11",rounds:300,dist:25,moa:null,cond:"Outdoor",issues:[],notes:"Steel challenge. Smooth.",cleaned:false},
  {id:204,gunId:2,date:"2026-02-28",rounds:250,dist:25,moa:null,cond:"Indoor",issues:[],notes:"USPSA match. 3rd overall.",cleaned:false},
  {id:401,gunId:4,date:"2025-09-20",rounds:100,dist:null,moa:null,cond:"Sunny",issues:[],notes:"Trap. 82/100.",cleaned:false},
  {id:402,gunId:4,date:"2025-10-18",rounds:150,dist:null,moa:null,cond:"Overcast",issues:[],notes:"Sporting clays league.",cleaned:true},
  {id:403,gunId:4,date:"2025-12-06",rounds:200,dist:null,moa:null,cond:"Cold 34°F",issues:["soft_cycle"],notes:"Soft cycling. Gas piston carboned.",cleaned:false},
  {id:404,gunId:4,date:"2026-02-15",rounds:150,dist:null,moa:null,cond:"55°F",issues:[],notes:"Post-service. Smooth.",cleaned:true},
  {id:501,gunId:5,date:"2025-09-05",rounds:20,dist:100,moa:0.80,cond:"Calm",issues:[],notes:"Pre-season zero.",cleaned:true},
  {id:502,gunId:5,date:"2025-10-20",rounds:5,dist:100,moa:0.90,cond:"Calm",issues:[],notes:"Field confirmation.",cleaned:false},
  {id:503,gunId:5,date:"2026-01-12",rounds:15,dist:100,moa:1.20,cond:"Calm",issues:["ejector"],notes:"Ejector failure. Out of service.",cleaned:false},
];

const TRACKS = [
  {id:"foundation",name:"Foundation",desc:"Core fundamentals before specialty work",skills:[
    {id:"f1",name:"Safety & Shop Practices",hours:4,desc:"Range safety, OSHA compliance, chemical handling, fire suppression.",res:["NRA Gunsmithing Course – Module 1","OSHA 10 General Industry"]},
    {id:"f2",name:"Tool ID & Proper Use",hours:8,desc:"Files, reamers, gauges, presses, lathes — identification and correct application.",res:["Brownells Gunsmithing Tools Guide","AGI Tool Use Course"]},
    {id:"f3",name:"Firearm Nomenclature",hours:6,desc:"Parts names, functions, and interaction across pistols, rifles, and shotguns.",res:["NRA Armorer Manuals","Kuhnhausen Shop Manuals"]},
    {id:"f4",name:"Detail Strip & Assembly",hours:10,desc:"AR-15, 1911, Glock, bolt actions — field and detail strip with confidence.",res:["Manufacturer Armorer Courses","Brownells Armorer Video Series"]},
    {id:"f5",name:"Metal Properties & Finishes",hours:12,desc:"Steel alloys, heat treatment, bluing, Parkerizing, Cerakote basics.",res:["Machinery's Handbook","Cerakote H-Series Applicator Training"]},
    {id:"f6",name:"Measurement & Tolerances",hours:8,desc:"Calipers, micrometers, bore gauges, headspace gauges.",res:["Starrett Precision Measurement Guide","Brownells Headspace Gauging Video"]},
    {id:"f7",name:"Screws, Threads & Fasteners",hours:4,desc:"Metric vs imperial, thread pitch, firearm thread standards, torque specs.",res:["Machinery's Handbook – Fasteners Chapter","Wheeler Engineering Torque Guide"]},
  ]},
  {id:"precision",name:"Precision Rifles",desc:"Bolt-action work for PRS/NRL performance",skills:[
    {id:"p1",name:"Trigger Service & Adjustment",hours:8,desc:"Disassembly, spring replacement, pull weight adjustment — 700, Tikka, custom actions.",res:["Timney Install Guide","Geissele Drop-In Instructions"]},
    {id:"p2",name:"Scope Mounting & Lapping",hours:6,desc:"Ring lapping, level mounting, torque specs, MOA/MIL base selection.",res:["Nightforce Scope Mounting Guide","Wheeler Engineering Lapping Kit"]},
    {id:"p3",name:"Stock Bedding",hours:16,desc:"Pillar bedding, full glass bed with Devcon 10110, free-floating barrel work.",res:["Brownells Bedding Video Series","Kirby Allen's Bedding Guide (6mmbr.com)"]},
    {id:"p4",name:"Barrel Threading & Crown Work",hours:20,desc:"11-degree & target crown work, threading for suppressors/brakes.",res:["AGI Barrel Work Course","Brownells Crown Video Series"]},
    {id:"p5",name:"Headspace Gauging & Setting",hours:10,desc:"Go/No-Go/Field gauges, measuring and setting headspace.",res:["SAAMI Headspace Standards","Clymer/Manson Reamer Guides"]},
    {id:"p6",name:"Rebarreling (Bolt Action)",hours:40,desc:"Remove factory barrel, face receiver, install and time new barrel, set headspace.",res:["AGI Rebarreling Course","PT&G Action Wrench Instructions"]},
    {id:"p7",name:"Chassis & Stock Fitting",hours:8,desc:"Chassis installation, inlet work, adjustable LOP and cheekpiece.",res:["MDT Chassis Install Guide","KRG Bravo Chassis Documentation"]},
    {id:"p8",name:"Custom Bolt Knob Install",hours:6,desc:"Turning, threading, Loctite method, Badger/Kelbly/PTG installation.",res:["Brownells Bolt Knob Video","PTG Bolt Knob Product Guide"]},
  ]},
  {id:"pistols",name:"Semi-Auto Pistols",desc:"1911, 2011, Glock — competition and defense",skills:[
    {id:"pi1",name:"1911/2011 Trigger Job",hours:16,desc:"Sear/hammer geometry, disconnector engagement, over-travel stop.",res:["Kuhnhausen 1911 Shop Manual Vol 1&2","Cylinder & Slide Trigger Job Video"]},
    {id:"pi2",name:"Barrel Fitting",hours:12,desc:"Link fitting, barrel hood fitting, barrel-to-bushing fit.",res:["Kuhnhausen Manual","Brownells Barrel Fitting Course"]},
    {id:"pi3",name:"Sight Installation",hours:6,desc:"Dovetail cutting, front sight staking, Heinie/Novak/Dawson/Glock install.",res:["MGW Sight Pusher Guide","Brownells Sight Installation Videos"]},
    {id:"pi4",name:"Glock Modifications",hours:8,desc:"Connector work, trigger bar polishing, extended controls, stippling.",res:["Glock Armorer Course Manual","Lone Wolf/ZEV Tech Guides"]},
    {id:"pi5",name:"Grip Work & Stippling",hours:10,desc:"Frame stippling, G10 panels, Talon grips — competition and duty.",res:["Talon Grips Application Guide","Charlie's Custom Clones – Stippling Tutorial"]},
    {id:"pi6",name:"Compensator Installation",hours:8,desc:"Thread timing, port cutting for integrated comps, USPSA division legality.",res:["Agency Arms/KKM Comp Install Guides","USPSA Division Rules"]},
    {id:"pi7",name:"Magazine Work",hours:4,desc:"Follower replacement, spring tuning, base pad install, release tuning.",res:["MBX/STI/Mec-Gar Technical Bulletins"]},
  ]},
  {id:"shotguns",name:"Shotguns",desc:"O/U, semi-auto, pump — clay sports focus",skills:[
    {id:"s1",name:"Choke Service & Installation",hours:6,desc:"Cleaning, extended choke install, thread repair, selection by discipline.",res:["Carlson's Choke Selection Guide","Kicks Industries Technical Data"]},
    {id:"s2",name:"Pump Action Service",hours:8,desc:"Full disassembly, wear inspection, action bar work, extractor service.",res:["Remington 870 Armorer Manual","Mossberg 500 Service Manual"]},
    {id:"s3",name:"Semi-Auto Shotgun Service",hours:12,desc:"Gas system cleaning, piston/seal replacement, inertia troubleshooting.",res:["Beretta A400 Armorer Manual","Benelli Inertia System Documentation"]},
    {id:"s4",name:"Stock Fitting & Adjustment",hours:10,desc:"Cast, drop, LOP for clay sports — shims, recoil pads, spacers.",res:["Briley Fit System Guide","Graco Stock Fitting Documentation"]},
    {id:"s5",name:"O/U Trigger & Timing",hours:20,desc:"Single/double trigger work, barrel regulation, timing the inertia block.",res:["Perazzi & Browning Service Manuals","AGI Over-Under Shotgun Course"]},
    {id:"s6",name:"Recoil Pad Fitting",hours:6,desc:"Grinding, fitting, adhesive methods, Pachmayr/Limbsaver installation.",res:["Brownells Recoil Pad Installation Guide"]},
  ]},
  {id:"advanced",name:"Advanced",desc:"Machining and specialty skills",skills:[
    {id:"a1",name:"Lathe Operations",hours:80,desc:"Turning, facing, threading, boring — barrel work, tenon cutting, receiver facing.",res:["Machinery's Handbook","AGI Lathe Operations Course","South Bend Lathe Manual"]},
    {id:"a2",name:"Milling Operations",hours:60,desc:"Dovetail cutting, Picatinny rail milling, slide serrations, scope cuts.",res:["Bridgeport Mill Operations Guide","AGI Milling for Gunsmiths Course"]},
    {id:"a3",name:"Cerakote Application",hours:20,desc:"Surface prep, spray technique, cure temps/times, multi-color and stencil.",res:["Cerakote H-Series Applicator Training"]},
    {id:"a4",name:"TIG Welding",hours:40,desc:"Receiver rails, bolt handles, front sights, safety selectors — stainless and chrome-moly.",res:["Lincoln Electric TIG Welding Course","Brownells TIG Series"]},
    {id:"a5",name:"AR Platform Advanced",hours:20,desc:"Barrel install/headspace, BCG repair, feed ramp work, suppressor builds.",res:["Colt LE6920 Armorer Manual","CMMG Armorer Guide"]},
    {id:"a6",name:"Suppressor Service",hours:16,desc:"Disassembly, baffle cleaning, weld inspection, end cap removal.",res:["SilencerCo Service Documentation","Dead Air Service Manual"]},
    {id:"a7",name:"Hot Blueing & Rust Blue",hours:24,desc:"Cold blue, hot caustic blue, rust blue process, polishing for mirror finish.",res:["Brownells Blue & Black Solutions Guide","AGI Metal Finishing Course"]},
    {id:"a8",name:"Dangerous Game Rifles",hours:30,desc:"Double rifle regulation, reliability mods, controlled-round feed conversion.",res:["Rigby/Westley Richards Technical Notes","Dakota Arms Service Documentation"]},
  ]},
];

const ISSUE_MAP = {group_opening:"Group Opening",vertical:"Vertical Stringing",flier:"Fliers",fte:"FTE",ftf:"FTF",ejector:"Ejector Failure",soft_cycle:"Soft Cycling",trigger:"Trigger Issue"};
const CONDITIONS = ["Calm","5–10mph wind","10–15mph wind","Indoor","Cold <35°F","Hot >85°F"];
const LEVELS = ["Not started","Learning","Practicing","Proficient","Mastered"];

const mono = {fontFamily:"'JetBrains Mono',monospace"};
const oswald = {fontFamily:"'Oswald',sans-serif"};

function getMaint(gun, sessions) {
  const gs = sessions.filter(s=>s.gunId===gun.id).sort((a,b)=>a.date.localeCompare(b.date));
  const total = gs.reduce((s,x)=>s+x.rounds,0);
  const ri = [...gs].reverse().findIndex(s=>s.cleaned);
  const sinceClean = ri===-1 ? total : gs.slice(gs.length-ri).reduce((s,x)=>s+x.rounds,0);
  return {
    total, sinceClean, sinceService:total,
    barrelPct: Math.min(100,Math.round(total/gun.barrelLife*100)),
    cleanDue: sinceClean >= gun.cleanEvery,
    svcDue: total >= gun.svcEvery,
  };
}

const T = {
  bg:"#080810", surf:"#0D0D20", border:"#1E1E35",
  text:"#E2E2E2", sub:"#6B7280", dim:"#374151",
  red:"#c0392b", redBg:"rgba(192,57,43,0.08)",
};

const s = {
  card: {background:T.surf, borderRadius:6, padding:"12px 14px"},
  lbl: {...mono, fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:T.sub, marginBottom:3},
  tag: {fontSize:9, padding:"2px 7px", borderRadius:3, border:`0.5px solid ${T.border}`, color:T.sub, display:"inline-block", letterSpacing:"0.04em"},
  div: {border:"none", borderTop:`0.5px solid ${T.border}`, margin:"12px 0"},
  inp: {...mono, fontSize:11, background:T.bg, border:`0.5px solid ${T.border}`, color:T.text, padding:"6px 8px", borderRadius:3, width:"100%", outline:"none"},
};

function Tag({children, alert, sel, style={}}) {
  return <span style={{...s.tag, ...(alert?{borderColor:`${T.red}55`,color:T.red,background:T.redBg}:{}), ...(sel?{borderColor:T.sub,color:T.text}:{}), ...style}}>{children}</span>;
}

function PctBar({pct}) {
  const color = pct>=90?T.red:pct>=70?"#b7780a":T.sub;
  return <div style={{height:3,background:T.dim,borderRadius:2,overflow:"hidden"}}>
    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.3s"}}/>
  </div>;
}

function Sparkline({vals, w=160, h=30}) {
  if(vals.length<2) return null;
  const mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||0.01;
  const pts = vals.map((v,i)=>{
    const x=(i/(vals.length-1))*w;
    const y=h-((v-mn)/rng)*(h-6)-3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const rising = vals[vals.length-1] > vals[0];
  const lc = rising ? T.red : "#27ae60";
  return <svg width={w} height={h} style={{display:"block",overflow:"visible",flexShrink:0}}>
    <polyline points={pts} fill="none" stroke={lc} strokeWidth="1.5" strokeLinejoin="round"/>
    {vals.map((v,i)=>{
      const x=(i/(vals.length-1))*w, y=h-((v-mn)/rng)*(h-6)-3;
      return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.2" fill={i===vals.length-1?lc:T.surf} stroke={lc} strokeWidth="1.2"/>;
    })}
  </svg>;
}

function Btn({children, onClick, primary, disabled, style={}, small}) {
  return <button onClick={onClick} disabled={disabled} style={{
    ...mono, fontSize:small?9:10, letterSpacing:"0.08em", padding:small?"4px 10px":"6px 14px",
    border:`0.5px solid ${T.border}`, background:primary?T.text:"none", color:primary?T.bg:T.text,
    cursor:disabled?"not-allowed":"pointer", borderRadius:3, textTransform:"uppercase",
    opacity:disabled?0.4:1, transition:"opacity 0.15s", ...style,
  }}>{children}</button>;
}

// ── WORKSHOP ─────────────────────────────────────────────────────────────────
function Workshop({orders, setOrders}) {
  const [filterGun, setFilterGun] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({gunId:"",type:"Maintenance",status:"Open",priority:"Medium",title:"",desc:"",parts:"",cost:"",date:new Date().toISOString().split("T")[0],notes:""});

  const filtered = orders.filter(o=>{
    if(filterGun!=="all"&&o.gunId!==parseInt(filterGun)) return false;
    if(filterStatus!=="all"&&o.status!==filterStatus) return false;
    if(filterType!=="all"&&o.type!==filterType) return false;
    return true;
  });
  const open = orders.filter(o=>o.status==="Open").length;
  const inProg = orders.filter(o=>o.status==="In Progress").length;
  const complete = orders.filter(o=>o.status==="Complete").length;
  const cost = orders.reduce((s,o)=>s+(Number(o.cost)||0),0);

  const selStyle = {...mono,fontSize:10,padding:"5px 8px",background:T.bg,border:`0.5px solid ${T.border}`,color:T.text,borderRadius:3,width:"auto"};

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:16}}>
      {[{l:"Open",v:open,alert:open>0},{l:"In progress",v:inProg},{l:"Complete",v:complete},{l:"Parts cost",v:"$"+cost}].map(x=>(
        <div key={x.l} style={s.card}>
          <div style={{fontSize:18,fontWeight:500,color:x.alert?T.red:T.text}}>{x.v}</div>
          <div style={{...s.lbl,marginTop:3}}>{x.l}</div>
        </div>
      ))}
    </div>

    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <select value={filterGun} onChange={e=>setFilterGun(e.target.value)} style={selStyle}>
          <option value="all">All firearms</option>
          {GUNS.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selStyle}>
          <option value="all">All status</option>
          {["Open","In Progress","Complete"].map(v=><option key={v}>{v}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={selStyle}>
          <option value="all">All types</option>
          {["Issue","Upgrade","Maintenance"].map(v=><option key={v}>{v}</option>)}
        </select>
      </div>
      <Btn primary onClick={()=>setShowForm(v=>!v)}>+ New order</Btn>
    </div>

    {showForm && (
      <div style={{...s.card,border:`0.5px solid ${T.border}`,marginBottom:14}}>
        <div style={{...s.lbl,marginBottom:10}}>New work order</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:10}}>
          {[
            {l:"Firearm",f:"gunId",type:"sel",opts:[{v:"",l:"Select…"},...GUNS.map(g=>({v:g.id,l:g.full}))]},
            {l:"Type",f:"type",type:"sel",opts:["Maintenance","Issue","Upgrade"].map(v=>({v,l:v}))},
            {l:"Status",f:"status",type:"sel",opts:["Open","In Progress","Complete"].map(v=>({v,l:v}))},
            {l:"Priority",f:"priority",type:"sel",opts:["High","Medium","Low"].map(v=>({v,l:v}))},
            {l:"Date",f:"date",type:"date"},
            {l:"Parts cost ($)",f:"cost",type:"number"},
          ].map(({l,f,type,opts})=>(
            <div key={f}>
              <div style={s.lbl}>{l}</div>
              {type==="sel"
                ? <select value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} style={s.inp}>
                    {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                : <input type={type} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} style={s.inp}/>
              }
            </div>
          ))}
        </div>
        {[{l:"Title *",f:"title",ph:"e.g. Trigger replacement, ejector failure…"},{l:"Description",f:"desc",ph:"Describe the work needed…"},{l:"Parts / materials",f:"parts",ph:"e.g. Timney 510, extractor spring, Loctite 243…"},{l:"Notes",f:"notes",ph:"Work performed, torque specs, round count…"}].map(({l,f,ph})=>(
          <div key={f} style={{marginBottom:8}}>
            <div style={s.lbl}>{l}</div>
            <textarea rows={2} placeholder={ph} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} style={s.inp}/>
          </div>
        ))}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:6}}>
          <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn primary onClick={()=>{
            if(!form.title||!form.gunId) return;
            setOrders([...orders,{...form,id:Date.now(),gunId:parseInt(form.gunId),cost:parseFloat(form.cost)||0}]);
            setShowForm(false);
            setForm({gunId:"",type:"Maintenance",status:"Open",priority:"Medium",title:"",desc:"",parts:"",cost:"",date:new Date().toISOString().split("T")[0],notes:""});
          }}>Save order</Btn>
        </div>
      </div>
    )}

    {filtered.length===0 && <div style={{padding:"32px 0",textAlign:"center",color:T.sub,...mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>No work orders match filters</div>}
    {filtered.map(o=>{
      const gun = GUNS.find(g=>g.id===o.gunId);
      const exp = expanded===o.id;
      return <div key={o.id} style={{borderBottom:`0.5px solid ${T.border}`}}>
        <div style={{padding:"11px 0",cursor:"pointer"}} onClick={()=>setExpanded(exp?null:o.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:5,marginBottom:4,flexWrap:"wrap"}}>
                <Tag alert={o.type==="Issue"} sel={o.type==="Upgrade"}>{o.type}</Tag>
                <Tag alert={o.status==="Open"}>{o.status}</Tag>
                <Tag style={o.priority==="High"?{color:T.red,borderColor:`${T.red}44`}:{}}>{o.priority}</Tag>
              </div>
              <div style={{fontSize:12,fontWeight:500}}>{o.title}</div>
              <div style={{...mono,fontSize:10,color:T.sub,marginTop:2}}>{gun?.name} · {o.date}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
              {o.cost>0 && <div style={{...mono,fontSize:12,fontWeight:500}}>${o.cost}</div>}
              <div style={{fontSize:11,color:T.dim,marginTop:4}}>{exp?"▲":"▼"}</div>
            </div>
          </div>
        </div>
        {exp && <div style={{paddingBottom:14}}>
          {o.desc && <div style={{marginBottom:10}}><div style={s.lbl}>Description</div><div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginTop:2}}>{o.desc}</div></div>}
          {o.parts && <div style={{marginBottom:10}}><div style={s.lbl}>Parts / materials</div><div style={{...mono,fontSize:11,marginTop:2}}>{o.parts}</div></div>}
          {o.notes && <div style={{marginBottom:12}}><div style={s.lbl}>Notes</div><div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginTop:2,fontStyle:"italic"}}>{o.notes}</div></div>}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{...mono,fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:"0.08em",marginRight:4}}>Status:</span>
            {["Open","In Progress","Complete"].map(st=>(
              <button key={st} onClick={()=>setOrders(orders.map(x=>x.id===o.id?{...x,status:st}:x))} style={{...mono,fontSize:9,padding:"3px 8px",borderRadius:3,border:`0.5px solid ${T.border}`,background:o.status===st?T.text:"none",color:o.status===st?T.bg:T.sub,cursor:"pointer"}}>{st}</button>
            ))}
          </div>
        </div>}
      </div>;
    })}
  </div>;
}

// ── SESSIONS ─────────────────────────────────────────────────────────────────
function Sessions({sessions, setSessions}) {
  const [gunId, setGunId] = useState(1);
  const [subTab, setSubTab] = useState("log");
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({date:new Date().toISOString().split("T")[0],rounds:"",dist:"",moa:"",cond:"Calm",issues:[],notes:"",cleaned:false});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState(null);
  const [aiError, setAiError] = useState(null);

  const gun = GUNS.find(g=>g.id===gunId);
  const gs = sessions.filter(s=>s.gunId===gunId).sort((a,b)=>a.date.localeCompare(b.date));
  const m = getMaint(gun, sessions);
  const moaSess = gs.filter(s=>s.moa!=null);

  const selStyle = {...mono,fontSize:10,padding:"4px 8px",background:T.bg,border:`0.5px solid ${T.border}`,color:T.text,borderRadius:3};

  async function runAdvisor() {
    setAiLoading(true); setAiText(null); setAiError(null);
    const moaData = gs.filter(s=>s.moa!=null).slice(-7);
    const trend = moaData.map(s=>`${s.date}: ${s.rounds}rds @ ${s.dist||"?"}yd — ${s.moa} MOA — [${s.issues.map(i=>ISSUE_MAP[i]).join(", ")||"none"}] — "${s.notes}"`).join("\n");
    const moaVals = moaData.map(s=>s.moa);
    const prompt = `You are an expert precision gunsmith and competitive shooting coach. The shooter competes in PRS/NRL and USPSA/IPSC. Be direct and technical — no hedging.

FIREARM: ${gun.full} (${gun.cal})
TOTAL ROUNDS: ${m.total} / ${gun.barrelLife} barrel life (${m.barrelPct}% used)
ROUNDS SINCE CLEAN: ${m.sinceClean} (threshold: ${gun.cleanEvery})

SESSION HISTORY:
${trend||"No sessions."}
${moaVals.length>1?"Group trend: "+moaVals.join(" → ")+" MOA":""}
FLAGGED ISSUES: ${[...new Set(gs.flatMap(s=>s.issues))].map(i=>ISSUE_MAP[i]).join(", ")||"None"}

Provide:
1. **Diagnostic assessment** — mechanical vs shooter-induced, cite specific sessions
2. **Root causes** — top 2–3 in order of likelihood with technical explanation
3. **Maintenance tasks** — specific steps to do now (torque specs, inspection points)
4. **Shooter factors** — direct assessment
5. **Watch list** — what to monitor next 2 sessions`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const d = await r.json();
      setAiText(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(e) { setAiError("Connection failed."); }
    setAiLoading(false);
  }

  return <div>
    {/* Gun selector */}
    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
      {GUNS.map(g=>{
        const mm=getMaint(g,sessions);
        const alert=mm.cleanDue||mm.svcDue||mm.barrelPct>=75;
        return <button key={g.id} onClick={()=>{setGunId(g.id);setAiText(null);}} style={{...mono,fontSize:10,padding:"4px 10px",background:g.id===gunId?T.text:"none",color:g.id===gunId?T.bg:T.sub,border:`0.5px solid ${T.border}`,borderRadius:3,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em"}}>
          {g.name}{alert&&<span style={{color:T.red,fontSize:8}}> *</span>}
        </button>;
      })}
    </div>

    {/* Sub nav */}
    <div style={{display:"flex",borderBottom:`0.5px solid ${T.border}`,marginBottom:14}}>
      {[["log","Log"],["maintenance","Maintenance"],["advisor","Advisor"]].map(([k,l])=>(
        <button key={k} onClick={()=>setSubTab(k)} style={{...mono,fontSize:10,letterSpacing:"0.07em",padding:"6px 12px",background:"none",border:"none",borderBottom:subTab===k?`1.5px solid ${T.text}`:"1.5px solid transparent",color:subTab===k?T.text:T.sub,cursor:"pointer",textTransform:"uppercase"}}>{l}</button>
      ))}
    </div>

    {/* LOG */}
    {subTab==="log" && <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:14}}>
        {[{l:"Total rounds",v:m.total.toLocaleString()},{l:"Since clean",v:m.sinceClean,warn:m.cleanDue},{l:"Sessions",v:gs.length},{l:"Barrel life",v:m.barrelPct+"%",warn:m.barrelPct>=75}].map(x=>(
          <div key={x.l} style={s.card}>
            <div style={{fontSize:17,fontWeight:500,color:x.warn?T.red:T.text}}>{x.v}</div>
            <div style={{...s.lbl,marginTop:3}}>{x.l}{x.warn?" — due":""}</div>
          </div>
        ))}
      </div>

      {moaSess.length>=2 && (()=>{
        const vals=moaSess.slice(-6).map(s=>s.moa);
        const first=vals[0],last=vals[vals.length-1],pct=Math.round((last-first)/first*100),rising=last>first;
        return <div style={{...s.card,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{...s.lbl}}>Accuracy trend — group size (MOA)</div>
            {rising&&pct>20&&<button onClick={()=>setSubTab("advisor")} style={{...mono,fontSize:9,padding:"3px 8px",borderRadius:3,border:`0.5px solid ${T.red}44`,background:T.redBg,color:T.red,cursor:"pointer"}}>Run diagnostics</button>}
          </div>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            <Sparkline vals={vals}/>
            {[{l:"Best",v:Math.min(...vals).toFixed(2)+" MOA"},{l:"Latest",v:last.toFixed(2)+" MOA"},{l:"Change",v:(rising?"+":"")+pct+"%",alert:rising&&pct>20}].map(x=>(
              <div key={x.l}><div style={s.lbl}>{x.l}</div><div style={{fontSize:12,fontWeight:500,color:x.alert?T.red:T.text}}>{x.v}</div></div>
            ))}
          </div>
        </div>;
      })()}

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <Btn primary onClick={()=>setShowForm(v=>!v)}>+ Log session</Btn>
      </div>

      {showForm && <div style={{...s.card,border:`0.5px solid ${T.border}`,marginBottom:14}}>
        <div style={{...s.lbl,marginBottom:10}}>New session — {gun.full}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
          <div><div style={s.lbl}>Date</div><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={s.inp}/></div>
          <div><div style={s.lbl}>Rounds</div><input type="number" value={form.rounds} placeholder="60" onChange={e=>setForm({...form,rounds:e.target.value})} style={s.inp}/></div>
          <div><div style={s.lbl}>Distance (yd)</div><input type="number" value={form.dist} placeholder="300" onChange={e=>setForm({...form,dist:e.target.value})} style={s.inp}/></div>
          <div><div style={s.lbl}>Group (MOA)</div><input type="number" step="0.01" value={form.moa} placeholder="0.55" onChange={e=>setForm({...form,moa:e.target.value})} style={s.inp}/></div>
          <div><div style={s.lbl}>Conditions</div><select value={form.cond} onChange={e=>setForm({...form,cond:e.target.value})} style={s.inp}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{...s.lbl,marginBottom:5}}>Issues observed</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {Object.entries(ISSUE_MAP).map(([v,l])=>(
              <button key={v} onClick={()=>setForm(f=>({...f,issues:f.issues.includes(v)?f.issues.filter(x=>x!==v):[...f.issues,v]}))} style={{...mono,fontSize:9,padding:"3px 8px",borderRadius:3,border:`0.5px solid ${form.issues.includes(v)?T.red:T.border}`,background:form.issues.includes(v)?T.redBg:"none",color:form.issues.includes(v)?T.red:T.sub,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:8}}><div style={s.lbl}>Notes</div><textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={s.inp}/></div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
          <input type="checkbox" id="cl" checked={form.cleaned} onChange={e=>setForm({...form,cleaned:e.target.checked})} style={{width:13,height:13,accentColor:T.text}}/>
          <label htmlFor="cl" style={{...mono,fontSize:10,color:T.sub,cursor:"pointer"}}>Cleaned after session</label>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn primary onClick={()=>{
            if(!form.rounds) return;
            setSessions(prev=>[...prev,{...form,id:Date.now(),gunId,rounds:parseInt(form.rounds)||0,dist:parseInt(form.dist)||null,moa:parseFloat(form.moa)||null}]);
            setShowForm(false); setAiText(null);
            setForm({date:new Date().toISOString().split("T")[0],rounds:"",dist:"",moa:"",cond:"Calm",issues:[],notes:"",cleaned:false});
          }}>Save</Btn>
        </div>
      </div>}

      {[...gs].reverse().map(s=>(
        <div key={s.id} style={{borderBottom:`0.5px solid ${T.border}`,padding:"10px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,marginBottom:3,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...mono,fontSize:11,fontWeight:500}}>{s.date}</span>
                <span style={{...mono,fontSize:10,color:T.sub}}>{s.rounds} rds</span>
                {s.dist&&<span style={{...mono,fontSize:10,color:T.sub}}>@ {s.dist}yd</span>}
                <Tag>{s.cond}</Tag>
                {s.cleaned&&<Tag>cleaned</Tag>}
                {s.issues.map(i=><Tag key={i} alert>{ISSUE_MAP[i]||i}</Tag>)}
              </div>
              {s.notes&&<div style={{fontSize:11,color:T.sub,lineHeight:1.5}}>{s.notes}</div>}
            </div>
            {s.moa&&<div style={{textAlign:"right",flexShrink:0,marginLeft:14}}>
              <div style={{...mono,fontSize:16,fontWeight:500,color:s.moa<0.5?"#27ae60":s.moa>0.75?T.red:T.text}}>{s.moa}</div>
              <div style={s.lbl}>MOA</div>
            </div>}
          </div>
        </div>
      ))}
      {gs.length===0&&<div style={{padding:"28px 0",textAlign:"center",color:T.sub,...mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>No sessions logged</div>}
    </>}

    {/* MAINTENANCE */}
    {subTab==="maintenance" && <>
      <div style={{...s.lbl,marginBottom:12}}>Fleet maintenance status</div>
      {GUNS.map(g=>{
        const mm=getMaint(g,sessions);
        const alerts=[mm.cleanDue&&"Clean due",mm.svcDue&&"Service due",mm.barrelPct>=75&&`Barrel ${mm.barrelPct}%`].filter(Boolean);
        return <div key={g.id} style={{borderBottom:`0.5px solid ${T.border}`,padding:"12px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <div>
              <div style={{fontSize:12,fontWeight:500}}>{g.full}</div>
              <div style={{...mono,fontSize:10,color:T.sub,marginTop:1}}>{g.cal} — {mm.total.toLocaleString()} rounds</div>
            </div>
            {alerts.length>0&&<div style={{...mono,fontSize:9,color:T.red,textTransform:"uppercase",letterSpacing:"0.08em"}}>{alerts.join(" · ")}</div>}
          </div>
          {[
            {l:"Cleaning",done:mm.sinceClean,max:g.cleanEvery,pct:Math.min(100,Math.round(mm.sinceClean/g.cleanEvery*100))},
            {l:"Service",done:mm.sinceService,max:g.svcEvery,pct:Math.min(100,Math.round(mm.sinceService/g.svcEvery*100))},
            {l:"Barrel life",done:mm.total,max:g.barrelLife,pct:mm.barrelPct},
          ].map(row=>{
            const fc=row.pct>=90?T.red:row.pct>=70?"#b7780a":T.sub;
            return <div key={row.l} style={{marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <div style={{...mono,fontSize:10,color:T.sub}}>{row.l}</div>
                <div style={{...mono,fontSize:10,color:fc}}>{row.done.toLocaleString()} / {row.max.toLocaleString()}</div>
              </div>
              <PctBar pct={row.pct}/>
            </div>;
          })}
        </div>;
      })}
    </>}

    {/* ADVISOR */}
    {subTab==="advisor" && <>
      <div style={{...s.card,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:500,marginBottom:4}}>Diagnostic analysis — {gun.full}</div>
        <div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginBottom:10}}>Analyzes session history, round counts, and flagged issues. Distinguishes shooter error from mechanical wear and gives specific maintenance steps.</div>
        <hr style={s.div}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[{l:"Sessions",v:gs.length},{l:"Group data points",v:moaSess.slice(-7).length},{l:"Issues flagged",v:[...new Set(gs.flatMap(s=>s.issues))].length}].map(x=>(
            <div key={x.l}><div style={{fontSize:15,fontWeight:500}}>{x.v}</div><div style={{...s.lbl,marginTop:2}}>{x.l}</div></div>
          ))}
        </div>
        <Btn primary disabled={aiLoading} onClick={runAdvisor} style={{width:"100%",padding:"8px"}}>
          {aiLoading?"Analyzing…":"Run full diagnostic"}
        </Btn>
      </div>
      {aiLoading&&<div style={{...s.card,textAlign:"center",padding:20}}><div style={{...mono,fontSize:10,color:T.sub,letterSpacing:"0.08em",textTransform:"uppercase"}}>Processing {gs.length} sessions · {m.total} rounds…</div></div>}
      {aiError&&<div style={{...mono,fontSize:11,color:T.red,padding:"10px 0"}}>{aiError}</div>}
      {aiText&&<div style={{borderTop:`0.5px solid ${T.border}`,paddingTop:14}}>
        <div style={{...s.lbl,marginBottom:10}}>Diagnostic report — {new Date().toLocaleDateString()}</div>
        {aiText.split("\n").map((line,i)=>{
          if(!line.trim()) return <div key={i} style={{height:5}}/>;
          const isH = /^#{1,3}\s/.test(line)||(/^\*\*[^*]+\*\*$/.test(line.trim()));
          if(isH) {
            const clean=line.replace(/^#{1,3}\s/,"").replace(/\*\*/g,"");
            return <div key={i} style={{...oswald,fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:T.text,marginTop:14,marginBottom:3,paddingBottom:4,borderBottom:`0.5px solid ${T.border}`}}>{clean}</div>;
          }
          return <div key={i} style={{fontSize:11,color:T.sub,lineHeight:1.65}} dangerouslySetInnerHTML={{__html:line.replace(/\*\*([^*]+)\*\*/g,"<strong style='color:"+T.text+"'>$1</strong>")}}/>;
        })}
      </div>}
    </>}
  </div>;
}

// ── ACADEMY ──────────────────────────────────────────────────────────────────
function Academy() {
  const [activeTrack, setActiveTrack] = useState("foundation");
  const [skillLevels, setSkillLevels] = useState(()=>{
    const o={};TRACKS.forEach(t=>t.skills.forEach(sk=>{o[sk.id]=0;}));return o;
  });
  const [expandedSkill, setExpandedSkill] = useState(null);

  const totalSkills=TRACKS.reduce((s,t)=>s+t.skills.length,0);
  const mastered=Object.values(skillLevels).filter(v=>v===4).length;
  const totalPts=Object.values(skillLevels).reduce((s,v)=>s+v,0);
  const overallPct=Math.round(totalPts/(totalSkills*4)*100);
  const totalHrs=TRACKS.reduce((s,t)=>s+t.skills.reduce((ss,sk)=>ss+sk.hours,0),0);
  const ct=TRACKS.find(t=>t.id===activeTrack);

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:16}}>
      {[{l:"Skills mastered",v:`${mastered} / ${totalSkills}`},{l:"Curriculum hours",v:`${totalHrs}h`},{l:"Overall progress",v:`${overallPct}%`}].map(x=>(
        <div key={x.l} style={s.card}>
          <div style={{fontSize:17,fontWeight:500}}>{x.v}</div>
          <div style={{...s.lbl,marginTop:3}}>{x.l}</div>
        </div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:6,marginBottom:16}}>
      {TRACKS.map(t=>{
        const tp=Math.round(t.skills.reduce((s,sk)=>s+(skillLevels[sk.id]||0),0)/(t.skills.length*4)*100);
        const act=activeTrack===t.id;
        return <div key={t.id} onClick={()=>{setActiveTrack(t.id);setExpandedSkill(null);}} style={{background:T.surf,borderRadius:6,padding:"10px 12px",cursor:"pointer",border:`0.5px solid ${act?T.sub:T.border}`,transition:"border-color 0.15s"}}>
          <div style={{fontSize:11,fontWeight:500,color:act?T.text:T.sub,marginBottom:6}}>{t.name}</div>
          <div style={{height:3,background:T.dim,borderRadius:2,overflow:"hidden",marginBottom:3}}>
            <div style={{width:`${tp}%`,height:"100%",background:T.text,borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          <div style={{...mono,fontSize:9,color:T.sub}}>{tp}%</div>
        </div>;
      })}
    </div>

    {ct&&<>
      <div style={{borderBottom:`0.5px solid ${T.border}`,paddingBottom:10,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:500}}>{ct.name}</div>
        <div style={{fontSize:11,color:T.sub,marginTop:2}}>{ct.desc}</div>
        <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
          {LEVELS.map((l,i)=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:4,...mono,fontSize:9,color:T.sub}}>
              <div style={{width:7,height:7,borderRadius:1,background:T.text,opacity:0.15+i*0.2}}/>
              {l}
            </div>
          ))}
        </div>
      </div>
      {ct.skills.map(sk=>{
        const lv=skillLevels[sk.id]||0;
        const exp=expandedSkill===sk.id;
        return <div key={sk.id} style={{borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{padding:"10px 0",cursor:"pointer"}} onClick={()=>setExpandedSkill(exp?null:sk.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:500}}>{sk.name}</div>
                  <Tag sel={lv===4}>{LEVELS[lv]}</Tag>
                </div>
                <div style={{...mono,fontSize:10,color:T.sub,marginTop:2}}>~{sk.hours}h to proficiency</div>
              </div>
              <div style={{display:"flex",gap:3,margin:"0 12px"}}>
                {[1,2,3,4].map(l=><div key={l} style={{width:9,height:9,borderRadius:1,background:lv>=l?T.text:T.dim,transition:"background 0.2s"}}/>)}
              </div>
              <div style={{fontSize:11,color:T.dim}}>{exp?"▲":"▼"}</div>
            </div>
          </div>
          {exp&&<div style={{paddingBottom:14}}>
            <div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginBottom:10}}>{sk.desc}</div>
            <div style={{marginBottom:10}}>
              <div style={{...s.lbl,marginBottom:5}}>Resources</div>
              {sk.res.map((r,i)=><div key={i} style={{fontSize:11,color:T.sub,padding:"2px 0 2px 10px",borderLeft:`0.5px solid ${T.border}`,marginBottom:3}}>{r}</div>)}
            </div>
            <div>
              <div style={{...s.lbl,marginBottom:5}}>My level</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {LEVELS.map((l,i)=>(
                  <button key={l} onClick={()=>setSkillLevels({...skillLevels,[sk.id]:i})} style={{...mono,fontSize:9,padding:"4px 10px",borderRadius:3,border:`0.5px solid ${T.border}`,background:lv===i?T.text:"none",color:lv===i?T.bg:T.sub,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</button>
                ))}
              </div>
            </div>
          </div>}
        </div>;
      })}
    </>}
  </div>;
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function GunsmithApp() {
  const [tab, setTab] = useState("workshop");
  const [orders, setOrders] = useState(ORDERS);
  const [sessions, setSessions] = useState(SESSIONS);

  const openOrders = orders.filter(o=>o.status==="Open").length;
  const alertGuns = GUNS.filter(g=>{const m=getMaint(g,sessions);return m.cleanDue||m.svcDue||m.barrelPct>=75;});

  return <div style={{fontFamily:"'JetBrains Mono',monospace",background:T.bg,minHeight:"100vh",color:T.text}}>
    <style>{FONTS}{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}textarea{resize:vertical}input[type=number]::-webkit-inner-spin-button{opacity:1}`}</style>

    {/* Header */}
    <div style={{background:T.surf,borderBottom:`0.5px solid ${T.border}`}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",padding:"14px 0 0"}}>
          <div style={{...oswald,fontSize:15,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Gunsmith</div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {alertGuns.length>0&&<span style={{...mono,fontSize:9,color:T.red,letterSpacing:"0.06em",textTransform:"uppercase"}}>{alertGuns.length} maintenance alert{alertGuns.length>1?"s":""}</span>}
            {openOrders>0&&<span style={{...mono,fontSize:9,color:T.sub,letterSpacing:"0.06em",textTransform:"uppercase"}}>{openOrders} open order{openOrders>1?"s":""}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:0,marginTop:6}}>
          {[["workshop","Workshop"],["sessions","Sessions"],["academy","Academy"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{...mono,fontSize:11,letterSpacing:"0.08em",padding:"8px 18px",background:"none",border:"none",borderBottom:tab===k?`2px solid ${T.text}`:"2px solid transparent",color:tab===k?T.text:T.sub,cursor:"pointer",textTransform:"uppercase",transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
      </div>
    </div>

    {/* Content */}
    <div style={{maxWidth:900,margin:"0 auto",padding:"20px 24px"}}>
      {tab==="workshop"&&<Workshop orders={orders} setOrders={setOrders}/>}
      {tab==="sessions"&&<Sessions sessions={sessions} setSessions={setSessions}/>}
      {tab==="academy"&&<Academy/>}
    </div>
  </div>;
}
