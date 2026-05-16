import ast
import os
import sys
import json

SKIP_DIRS = {'.git','__pycache__','node_modules','.venv','venv',
             'dist','build','.tox','eggs','.eggs','migrations'}

SKIP_NAMES = {
    'main','setup','teardown','setUp','tearDown',
    'get','post','put','delete','patch','head','options',
    'run','start','stop','close','open','connect','disconnect',
}

def get_python_files(repo_path):
    files = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for f in filenames:
            if f.endswith('.py'):
                files.append(os.path.join(root, f))
    return files

def find_dead_code(repo_path):
    py_files = get_python_files(repo_path)
    if not py_files:
        return {
            'dead_score': 100, 'total_issues': 0, 'medium_count': 0,
            'files_analyzed': 0, 'issues': [],
            'summary': {'unused_functions': 0, 'unused_classes': 0},
        }

    definitions = {}  # name -> {file, line, kind}
    all_used = set()

    for filepath in py_files:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fh:
                source = fh.read()
            tree = ast.parse(source)
        except Exception:
            continue

        rel = os.path.relpath(filepath, repo_path).replace('\\', '/')

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                name = node.name
                if (not name.startswith('_') and
                        not name.startswith('test_') and
                        name not in SKIP_NAMES and
                        name not in definitions):
                    definitions[name] = {'file': rel, 'line': node.lineno, 'kind': 'function'}
            elif isinstance(node, ast.ClassDef):
                name = node.name
                if not name.startswith('_') and name not in definitions:
                    definitions[name] = {'file': rel, 'line': node.lineno, 'kind': 'class'}

        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                all_used.add(node.id)
            elif isinstance(node, ast.Attribute):
                all_used.add(node.attr)
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    all_used.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    all_used.add(node.func.attr)
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    all_used.add(alias.asname or alias.name.split('.')[-1])
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    all_used.add(alias.asname or alias.name)

    issues = []
    for name, info in definitions.items():
        if name not in all_used:
            issues.append({
                'type': 'unreferenced',
                'severity': 'medium',
                'name': name,
                'kind': info['kind'],
                'file': info['file'],
                'files': [info['file']],
                'line': info['line'],
                'title': f"Unused {info['kind']}: {name}",
                'description': (
                    f"'{name}' is defined in {os.path.basename(info['file'])} "
                    f"(line {info['line']}) but never referenced anywhere in the codebase."
                ),
                'fix': (
                    f"Remove '{name}' if it is truly unused. "
                    f"If intentionally private, rename with a leading underscore."
                ),
            })

    issues.sort(key=lambda x: (x['file'], x['line']))
    unused_fn  = sum(1 for i in issues if i['kind'] == 'function')
    unused_cls = sum(1 for i in issues if i['kind'] == 'class')
    dead_score = max(0, 100 - len(issues) * 4)

    return {
        'dead_score': dead_score,
        'total_issues': len(issues),
        'medium_count': len(issues),
        'files_analyzed': len(py_files),
        'issues': issues[:30],
        'summary': {'unused_functions': unused_fn, 'unused_classes': unused_cls},
    }


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else '.'
    r = find_dead_code(path)
    summary = {k: v for k, v in r.items() if k != 'issues'}
    print(json.dumps(summary, indent=2))
    print(f"\nTop issues: {r['total_issues']} total")
    for issue in r['issues'][:5]:
        print(f"  {issue['file']}:{issue['line']} — {issue['title']}")
