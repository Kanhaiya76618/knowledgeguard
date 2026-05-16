const API = 'http://localhost:8000';

async function post(endpoint, body) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000)
    });
    return await res.json();
  } catch (e) {
    return {
      error: e.name === 'TimeoutError'
        ? 'Request timed out'
        : `Cannot reach backend: ${e.message}`
    };
  }
}

async function get(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`, { signal: AbortSignal.timeout(15000) });
    return await res.json();
  } catch {
    return { error: 'Backend not running' };
  }
}

export const api = {
  status:       ()                             => get('/api/status'),
  busFactor:    (repo_path)                    => post('/api/analyze/bus-factor', { repo_path }),
  sentinel:     (repo_path)                    => post('/api/analyze/sentinel',   { repo_path }),
  ask:          (question, repo_path)          => post('/api/ask',                { question, repo_path }),
  generateDoc:  (file_path, repo_path)         => post('/api/generate-doc',       { file_path, repo_path }),
  ghost:        (question, file_path, repo_path, author) =>
                                                  post('/api/ghost-developer',    { question, file_path, repo_path, author }),
  explainIssue: (title, files, repo_path)      => post('/api/explain-issue',      { title, files, repo_path }),
  deadCode:     (repo_path)                    => post('/api/analyze/dead-code',  { repo_path }),
  onboarding:   (role, repo_path)              => post('/api/onboarding',          { role, repo_path }),
};