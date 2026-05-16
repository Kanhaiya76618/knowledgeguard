import { useState } from 'react';
import { api } from '../api.js';
import { Empty, Spinner } from '../components.jsx';

const ROLES = [
  { id:'fullstack', label:'Full Stack'   },
  { id:'backend',   label:'Backend'      },
  { id:'frontend',  label:'Frontend'     },
  { id:'devops',    label:'DevOps'       },
  { id:'qa',        label:'QA Engineer'  },
  { id:'aiml',      label:'AI / ML'      },
];

const LOADING_MSGS = [
  'IBM Bob is reading the repository structure...',
  'Analyzing file relationships and dependencies...',
  'Identifying critical files for your role...',
  'Building week-by-week learning sequence...',
  'Generating first task recommendations...',
  'Finalizing onboarding path...',
];

export default function Onboarding({ repoPath }) {
  const [role,    setRole]    = useState('fullstack');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [msgIdx,  setMsgIdx]  = useState(0);

  async function generate() {
    if (!repoPath) {
      setError('Scan a repository first before generating an onboarding path.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setMsgIdx(0);

    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % LOADING_MSGS.length);
    }, 5000);

    const res = await api.onboarding(role, repoPath);
    clearInterval(interval);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setResult(res);
    }
  }

  // Parse Bob's markdown output into sections
  function parseResult(text) {
    const sections = [];
    const lines = text.split('\n');
    let current = null;
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (current) sections.push(current);
        current = { title: line.replace('## ',''), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    });
    if (current) sections.push(current);
    return sections;
  }

  return (
    <div className="fade-in">
      <div className="ph">
        <div>
          <div className="ph-title">Onboarding Path</div>
          <div className="ph-sub">
            IBM Bob generates a role-specific learning path
            for new developers joining this codebase
          </div>
        </div>
        {result && (
          <div className="ph-tag">
            {result.total_files} files analyzed
          </div>
        )}
      </div>

      {/* Role selector + generate */}
      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontFamily: 'var(--mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 12,
        }}>
          Select your role
        </div>

        <div style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}>
          {ROLES.map(r => (
            <button key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                background: role===r.id
                  ? 'var(--blue-dim)' : 'var(--s2)',
                border: role===r.id
                  ? '1px solid var(--blue)'
                  : '1px solid var(--border)',
                borderRadius: 7,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: role===r.id ? 600 : 400,
                color: role===r.id ? 'var(--blue)' : 'var(--muted2)',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            className="btn btn-c"
            onClick={generate}
            disabled={loading}
            style={{ padding: '9px 22px', fontSize: 12 }}
          >
            {loading
              ? <><Spinner/> Generating...</>
              : 'Generate Onboarding Path'
            }
          </button>
          {!repoPath && (
            <span style={{
              fontSize: 11,
              color: 'var(--amber)',
              fontFamily: 'var(--mono)',
            }}>
              Scan a repository first
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--muted2)',
        }}>
          <Spinner/>
          {LOADING_MSGS[msgIdx]}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          background: 'var(--red-dim)',
          border: '1px solid rgba(248,81,73,0.25)',
          borderRadius: 8,
          padding: '12px 16px',
          fontSize: 12,
          color: 'var(--red)',
          marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <Empty
          icon="→"
          text="Select your role and click Generate Onboarding Path. IBM Bob will read the repository and create a personalized week-by-week learning plan."
        />
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {parseResult(result.onboarding_path).map((section, si) => (
            <div key={si} style={{
              background: 'var(--s1)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--s2)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '0.04em',
              }}>
                {section.title}
              </div>

              {/* Section body */}
              <div style={{ padding: '14px 18px' }}>
                {section.lines.map((line, li) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  // Checklist item
                  if (trimmed.startsWith('- [ ]')) {
                    const content = trimmed.replace('- [ ]','').trim();
                    const fileMatch = content.match(/`([^`]+)`/);
                    const fileName = fileMatch ? fileMatch[1] : null;
                    const desc = content.replace(/`[^`]+`/,'').replace('—','').trim();
                    return (
                      <div key={li} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{
                          width: 14, height: 14,
                          border: '1px solid var(--border2)',
                          borderRadius: 3,
                          flexShrink: 0,
                          marginTop: 2,
                        }}/>
                        <div>
                          {fileName && (
                            <span style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              color: '#79c0ff',
                              marginRight: 8,
                            }}>
                              {fileName}
                            </span>
                          )}
                          <span style={{
                            fontSize: 12,
                            color: 'var(--muted2)',
                          }}>
                            {desc}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Numbered item
                  if (/^\d+\./.test(trimmed)) {
                    return (
                      <div key={li} style={{
                        fontSize: 12,
                        color: 'var(--muted2)',
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border)',
                        lineHeight: 1.55,
                      }}>
                        <span style={{
                          fontFamily: 'var(--mono)',
                          color: 'var(--blue)',
                          marginRight: 8,
                          fontWeight: 600,
                        }}>
                          {trimmed.match(/^\d+/)[0]}.
                        </span>
                        {trimmed.replace(/^\d+\.\s*/,'')}
                      </div>
                    );
                  }

                  // Regular paragraph
                  return (
                    <p key={li} style={{
                      fontSize: 12.5,
                      color: 'var(--muted2)',
                      lineHeight: 1.65,
                      marginBottom: 6,
                    }}>
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Regenerate button */}
          <div style={{ paddingBottom: 8 }}>
            <button
              className="btn btn-g"
              onClick={generate}
              style={{ fontSize: 11 }}
            >
              Regenerate for {ROLES.find(r=>r.id===role)?.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
