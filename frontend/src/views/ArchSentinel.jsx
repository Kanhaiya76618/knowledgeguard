import { ScoreCard, Empty, ErrorBox } from '../components.jsx';

const TYPE_LABELS = {
  circular_dependency: '🔄 Circular Dependencies',
  god_file:            '🐙 God Files',
  oversized_file:      '📦 Oversized Files',
};

export default function ArchSentinel({ data, error, onExplain }) {
  const grouped = {};
  (data?.issues||[]).forEach(i => {
    if (!grouped[i.type]) grouped[i.type] = [];
    grouped[i.type].push(i);
  });

  return (
    <div className="fade-in">
      <div className="ph">
        <div>
          <div className="ph-title">🏛️ Architecture Debt Sentinel</div>
          <div className="ph-sub">Circular dependencies · God files · Oversized files — detected via AST, explained by Bob</div>
        </div>
        {data && <div className="ph-tag">{data.total_issues} issues</div>}
      </div>

      <ErrorBox msg={error}/>

      <ScoreCard
        score={data?.debt_score}
        arcColor="var(--purple)"
        title="Architecture Health Score"
        desc={data
          ? `${data.total_issues} issues across ${data.total_files} files. 100 = clean structure, 0 = critical debt.`
          : 'Scan a repository to detect architectural debt.'}
        chips={[
          { label:'Critical', value:data?.critical_count, color:'var(--red)' },
          { label:'High',     value:data?.high_count,     color:'var(--amber)' },
          { label:'Files',    value:data?.total_files,    color:'var(--muted)' },
        ]}
      />

      {data?.summary && (
        <div className="s-summary">
          {[
            { icon:'🔄', num:data.summary.circular_dependencies, lbl:'Circular Deps',   color:'var(--red)' },
            { icon:'🐙', num:data.summary.god_files,             lbl:'God Files',       color:'var(--amber)' },
            { icon:'📦', num:data.summary.oversized_files,       lbl:'Oversized Files', color:'var(--muted2)' },
          ].map(c => (
            <div className="s-cell" key={c.lbl}>
              <div className="s-cell-icon">{c.icon}</div>
              <div className="s-cell-num" style={{color:c.color}}>{c.num}</div>
              <div className="s-cell-lbl">{c.lbl}</div>
            </div>
          ))}
        </div>
      )}

      <div className="cards">
        {!data && <Empty icon="🏛️" text="Scan a repository to detect architectural debt"/>}
        {data && (data.issues||[]).length===0 && <Empty icon="✅" text="No architectural issues detected. Clean structure."/>}

        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const items = grouped[type]||[];
          if (!items.length) return null;
          return (
            <div key={type}>
              <div className="type-hd">{label}</div>
              {items.map((issue,i) => {
                const filesStr = (issue.files||[issue.file||'']).join(' → ');
                return (
                  <div className={`card ${issue.severity==='critical'?'crit':'high'}`} key={i}>
                    <div className="card-top">
                      <div>
                        <div className="card-title">{issue.title}</div>
                        <div className="card-file">{filesStr.length>90?filesStr.slice(0,90)+'…':filesStr}</div>
                      </div>
                      <span className={`sev ${issue.severity==='critical'?'crit':'high'}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    {issue.imports_count !== undefined && (
                      <div className="card-meta">
                        <span>📥 Imports: {issue.imports_count}</span>
                        <span>📤 Used by: {issue.imported_by_count} files</span>
                      </div>
                    )}
                    {issue.lines && <div className="card-meta"><span>📏 {issue.lines} lines</span></div>}
                    <div className="card-desc">{issue.description}</div>
                    <div className="card-fix">{issue.fix}</div>
                    <div className="card-btns">
                      <button className="btn btn-c"
                        onClick={() => onExplain(issue.title, issue.files||[issue.file||''])}>
                        🤖 Ask Bob to Explain
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}