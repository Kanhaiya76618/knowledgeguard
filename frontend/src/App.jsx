import { useState, useEffect } from 'react';
import { api } from './api.js';
import Home from './views/Home.jsx';
import KnowledgeGuard from './views/KnowledgeGuard.jsx';
import RepoQA from './views/RepoQA.jsx';
import ArchSentinel from './views/ArchSentinel.jsx';
import ArchMap from './views/ArchMap.jsx';
import DeadCode from './views/DeadCode.jsx';
import Onboarding from './views/Onboarding.jsx';
import { GhostModal, DocModal, IssueModal } from './modals.jsx';

const NAV = [
  { id:'home',     icon:'◆', label:'Overview',         section:'platform' },
  { id:'guard',    icon:'⬡', label:'Knowledge Guard',  section:'features', badgeKey:'guardBadge' },
  { id:'qa',       icon:'≡', label:'Repo Q&A',         section:'features' },
  { id:'sentinel', icon:'△', label:'Arch Sentinel',    section:'features', badgeKey:'sentinelBadge' },
  { id:'map',      icon:'⊞', label:'Architecture Map', section:'features' },
  { id:'deadcode',   icon:'∅', label:'Dead Code',        section:'features', badgeKey:'dcBadge' },
  { id:'onboarding', icon:'→', label:'Onboarding Path', section:'features' },
];

export default function App() {
  const [view, setView]           = useState('home');
  const [repoPath, setRepoPath]   = useState('');
  const [repoName, setRepoName]   = useState('—');
  const [scanning, setScanning]   = useState(false);
  const [status, setStatus]       = useState('Ready');
  const [bobConn, setBobConn]     = useState(null);

  // Data
  const [guardData, setGuardData]     = useState(null);
  const [guardError, setGuardError]   = useState(null);
  const [sentData, setSentData]       = useState(null);
  const [sentError, setSentError]     = useState(null);
  const [mapData, setMapData]         = useState(null);
  const [dcData, setDcData]           = useState(null);
  const [dcError, setDcError]         = useState(null);

  // Modals
  const [ghostModal, setGhostModal]   = useState(null); // {file,author}
  const [docModal, setDocModal]       = useState(null);  // {file}
  const [issueModal, setIssueModal]   = useState(null);  // {title,files}

  // Check Bob on mount and every 5 seconds
  useEffect(() => {
    let failCount = 0;
    const check = async () => {
      const r = await api.status();
      if (r?.bob_connected === true) {
        failCount = 0;
        setBobConn(true);
      } else if (r?.bob_connected === false) {
        failCount++;
        if (failCount >= 2) {
          setBobConn(false);
        }
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  async function scan() {
    const path = repoPath.trim();
    if (!path) { alert('Please enter a repository path first.'); return; }
    const name = path.replace(/\\/g,'/').split('/').pop()||path;
    setRepoName(name);
    setScanning(true);
    setStatus('Scanning…');
    setGuardError(null); setSentError(null); setDcError(null);

    const [busRes, sentRes, dcRes] = await Promise.all([
      api.busFactor(path),
      api.sentinel(path),
      api.deadCode(path),
    ]);

    if (busRes?.error) setGuardError(busRes.error);
    else setGuardData(busRes);

    if (sentRes?.error) setSentError(sentRes.error);
    else {
      setSentData(sentRes);
      if (sentRes?.map) setMapData(sentRes.map);
    }

    if (dcRes?.error) setDcError(dcRes.error);
    else setDcData(dcRes);

    setScanning(false);
    setStatus('Complete');
    api.status().then(r => setBobConn(r?.bob_connected === true ? true : false));
  }

  const guardBadge = guardData?.critical_count > 0 ? guardData.critical_count : null;
  const sentBadge  = sentData?.total_issues > 0     ? sentData.total_issues    : null;
  const dcBadge    = dcData?.total_issues > 0        ? dcData.total_issues      : null;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">KG</div>
          <div>
            <div className="logo-name">KnowledgeGuard</div>
            <div className="logo-tag">Codebase Intelligence</div>
          </div>
        </div>

        <nav className="nav">
          {['platform','features'].map(section => (
            <div className="nav-sec" key={section}>
              <div className="nav-sec-label">{section}</div>
              {NAV.filter(n=>n.section===section).map(n => {
                const badge = n.badgeKey==='guardBadge'?guardBadge:n.badgeKey==='sentinelBadge'?sentBadge:n.badgeKey==='dcBadge'?dcBadge:null;
                return (
                  <button key={n.id} className={`nav-item ${view===n.id?'active':''}`} onClick={()=>setView(n.id)}>
                    <span className="nav-icon">{n.icon}</span>
                    {n.label}
                    {badge && <span className="nav-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sf-label">Active Repo</div>
          <div className="sf-repo">{repoName}</div>
          <div className="sf-powered">
            <div className={`sf-dot ${bobConn===true?'on':''}`}/>
            <span>{bobConn === true ? 'IBM Bob · Connected' : bobConn === null ? 'Connecting to IBM Bob...' : 'Bob CLI not connected'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <span className="tb-label">REPO ›</span>
          <div className="repo-field">
            <span className="repo-field-icon">▸</span>
            <input
              value={repoPath}
              onChange={e=>setRepoPath(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&scan()}
              placeholder="Enter local path or GitHub URL…"
            />
          </div>
          <button className="scan-btn" onClick={scan} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Scan Repo'}
          </button>
          <div className="tb-status">
            <div className={`tb-led ${scanning?'scanning':status==='Complete'?'on':''}`}/>
            <span>{status}</span>
          </div>
        </div>

        {/* Bob status bar */}
        <div className={`bob-bar ${bobConn === true ? 'connected' : bobConn === false ? 'disconnected' : 'connecting'}`}>
          <div className="bob-dot"/>
          <span>{bobConn === true
            ? 'IBM Bob CLI connected — all AI features active'
            : bobConn === false
              ? 'IBM Bob CLI not connected — analysis features work, AI features need Bob CLI'
              : 'Connecting to IBM Bob CLI...'
          }</span>
        </div>

        {/* Content */}
        <div className="content">
          {view==='home'     && <Home bobConn={bobConn}/>}
          {view==='guard'    && <KnowledgeGuard data={guardData} error={guardError}
                                  onGenerateDoc={(f,a)=>setDocModal({file:f,author:a})}
                                  onGhost={(f,a)=>setGhostModal({file:f,author:a})}/>}
          {view==='qa'       && <RepoQA repoPath={repoPath} bobConnected={bobConn}/>}
          {view==='sentinel' && <ArchSentinel data={sentData} error={sentError}
                                  onExplain={(t,f)=>setIssueModal({title:t,files:f})}/>}
          {view==='map'      && <ArchMap mapData={mapData}/>}
          {view==='deadcode' && <DeadCode data={dcData} error={dcError}/>}
          {view==='onboarding' && (
            <Onboarding repoPath={repoPath}/>
          )}
        </div>
      </div>

      {/* Modals */}
      {ghostModal && <GhostModal {...ghostModal} repoPath={repoPath} onClose={()=>setGhostModal(null)}/>}
      {docModal   && <DocModal   file={docModal.file} repoPath={repoPath} onClose={()=>setDocModal(null)}/>}
      {issueModal && <IssueModal {...issueModal} repoPath={repoPath} onClose={()=>setIssueModal(null)}/>}
    </div>
  );
}