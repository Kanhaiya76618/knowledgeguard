import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';
import { Spinner, ChatMsg } from '../components.jsx';

const SUGGESTIONS = [
  "How does the main entry point work?",
  "What are the most critical files?",
  "Explain the routing system",
  "Where is error handling done?",
  "What would break first if I changed the core module?",
];

export default function RepoQA({ repoPath, bobConnected }) {
  const [messages, setMessages] = useState([
    { role:'bot', text:'Hello. Scan a repository and ask me anything about it. I answer with full codebase context — not just one file.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  async function send(q) {
    const question = q || input.trim();
    if (!question) return;
    setInput('');
    setMessages(m => [...m, { role:'user', text:question }]);
    setLoading(true);

    const res = await api.ask(question, repoPath);
    setLoading(false);

    if (res?.answer) {
      const ref = res.files_referenced?.length
        ? `\n<span style="font-size:9.5px;color:var(--muted)">Files: ${res.files_referenced.join(', ')}</span>` : '';
      setMessages(m => [...m, { role:'bot', text: res.answer.replace(/\n/g,'<br>')+ref }]);
    } else {
      setMessages(m => [...m, { role:'bot', text: `⚠ ${res?.error || 'Connect IBM Bob CLI for AI-powered answers.'}` }]);
    }
  }

  return (
    <div className="fade-in">
      <div className="ph">
        <div>
          <div className="ph-title">💬 Repo Q&A</div>
          <div className="ph-sub">Ask anything — Bob answers with full repository context, not just individual files</div>
        </div>
      </div>

      <div className="qa-wrap">
        {!bobConnected && (
          <div className="bob-notice">
            ⚠ IBM Bob CLI not connected. Analysis features work — AI answers need Bob CLI running.
          </div>
        )}

        <div className="qa-suggs">
          {SUGGESTIONS.map(s => (
            <button key={s} className="sugg" onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        <div className="qa-box">
          <div className="qa-msgs" ref={msgsRef}>
            {messages.map((m,i) => <ChatMsg key={i} role={m.role}>{m.text}</ChatMsg>)}
            {loading && (
              <div className="msg bot">
                <div className="msg-lbl">IBM Bob</div>
                <div className="bubble"><Spinner/>Reading full repository…</div>
              </div>
            )}
          </div>
          <div className="qa-footer">
            <input
              className="qa-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Ask anything about your codebase…"
            />
            <button className="btn btn-c" onClick={() => send()} disabled={loading}>
              Ask Bob
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}