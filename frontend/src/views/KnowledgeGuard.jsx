import { ScoreCard, Empty, ErrorBox } from '../components.jsx';

export default function KnowledgeGuard({ data, error, onGenerateDoc, onGhost }) {
  const files = data ? [...(data.critical_files||[]), ...(data.all_risky_files||[])
    .filter(f => !data.critical_files?.some(c => c.file===f.file))].slice(0,10) : [];

  return (
    <div className="fade-in">
      <div className="ph">
        <div>
          <div className="ph-title">🛡️ Knowledge Guard</div>
          <div className="ph-sub">Files owned by one developer — knowledge that walks out the door when they leave</div>
        </div>
        {data && <div className="ph-tag">Health: {data.health_score}/100</div>}
      </div>

      <ErrorBox msg={error}/>

      <ScoreCard
        score={data?.health_score}
        title={data ? 'Knowledge Health Score' : 'Scan a repository to begin'}
        desc={data
          ? (data.critical_count > 0
              ? `${data.critical_count} critical file${data.critical_count>1?'s':''} detected. If these contributors leave, their knowledge leaves with them.`
              : 'Good knowledge distribution — no single-author critical files detected.')
          : 'Paste a repository path above and click Scan Repo.'}
        chips={[
          { label:'Critical',   value:data?.critical_count,   color:'var(--red)' },
          { label:'Analyzed',   value:data?.total_files,      color:'var(--amber)' },
          { label:'Avg Bus Factor', value:data?.avg_bus_factor, color:'var(--muted)' },
        ]}
      />

      <div className="cards">
        {!data && <Empty icon="🛡️" text="Scan a repository to detect bus factor risks"/>}
        {data && files.length === 0 && <Empty icon="✅" text="No significant bus factor risks detected."/>}
        {files.map(f => (
          <div className={`card ${f.is_critical?'crit':'high'}`} key={f.file}>
            <div className="card-top">
              <div>
                <div className="card-title">{f.file.split('/').pop()}</div>
                <div className="card-file">{f.file}</div>
              </div>
              <span className={`sev ${f.is_critical?'crit':'high'}`}>{f.is_critical?'CRITICAL':'HIGH'}</span>
            </div>
            <div className="card-meta">
              <span>👤 {f.author_count} author{f.author_count>1?'s':''}</span>
              <span>📝 {f.commits} commits</span>
              <span>⚡ Risk: {f.risk_score}/10</span>
              <span>🚌 Bus factor: {f.bus_factor}</span>
            </div>
            <div className="bar-row">
              <div className="bar-labels"><span>Risk Score</span><span>{f.risk_score}/10</span></div>
              <div className="bar"><div className="bar-fill" style={{width:`${f.risk_score*10}%`}}/></div>
            </div>
            <div className="card-btns">
              <button className="btn btn-c" onClick={() => onGenerateDoc(f.file, f.authors[0]||'unknown')}>
                🤖 Generate Knowledge Doc
              </button>
              <button className="btn btn-p" onClick={() => onGhost(f.file, f.authors[0]||'unknown')}>
                👻 Ghost Developer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}