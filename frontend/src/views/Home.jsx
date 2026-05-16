import { useState, useEffect, useRef } from 'react';

const TERMINAL_LINES = [
  { text: '$ knowledgeguard init --powered-by ibm-bob', delay: 0 },
  { text: '  Connecting to IBM Bob Shell...', delay: 600 },
  { text: '  Bob CLI v1.0.3 connected            [OK]', delay: 1200 },
  { text: '$ knowledgeguard scan https://github.com/pallets/flask.git', delay: 2000 },
  { text: '  Cloning repository...               [2.3s]', delay: 2800 },
  { text: '  Bus factor analysis...    43 files  [done]', delay: 3500 },
  { text: '  Architecture sentinel...  6 issues  [done]', delay: 4200 },
  { text: '  Dead code detection...    12 found  [done]', delay: 4900 },
  { text: '  IBM Bob context ready               [done]', delay: 5600 },
  { text: '', delay: 6200 },
  { text: '  Scan complete. 6 intelligence modules ready.', delay: 6400 },
];

const FEATURES = [
  {
    symbol: '⬡',
    title: 'Knowledge Guard',
    tag: 'Bus Factor Analysis',
    desc: 'Scans git history to identify files where only one developer holds critical knowledge. IBM Bob generates Knowledge Transfer Documents and Ghost Developer mode preserves expertise permanently.',
    metrics: ['Git log analysis', 'Bus factor scoring', 'Bob-powered docs'],
  },
  {
    symbol: '≡',
    title: 'Repo Q&A',
    tag: 'Full Context Chat',
    desc: 'Ask anything about your codebase in plain English. IBM Bob reads actual files and answers with complete repository awareness — not generic knowledge.',
    metrics: ['Multi-file reasoning', 'Dependency tracing', 'Bob Shell CLI'],
  },
  {
    symbol: '△',
    title: 'Architecture Sentinel',
    tag: 'AST Analysis',
    desc: 'Python AST parsing detects circular dependencies, god files, and oversized modules. IBM Bob explains each violation with repo-specific context and generates a refactoring plan.',
    metrics: ['AST import parsing', 'Cycle detection', 'Bob explanations'],
  },
  {
    symbol: '⊞',
    title: 'Architecture Map',
    tag: 'Neural Network Graph',
    desc: 'Force-directed dependency graph built from real AST analysis. Every node is a real file, every edge a real import. Particles flow along dependency edges in real time.',
    metrics: ['Force simulation', 'Canvas rendering', 'Live particles'],
  },
  {
    symbol: '∅',
    title: 'Dead Code',
    tag: 'AST Detection',
    desc: 'AST analysis finds functions and classes defined but never referenced anywhere in the codebase. Identifies technical debt before it compounds.',
    metrics: ['Definition tracking', 'Reference analysis', 'Health scoring'],
  },
  {
    symbol: '→',
    title: 'Onboarding Path',
    tag: 'IBM Bob Guided',
    desc: 'IBM Bob reads the entire repository and generates a role-specific week-by-week learning path for new developers — files to read, concepts to master, first tasks to attempt.',
    metrics: ['Role-based paths', 'File ordering', 'Bob-generated'],
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Input',
    desc: 'Paste any GitHub URL or local repository path. KnowledgeGuard handles cloning automatically.',
    detail: 'github.com/user/repo.git → auto-clone → ready',
  },
  {
    num: '02',
    title: 'Analyze',
    desc: 'AST parsing, git log analysis, and IBM Bob full repository context run in parallel.',
    detail: 'ast.parse() + git log + IBM Bob Shell CLI',
  },
  {
    num: '03',
    title: 'Intelligence',
    desc: 'Six dimensions of codebase intelligence surface simultaneously with Bob-powered explanations.',
    detail: '6 modules · real files · actionable output',
  },
];

export default function Home({ bobConn }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [showCursor, setShowCursor]     = useState(true);
  const termRef    = useRef(null);
  const animated   = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    TERMINAL_LINES.forEach(line => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line.text]);
        if (termRef.current)
          termRef.current.scrollTop = termRef.current.scrollHeight;
      }, line.delay);
    });
    const cur = setInterval(() => setShowCursor(p => !p), 530);
    return () => clearInterval(cur);
  }, []);

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>

      {/* Hero grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: 28,
        alignItems: 'start',
        marginBottom: 44,
        paddingTop: 4,
      }}>

        {/* Left */}
        <div>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: bobConn ? 'var(--green)' : 'var(--amber)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: bobConn ? 'var(--green)' : 'var(--amber)',
              boxShadow: bobConn
                ? '0 0 6px var(--green)'
                : '0 0 6px var(--amber)',
              flexShrink: 0,
            }}/>
            IBM Bob {bobConn ? 'Connected · All AI Features Active'
                             : 'Disconnected · Analysis Features Active'}
          </div>

          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: 14,
            color: 'var(--text)',
            fontFamily: 'var(--sans)',
          }}>
            Codebase Intelligence<br/>
            <span style={{
              background: 'linear-gradient(135deg,#388bfd 0%,#8957e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Powered by IBM Bob
            </span>
          </h1>

          <p style={{
            fontSize: 13.5,
            color: 'var(--muted2)',
            lineHeight: 1.75,
            marginBottom: 24,
            maxWidth: 460,
          }}>
            Paste any GitHub URL or local path. KnowledgeGuard
            analyzes knowledge risk, architectural debt, dead code,
            dependency structure, and generates developer onboarding
            paths — with IBM Bob providing full repository context
            across every result.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Modules',       value: '6'          },
              { label: 'Analysis',      value: 'AST + Git'  },
              { label: 'AI Layer',      value: 'IBM Bob'    },
              { label: 'Repo Support',  value: 'GitHub + Local' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 14px',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 2,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div style={{
          background: '#010409',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            background: 'var(--s2)',
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid var(--border)',
          }}>
            {['#ef4444','#f59e0b','#3fb950'].map((c,i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: c, opacity: 0.8,
              }}/>
            ))}
            <span style={{
              marginLeft: 8, color: 'var(--muted)',
              fontSize: 10, letterSpacing: '0.05em',
            }}>
              knowledgeguard — bash
            </span>
            <div style={{
              marginLeft: 'auto', width: 6, height: 6,
              borderRadius: '50%',
              background: bobConn ? '#3fb950' : '#f59e0b',
              boxShadow: bobConn
                ? '0 0 5px #3fb950' : '0 0 5px #f59e0b',
            }}/>
          </div>
          <div ref={termRef} style={{
            padding: '14px 14px',
            minHeight: 210,
            maxHeight: 250,
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}>
            {visibleLines.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('$')
                  ? '#58a6ff'
                  : line.includes('[OK]') || line.includes('[done]')
                    ? '#3fb950'
                    : line.includes('Scan complete')
                      ? '#e6edf3'
                      : '#6e7681',
                lineHeight: 1.75,
                whiteSpace: 'pre',
                fontSize: 11,
              }}>
                {line}
              </div>
            ))}
            {visibleLines.length > 0 && (
              <span style={{
                display: 'inline-block',
                width: 7, height: 13,
                background: showCursor ? '#58a6ff' : 'transparent',
                marginLeft: 2,
                verticalAlign: 'middle',
                borderRadius: 1,
              }}/>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          How it works
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 1,
          background: 'var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{
              background: 'var(--s1)',
              padding: '20px',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--border2)',
                lineHeight: 1,
                marginBottom: 10,
                letterSpacing: '-1px',
              }}>
                {step.num}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 6,
              }}>
                {step.title}
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--muted)',
                lineHeight: 1.6,
                marginBottom: 12,
              }}>
                {step.desc}
              </div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--blue)',
                background: 'var(--blue-dim)',
                padding: '4px 9px',
                borderRadius: 5,
                display: 'inline-block',
              }}>
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          Intelligence modules
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span>6 active</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--s1)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '18px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--blue)';
                e.currentTarget.style.boxShadow =
                  '0 4px 20px rgba(56,139,253,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 18,
                  color: 'var(--blue)',
                }}>
                  {f.symbol}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--muted)',
                  background: 'var(--s2)',
                  border: '1px solid var(--border)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                }}>
                  {f.tag}
                </span>
              </div>

              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 7,
              }}>
                {f.title}
              </div>

              <div style={{
                fontSize: 11.5,
                color: 'var(--muted)',
                lineHeight: 1.6,
                marginBottom: 12,
              }}>
                {f.desc}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                {f.metrics.map(m => (
                  <div key={m} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 10,
                    color: 'var(--muted2)',
                    fontFamily: 'var(--mono)',
                  }}>
                    <div style={{
                      width: 3, height: 3,
                      borderRadius: '50%',
                      background: 'var(--blue)',
                      flexShrink: 0,
                    }}/>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{
        textAlign: 'center',
        padding: '20px 0',
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--muted)',
        borderTop: '1px solid var(--border)',
      }}>
        Enter a repository path or GitHub URL above — then click
        Scan Repo to activate all 6 intelligence modules
      </div>
    </div>
  );
}
