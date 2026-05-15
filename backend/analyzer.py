import subprocess
import json
import sys
from collections import defaultdict

def get_file_authors(repo_path):
    result = subprocess.run(
        ['git', 'log', '--pretty=format:%ae', '--name-only', '--diff-filter=AM'],
        cwd=repo_path, capture_output=True, text=True
    )
    file_authors = defaultdict(set)
    current_author = None
    for line in result.stdout.split('\n'):
        line = line.strip()
        if '@' in line:
            current_author = line
        elif line and current_author:
            file_authors[line].add(current_author)
    return file_authors

def get_commit_count(repo_path, filepath):
    result = subprocess.run(
        ['git', 'log', '--oneline', '--', filepath],
        cwd=repo_path, capture_output=True, text=True
    )
    lines = [l for l in result.stdout.strip().split('\n') if l]
    return len(lines)

def calculate_health_score(risky_files):
    critical = sum(1 for f in risky_files if f['is_critical'])
    high = sum(1 for f in risky_files if not f['is_critical'] and f['bus_factor'] == 1)
    score = 100 - (critical * 15) - (high * 5)
    return max(0, min(100, score))

def analyze(repo_path, min_commits=10):
    print(f"Scanning {repo_path}...", file=sys.stderr)
    file_authors = get_file_authors(repo_path)
    risky_files = []

    for filepath, authors in file_authors.items():
        if not any(filepath.endswith(ext) for ext in ['.py', '.js', '.ts', '.java', '.go']):
            continue
        commit_count = get_commit_count(repo_path, filepath)
        if commit_count < min_commits:
            continue
        risk_score = round(min((1 / len(authors)) * (commit_count / 5), 10), 1)
        risky_files.append({
            'file': filepath,
            'authors': list(authors),
            'author_count': len(authors),
            'commits': commit_count,
            'bus_factor': len(authors),
            'risk_score': risk_score,
            'is_critical': len(authors) == 1 and commit_count > 10
        })

    risky_files.sort(key=lambda x: (x['bus_factor'], -x['commits']))
    health_score = calculate_health_score(risky_files)

    return {
        'repo': repo_path,
        'health_score': health_score,
        'total_files_analyzed': len(risky_files),
        'critical_files': [f for f in risky_files if f['is_critical']][:10],
        'all_risky_files': risky_files[:20]
    }

if __name__ == '__main__':
    repo_path = sys.argv[1] if len(sys.argv) > 1 else '.'
    results = analyze(repo_path)
    print(json.dumps(results, indent=2))