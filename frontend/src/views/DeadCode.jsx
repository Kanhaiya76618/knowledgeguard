import { ScoreCard, Empty, ErrorBox } from '../components.jsx';

export default function DeadCode({ data, error }) {
  return (
    <div className="fade-in">
      <div className="ph">
        <div>
          <div className="ph-title">&#8709; Dead Code Detector</div>
          <div className="ph-sub">Unreferenced functions and classes detected via AST analysis</div>
        </div>
        {data && <div className="ph-tag">{data.total_issues} unreferenced</div>}
      </div>

      <ErrorBox msg={error}/>

      <ScoreCard
        score={data?.dead_score}
        arcColor="var(--amber)"
        title="Codebase Cleanliness Score"
        desc={data
          ? `${data.total_issues} unreferenced definition${data.total_issues !== 1 ? 's' : ''} across ${data.files_analyzed} Python files.`
          : 'Scan a repository to detect unused functions and classes.'}
        chips={[
          { label:'Unreferenced', value:data?.total_issues,              color:'var(--amber)' },
          { label:'Functions',    value:data?.summary?.unused_functions, color:'var(--muted)' },
          { label:'Files',        value:data?.files_analyzed,            color:'var(--muted)' },
        ]}
      />

      {data?.summary && (
        <div className="s-summary">
          {[
            { icon:'&#8709;', num:data.summary.unused_functions, lbl:'Unused Functions', color:'var(--amber)' },
            { icon:'&#9675;', num:data.summary.unused_classes,   lbl:'Unused Classes',   color:'var(--muted2)' },
            { icon:'&#9776;', num:data.files_analyzed,           lbl:'Files Analyzed',   color:'var(--cyan)' },
          ].map(c => (
            <div className="s-cell" key={c.lbl}>
              <div className="s-cell-icon" dangerouslySetInnerHTML={{__html: c.icon}}/>
              <div className="s-cell-num" style={{color:c.color}}>{c.num}</div>
              <div className="s-cell-lbl">{c.lbl}</div>
            </div>
          ))}
        </div>
      )}

      <div className="cards">
        {!data && <Empty icon="&#8709;" text="Scan a repository to detect dead code"/>}
        {data && (data.issues||[]).length === 0 && (
          <Empty icon="&#10003;" text="No dead code detected — every definition is referenced."/>
        )}

        {(data?.issues||[]).map((issue, i) => (
          <div className="card high" key={i}>
            <div className="card-top">
              <div>
                <div className="card-title">{issue.title}</div>
                <div className="card-file">{issue.file}{issue.line ? `:${issue.line}` : ''}</div>
              </div>
              <span className="sev high">{issue.kind?.toUpperCase() || 'UNUSED'}</span>
            </div>
            <div className="card-desc">{issue.description}</div>
            <div className="card-fix">{issue.fix}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
