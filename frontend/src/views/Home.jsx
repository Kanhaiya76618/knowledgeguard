export default function Home() {
  return (
    <div className="hero fade-in">
      <h1>Know Your Codebase.<br/>Before It Knows You Don't.</h1>
      <p>
        KnowledgeGuard uses IBM Bob's full repository context to detect knowledge silos,
        architectural debt, and structural risks — before they become emergencies.
      </p>
      <div className="feat-grid">
        {[
          { icon:'🛡️', title:'Knowledge Guard', desc:"Find files only one developer understands. Bob generates knowledge transfer docs before they leave." },
          { icon:'💬', title:'Repo Q&A',        desc:"Ask anything in plain English. Bob answers with full repository context — not just one file." },
          { icon:'🏛️', title:'Arch Sentinel',   desc:"Detect circular deps, god files, and structural violations via AST parsing + Bob." },
          { icon:'🗺️', title:'Architecture Map',desc:"Real force-directed dependency graph. See how every module connects and where dangers hide." },
        ].map(f => (
          <div className="feat-cell" key={f.title}>
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
          </div>
        ))}
      </div>
      <div className="hero-hint">↑ Enter a repository path above and click Scan Repo</div>
    </div>
  );
}