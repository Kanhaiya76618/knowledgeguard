import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Empty } from '../components.jsx';

function forceLayout(nodes, edges, W, H) {
  const ns = nodes.map((n, i) => ({
    ...n,
    x: W/2 + Math.cos(i/nodes.length*Math.PI*2)*W*0.28,
    y: H/2 + Math.sin(i/nodes.length*Math.PI*2)*H*0.28,
    vx:0, vy:0,
  }));
  for (let iter=0; iter<220; iter++) {
    for (let i=0; i<ns.length; i++)
      for (let j=i+1; j<ns.length; j++) {
        const dx=ns[j].x-ns[i].x, dy=ns[j].y-ns[i].y;
        const d=Math.sqrt(dx*dx+dy*dy)||1, f=4200/(d*d);
        ns[i].vx-=dx/d*f; ns[i].vy-=dy/d*f;
        ns[j].vx+=dx/d*f; ns[j].vy+=dy/d*f;
      }
    edges.forEach(e => {
      const a=ns[e.source], b=ns[e.target];
      if(!a||!b) return;
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.sqrt(dx*dx+dy*dy)||1;
      const f=(d-120)*0.07;
      a.vx+=dx/d*f; a.vy+=dy/d*f;
      b.vx-=dx/d*f; b.vy-=dy/d*f;
    });
    const cx=ns.reduce((s,n)=>s+n.x,0)/ns.length;
    const cy=ns.reduce((s,n)=>s+n.y,0)/ns.length;
    ns.forEach(n=>{n.vx+=(W/2-cx)*.04; n.vy+=(H/2-cy)*.04;});
    ns.forEach(n=>{
      n.x+=n.vx*.72; n.y+=n.vy*.72; n.vx*=.72; n.vy*=.72;
      n.x=Math.max(60,Math.min(W-60,n.x));
      n.y=Math.max(30,Math.min(H-30,n.y));
    });
  }
  return ns;
}

function nodeCategory(n) {
  if (n.is_god) return 'god';
  if (n.degree >= 5) return 'hub';
  const lbl = n.label||'';
  if (lbl.startsWith('test_')||lbl.includes('.test.')||lbl.includes('spec')) return 'test';
  if (n.is_large) return 'large';
  return 'standard';
}

const CAT = {
  god:      {color:'#ef4444', filter:'url(#g-red)',  label:'GOD FILE',  risk:'CRITICAL', riskColor:'#ef4444'},
  hub:      {color:'#00b4d8', filter:'url(#g-cyan)', label:'CORE HUB',  risk:'HIGH',     riskColor:'#f59e0b'},
  test:     {color:'#3b82f6', filter:'url(#g-blue)', label:'TEST FILE', risk:'LOW',      riskColor:'#10b981'},
  large:    {color:'#f59e0b', filter:'url(#g-amb)',  label:'OVERSIZED', risk:'MEDIUM',   riskColor:'#3b82f6'},
  standard: {color:'#334155', filter:'url(#g-soft)', label:'MODULE',    risk:'LOW',      riskColor:'#10b981'},
};

function nodeR(n) {
  return Math.max(7, Math.min(22, 7 + n.degree*2 + ((n.loc||0)/160)));
}

export default function ArchMap({ mapData }) {
  const wrapRef = useRef(null);
  const dragRef = useRef({active:false, lastX:0, lastY:0});
  const [laid,     setLaid]     = useState(null);
  const [pan,      setPan]      = useState({x:0,y:0});
  const [zoom,     setZoom]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [dims,     setDims]     = useState({W:900,H:500});

  const stars = useMemo(()=>Array.from({length:240},(_,i)=>({
    id:i,
    cx:Math.random()*100, cy:Math.random()*100,
    r:Math.random()*1.8+0.3,
    op:Math.random()*0.8+0.15,
    dur:(Math.random()*4+2).toFixed(1),
    delay:(Math.random()*6).toFixed(1),
  })),[]);

  useEffect(()=>{
    if (!mapData?.nodes?.length||!wrapRef.current) return;
    const W=wrapRef.current.clientWidth||900, H=500;
    setDims({W,H});
    setLaid(forceLayout(mapData.nodes, mapData.edges||[], W, H));
    setPan({x:0,y:0}); setZoom(1); setSelected(null);
  },[mapData]);

  const connectedIds = useMemo(()=>{
    if (!selected||!mapData) return null;
    const ids=new Set([selected.id]);
    (mapData.edges||[]).forEach(e=>{
      if(e.source===selected.id) ids.add(e.target);
      if(e.target===selected.id) ids.add(e.source);
    });
    return ids;
  },[selected,mapData]);

  const onMouseDown = useCallback(e=>{
    if (e.button !== 0) return;
    if(e.target.closest('.node-g')) return;
    dragRef.current={active:true, lastX:e.clientX, lastY:e.clientY};
  },[]);

  const onMouseMove = useCallback(e=>{
    const d=dragRef.current;
    if(!d.active) return;
    setPan(p=>({x:p.x+e.clientX-d.lastX, y:p.y+e.clientY-d.lastY}));
    d.lastX=e.clientX; d.lastY=e.clientY;
  },[]);

  const onMouseUp = useCallback(()=>{dragRef.current.active=false;},[]);

  const onWheel = useCallback(e=>{
    e.preventDefault();
    setZoom(z=>Math.max(0.2,Math.min(5,z*(e.deltaY>0?0.97:1.03))));
  },[]);

  const focusNode = useCallback(n=>{
    if(selected?.id===n.id){setSelected(null);return;}
    setSelected(n);
    const {W,H}=dims;
    setPan({x:W/2-n.x*zoom, y:H/2-n.y*zoom});
    setZoom(z=>Math.min(z*1.4,3));
  },[selected,dims,zoom]);

  const resetView = useCallback(()=>{
    setPan({x:0,y:0}); setZoom(1); setSelected(null); setSearch('');
  },[]);

  const analytics = useMemo(()=>{
    if(!laid) return null;
    const sorted=[...laid].sort((a,b)=>b.degree-a.degree);
    const godFiles=laid.filter(n=>n.is_god);
    const testFiles=laid.filter(n=>(n.label||'').startsWith('test_'));
    return {mostConnected:sorted[0], godFiles, testCount:testFiles.length, total:laid.length};
  },[laid]);

  if(!mapData?.nodes?.length) return (
    <div className="fade-in">
      <div className="ph"><div><div className="ph-title">🗺️ Architecture Map</div><div className="ph-sub">Space-themed interactive dependency graph</div></div></div>
      <div className="map-wrap">
        <div style={{height:500,display:'flex',alignItems:'center',justifyContent:'center',background:'#07090f'}}>
          <Empty icon="🗺️" text="Scan a repository to generate the architecture map"/>
        </div>
      </div>
    </div>
  );

  const transform=`translate(${pan.x},${pan.y}) scale(${zoom})`;
  const maxDeg=laid?Math.max(...laid.map(n=>n.degree),1):1;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes twinkle{0%,100%{opacity:var(--sop)}50%{opacity:calc(var(--sop)*0.12)}}
        @keyframes pulse-ring{0%{r:var(--pr);opacity:.9}100%{r:calc(var(--pr)*2.8);opacity:0}}
        @keyframes orbit-ring{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-20}}
        @keyframes fadein{from{opacity:0}to{opacity:1}}
        .space-canvas{cursor:${dragRef.current.active?'grabbing':'grab'};user-select:none}
        .node-g{cursor:pointer}
      `}</style>

      <div className="ph">
        <div>
          <div className="ph-title">🗺️ Architecture Map</div>
          <div className="ph-sub">Drag to pan · Scroll to zoom · Click node to focus · Search to filter</div>
        </div>
        <div className="ph-tag">{mapData.nodes?.length} modules · {mapData.edges?.length} deps</div>
      </div>

      <div className="map-wrap">
        {/* Toolbar */}
        <div className="map-tb" style={{background:'rgba(7,9,15,.97)',borderBottom:'1px solid #1e2d3d'}}>
          <span style={{fontSize:12,fontFamily:'IBM Plex Mono,monospace',color:'#00b4d8',fontWeight:600,letterSpacing:'.08em'}}>
            ✦ DEPENDENCY GRAPH
          </span>
          <div className="map-legend">
            {[['#ef4444','God File'],['#00b4d8','Core Hub'],['#3b82f6','Test'],['#f59e0b','Oversized'],['#334155','Module']]
              .map(([c,l])=>(
                <div className="leg-item" key={l}>
                  <div className="leg-dot" style={{background:c,boxShadow:`0 0 6px ${c}`}}/>{l}
                </div>
              ))}
          </div>
          <div style={{display:'flex',gap:8,marginLeft:'auto',alignItems:'center'}}>
            <div style={{position:'relative',display:'flex',alignItems:'center'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search modules…"
                style={{background:'rgba(255,255,255,.04)',border:'1px solid #1e2d3d',borderRadius:6,
                  padding:'5px 28px 5px 10px',color:'#e2e8f0',fontSize:11,
                  fontFamily:'IBM Plex Mono,monospace',width:155,outline:'none'}}/>
              {search && <button onClick={()=>setSearch('')}
                style={{position:'absolute',right:8,background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:13,lineHeight:1}}>×</button>}
            </div>
            <button className="btn btn-g" onClick={resetView} style={{fontSize:11,padding:'5px 10px'}}>
              ⌖ Reset
            </button>
          </div>
        </div>

        {/* Space canvas */}
        <div ref={wrapRef} className="space-canvas"
          style={{
            height:500, position:'relative', overflow:'hidden',
            background:'radial-gradient(ellipse at 18% 40%,rgba(124,58,237,.09) 0%,transparent 52%), radial-gradient(ellipse at 80% 25%,rgba(0,180,216,.08) 0%,transparent 48%), radial-gradient(ellipse at 55% 88%,rgba(55,48,163,.08) 0%,transparent 42%), #07090f',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={()=>dragRef.current.active=false}
          onWheel={onWheel}
        >
          <svg style={{width:'100%',height:'100%'}} viewBox={`0 0 ${dims.W} ${dims.H}`}>
            <defs>
              {[['g-red',8],['g-cyan',5],['g-blue',4],['g-amb',4],['g-soft',1.5]].map(([id,sd])=>(
                <filter key={id} id={id} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={sd} result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              ))}
              <marker id="arr-hub" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="#00b4d8" strokeWidth="1" opacity=".7"/>
              </marker>
              <marker id="arr-god" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="#ef4444" strokeWidth="1" opacity=".7"/>
              </marker>
              <marker id="arr-std" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#253347" strokeWidth="1"/>
              </marker>
            </defs>

            {/* Stars */}
            {stars.map(s=>(
              <circle key={s.id} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white"
                style={{'--sop':s.op, opacity:s.op,
                  animation:`twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`}}/>
            ))}

            {/* Graph */}
            <g transform={transform}>
              {/* Edges */}
              {laid && (mapData.edges||[]).map((e,i)=>{
                const a=laid[e.source], b=laid[e.target];
                if(!a||!b) return null;
                const ac=nodeCategory(a), bc=nodeCategory(b);
                const isHub=ac==='hub'||bc==='hub';
                const isGod=ac==='god'||bc==='god';
                const col=isGod?'#ef4444':isHub?'#00b4d8':'#1e3a4a';
                const marker=isGod?'url(#arr-god)':isHub?'url(#arr-hub)':'url(#arr-std)';
                const dimmed=connectedIds&&!connectedIds.has(e.source)&&!connectedIds.has(e.target);
                const sDim=search&&!(a.label||'').includes(search)&&!(b.label||'').includes(search);
                return (
                  <g key={i} opacity={dimmed||sDim?0.04:1} style={{transition:'opacity .3s'}}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col}
                      strokeWidth={isHub||isGod?3:1.5} opacity={isHub||isGod?.18:.07}/>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col}
                      strokeWidth={isHub||isGod?1.3:.8}
                      opacity={isHub||isGod?.75:.22}
                      markerEnd={marker}
                      strokeDasharray={isHub||isGod?'6 12':undefined}
                      style={isHub||isGod?{animation:'flow 1.4s linear infinite'}:{}}/>
                  </g>
                );
              })}

              {/* Nodes */}
              {laid && laid.map(n=>{
                const cat=nodeCategory(n);
                const {color,filter}=CAT[cat];
                const r=nodeR(n);
                const dimmed=connectedIds&&!connectedIds.has(n.id);
                const sDim=search&&!(n.label||'').includes(search);
                const isSel=selected?.id===n.id;
                const showLbl=n.degree>=4||isSel||(hovered?.node?.id===n.id);
                return (
                  <g key={n.id} className="node-g"
                    opacity={dimmed||sDim?0.06:1}
                    style={{transition:'opacity .3s'}}
                    onClick={()=>focusNode(n)}
                    onMouseEnter={e=>{
                      if(dragRef.current.active) return;
                      const rect=wrapRef.current.getBoundingClientRect();
                      setHovered({node:n, x:e.clientX-rect.left, y:e.clientY-rect.top});
                    }}
                    onMouseMove={e=>{
                      if(dragRef.current.active){setHovered(null);return;}
                      const rect=wrapRef.current.getBoundingClientRect();
                      setHovered(h=>h?{...h,x:e.clientX-rect.left,y:e.clientY-rect.top}:h);
                    }}
                    onMouseLeave={()=>setHovered(null)}
                  >
                    {/* Pulse ring — god files */}
                    {cat==='god'&&(
                      <circle cx={n.x} cy={n.y} r={r+5} fill="none"
                        stroke="#ef4444" strokeWidth="1.5" opacity="0"
                        style={{'--pr':r+5, animation:'pulse-ring 2s ease-out infinite'}}/>
                    )}
                    {/* Orbit ring — hubs */}
                    {cat==='hub'&&(
                      <circle cx={n.x} cy={n.y} r={r+8} fill="none"
                        stroke="#00b4d8" strokeWidth=".6" strokeDasharray="3 7" opacity=".35"
                        style={{transformOrigin:`${n.x}px ${n.y}px`, animation:'orbit-ring 9s linear infinite'}}/>
                    )}
                    {/* Selection ring */}
                    {isSel&&(
                      <circle cx={n.x} cy={n.y} r={r+11} fill="none"
                        stroke="white" strokeWidth="1.5" opacity=".55" strokeDasharray="4 5"/>
                    )}
                    {/* Halo */}
                    <circle cx={n.x} cy={n.y} r={r+6} fill={color} opacity=".08"/>
                    {/* Planet */}
                    <circle cx={n.x} cy={n.y} r={r} fill={color} filter={filter}
                      stroke={color} strokeWidth="1.2" opacity=".92"/>
                    {/* Glint */}
                    <circle cx={n.x-r*.28} cy={n.y-r*.28} r={r*.22} fill="white" opacity=".2"/>
                    {/* Label */}
                    {showLbl&&(
                      <text x={n.x} y={n.y+r+12} textAnchor="middle"
                        fontSize={n.degree>=4?10:9}
                        fill={n.degree>=4?'#94a3b8':'#475569'}
                        fontFamily="IBM Plex Mono,monospace">
                        {(n.label||'').length>14?(n.label||'').slice(0,12)+'…':n.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover tooltip */}
          {hovered&&!selected&&(()=>{
            const cat=nodeCategory(hovered.node);
            const {color,label:catLabel}=CAT[cat];
            return (
              <div style={{
                position:'absolute', left:hovered.x+16, top:hovered.y-12,
                background:'rgba(7,9,15,.93)', backdropFilter:'blur(12px)',
                border:`1px solid ${color}`, borderRadius:10, padding:'10px 14px',
                fontSize:11, pointerEvents:'none', zIndex:20, maxWidth:220,
                boxShadow:`0 0 22px ${color}33`,
                animation:'fadein .15s ease',
              }}>
                <div style={{fontFamily:'IBM Plex Mono,monospace',color,fontWeight:600,marginBottom:4,fontSize:12}}>
                  {hovered.node.label}
                </div>
                <div style={{color:'#475569',fontSize:10,marginBottom:8,lineHeight:1.4}}>
                  {hovered.node.full_path}
                </div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{background:color+'22',color,padding:'1px 8px',borderRadius:10,fontSize:9,fontWeight:700,border:`1px solid ${color}44`}}>
                    {catLabel}
                  </span>
                  <span style={{color:'#64748b',fontSize:10}}>⚡ {hovered.node.degree} connections</span>
                  <span style={{color:'#64748b',fontSize:10}}>📏 {hovered.node.loc||'?'} LOC</span>
                </div>
              </div>
            );
          })()}

          {/* Focus panel */}
          {selected&&(()=>{
            const cat=nodeCategory(selected);
            const {color,label:catLabel,risk,riskColor}=CAT[cat];
            return (
              <div style={{
                position:'absolute', bottom:16, left:16,
                background:'rgba(7,9,15,.96)', border:`1px solid ${color}`,
                borderRadius:12, padding:16, width:232,
                boxShadow:`0 0 32px ${color}33, 0 8px 24px rgba(0,0,0,.5)`,
                backdropFilter:'blur(14px)', zIndex:20,
                animation:'fadein .2s ease',
              }}>
                <button onClick={()=>setSelected(null)}
                  style={{position:'absolute',top:10,right:12,background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:17,lineHeight:1}}>×</button>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:color,boxShadow:`0 0 8px ${color}`,flexShrink:0}}/>
                  <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:12,fontWeight:700,color:'#e2e8f0'}}>
                    {(selected.label||'').length>18?(selected.label||'').slice(0,16)+'…':selected.label}
                  </span>
                </div>
                <div style={{color:'#334155',fontSize:10,marginBottom:12,lineHeight:1.4,wordBreak:'break-all'}}>
                  {selected.full_path}
                </div>
                <div style={{height:1,background:'#1e2d3d',marginBottom:12}}/>
                {[
                  ['Connections', selected.degree, color],
                  ['Lines of Code', selected.loc||'—', '#94a3b8'],
                  ['Category', catLabel, color],
                  ['Risk Level', risk, riskColor],
                ].map(([lbl,val,c])=>(
                  <div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,fontSize:11}}>
                    <span style={{color:'#475569'}}>{lbl}</span>
                    <span style={{color:c,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',fontSize:11}}>{val}</span>
                  </div>
                ))}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:9,color:'#334155',marginBottom:5,display:'flex',justifyContent:'space-between'}}>
                    <span>Connection Strength</span>
                    <span style={{color}}>{Math.round(selected.degree/maxDeg*100)}%</span>
                  </div>
                  <div style={{background:'#0c1018',height:4,borderRadius:2,border:'1px solid #1e2d3d'}}>
                    <div style={{background:`linear-gradient(90deg,${color},${color}88)`,height:4,borderRadius:2,width:`${selected.degree/maxDeg*100}%`,boxShadow:`0 0 8px ${color}`,transition:'width .6s ease'}}/>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Zoom hint */}
          <div style={{position:'absolute',bottom:14,right:16,fontSize:9,color:'#1e3a4a',fontFamily:'IBM Plex Mono,monospace',pointerEvents:'none',textAlign:'right'}}>
            {zoom.toFixed(1)}× · drag · scroll · click
          </div>
        </div>

        {/* Analytics */}
        {analytics&&(
          <div style={{padding:'14px 18px',borderTop:'1px solid #1e2d3d',background:'rgba(7,9,15,.8)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[
              {icon:'⚡',label:'Most Connected',value:analytics.mostConnected?.label||'—',sub:`${analytics.mostConnected?.degree||0} connections`,color:'#00b4d8'},
              {icon:'🐙',label:'God Files',value:analytics.godFiles.length,sub:analytics.godFiles[0]?.label||'none detected',color:analytics.godFiles.length>0?'#ef4444':'#10b981'},
              {icon:'🧪',label:'Test Files',value:analytics.testCount,sub:`of ${analytics.total} total`,color:'#3b82f6'},
              {icon:'🏗️',label:'Architecture',value:analytics.godFiles.length>0?'⚠ Issues':'✓ Healthy',sub:analytics.godFiles.length>0?'God file detected':'No structural issues',color:analytics.godFiles.length>0?'#ef4444':'#10b981'},
            ].map(s=>(
              <div key={s.label} style={{background:'#0c1018',border:'1px solid #1e2d3d',borderRadius:8,padding:12}}>
                <div style={{fontSize:18,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:s.color,marginBottom:2}}>{s.value}</div>
                <div style={{fontSize:9,color:'#334155'}}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div className="map-foot">
          <span>{mapData.nodes?.length} modules</span>
          <span>{mapData.edges?.length} dependency edges</span>
          <span>Powered by IBM Bob</span>
        </div>
      </div>
    </div>
  );
}