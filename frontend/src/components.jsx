/* eslint-disable react-refresh/only-export-components */
// ── Score helpers ─────────────────────────────────────────────────────────────
export function scoreColor(s) {
  if (s < 40) return 'var(--red)';
  if (s < 70) return 'var(--amber)';
  return 'var(--green)';
}
function scoreOffset(s) { return 201 - (201 * s / 100); }

// ── ScoreCard ─────────────────────────────────────────────────────────────────
export function ScoreCard({ score, title, desc, chips, arcColor }) {
  const color = arcColor || scoreColor(score);
  return (
    <div className="score-card">
      <div className="donut">
        <svg width="82" height="82" viewBox="0 0 82 82">
          <circle cx="41" cy="41" r="32" fill="none" stroke="#192032" strokeWidth="7"/>
          <circle cx="41" cy="41" r="32" fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round" strokeDasharray="201"
            strokeDashoffset={score != null ? scoreOffset(score) : 201}
            style={{transition:'stroke-dashoffset .8s ease,stroke .4s'}}/>
        </svg>
        <div className="donut-center">
          <span className="donut-num" style={{color}}>{score ?? '—'}</span>
          <span className="donut-den">/100</span>
        </div>
      </div>
      <div className="score-body">
        <h2>{title}</h2>
        <p>{desc}</p>
        <div className="chips">
          {chips.map((c,i) => (
            <div className="chip" key={i}>
              <div className="chip-num" style={{color:c.color||'var(--muted)'}}>{c.value ?? '—'}</div>
              <div className="chip-lbl">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return <span className="spin"/>;
}

// ── ErrorBox ──────────────────────────────────────────────────────────────────
export function ErrorBox({ msg }) {
  if (!msg) return null;
  return <div className="error-box">⚠ {msg}</div>;
}

// ── Chat message ──────────────────────────────────────────────────────────────
export function ChatMsg({ role, children }) {
  return (
    <div className={`msg ${role}`}>
      <div className="msg-lbl">{role === 'user' ? 'You' : 'IBM Bob'}</div>
      <div className="bubble" dangerouslySetInnerHTML={{__html: children}}/>
    </div>
  );
}