import ast
import os
import json
from collections import defaultdict

SKIP_DIRS = {'.git','__pycache__','node_modules','.venv','venv',
             'dist','build','.tox','eggs','.eggs','migrations'}

def get_source_files(repo_path):
    files = []
    code_exts = {'.py','.js','.ts','.jsx','.tsx'}
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for f in filenames:
            if any(f.endswith(ext) for ext in code_exts):
                files.append(os.path.join(root, f))
    return files

def get_imports(filepath):
    if filepath.endswith('.py'):
        try:
            with open(filepath,'r',encoding='utf-8',errors='ignore') as fh:
                tree = ast.parse(fh.read())
            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split('.')[0])
            return list(imports)
        except Exception:
            return []
    else:
        import re
        try:
            with open(filepath,'r',encoding='utf-8',errors='ignore') as fh:
                source = fh.read()
            pattern = r"(?:import|from|require)\s*\(?['\"]([^'\"]+)['\"]"
            return [m.split('/')[-1].replace('.js','').replace('.ts','')
                    for m in re.findall(pattern, source) if m.startswith('.')]
        except Exception:
            return []

def get_loc(filepath):
    try:
        with open(filepath,'r',encoding='utf-8',errors='ignore') as fh:
            return sum(1 for l in fh if l.strip() and not l.strip().startswith(('#','//','/*','*')))
    except Exception:
        return 0

def build_path_graph(repo_path, source_files):
    name_map = {}
    for fp in source_files:
        rel = os.path.relpath(fp, repo_path).replace('\\','/')
        base = os.path.splitext(os.path.basename(rel))[0]
        name_map[base] = rel
    graph = {}
    for fp in source_files:
        rel = os.path.relpath(fp, repo_path).replace('\\','/')
        resolved = []
        for imp in get_imports(fp):
            if imp in name_map and name_map[imp] != rel:
                resolved.append(name_map[imp])
        graph[rel] = list(set(resolved))
    return graph

def detect_cycles(graph):
    cycles = []
    visited = set()

    def dfs(node, path):
        if node in path:
            idx = path.index(node)
            cycle = path[idx:]
            key = tuple(sorted(cycle))
            if len(cycle)>1 and key not in [tuple(sorted(c)) for c in cycles]:
                cycles.append(list(cycle))
            return
        if node in visited:
            return
        visited.add(node)
        path.append(node)
        for nb in graph.get(node,[]):
            dfs(nb, path[:])
        path.pop()

    for node in list(graph.keys()):
        dfs(node, [])
    return cycles[:5]

def analyze_architecture_debt(repo_path):
    source_files = get_source_files(repo_path)
    if not source_files:
        return {'error':'No source files found'}

    path_graph = build_path_graph(repo_path, source_files)
    raw_graph = {}
    reverse_graph = defaultdict(list)
    file_locs = {}

    for fp in source_files:
        rel = os.path.relpath(fp, repo_path).replace('\\','/')
        raw_imports = get_imports(fp)
        raw_graph[rel] = raw_imports
        file_locs[rel] = get_loc(fp)
        base = os.path.splitext(os.path.basename(rel))[0]
        for imp in raw_imports:
            reverse_graph[imp].append(rel)

    cycles = detect_cycles(path_graph)
    circular_issues = [{
        'type':'circular_dependency','severity':'critical',
        'files':c,
        'title':f'Circular import chain ({len(c)} files)',
        'description':f'Files import each other in a circle: {" → ".join(c[:3])}{"→…" if len(c)>3 else ""}. Causes hidden bugs, failed tests, and prevents testability.',
        'fix':'Extract shared logic into a new module that both files import. Neither should know about the other.'
    } for c in cycles]

    god_issues = []
    for rel, raw_imports in raw_graph.items():
        out = len(set(raw_imports))
        base = os.path.splitext(os.path.basename(rel))[0]
        inn = len(reverse_graph.get(base,[]))
        if out>8 or inn>6:
            god_issues.append({
                'type':'god_file',
                'severity':'critical' if (out>14 or inn>10) else 'high',
                'file':rel,'files':[rel],
                'imports_count':out,'imported_by_count':inn,
                'title':f'God file — {out} imports · used by {inn} files',
                'description':f'{os.path.basename(rel)} is doing too much. Files this connected are impossible to test in isolation and become a team bottleneck.',
                'fix':'Split by Single Responsibility Principle. Extract each distinct concern into its own module.'
            })

    large_issues = []
    for rel,loc in sorted(file_locs.items(),key=lambda x:-x[1]):
        if loc>400:
            large_issues.append({
                'type':'oversized_file',
                'severity':'critical' if loc>900 else 'high',
                'file':rel,'files':[rel],'lines':loc,
                'title':f'Oversized file — {loc} lines',
                'description':f'{os.path.basename(rel)} has {loc} lines of code — too many responsibilities mixed together. New developers need hours to understand it.',
                'fix':f'Split into {loc//300+1} focused modules. Each file should have one purpose understandable in 5 minutes.'
            })
        if len(large_issues)>=5:
            break

    all_issues = circular_issues + god_issues[:4] + large_issues[:4]
    critical = sum(1 for i in all_issues if i['severity']=='critical')
    high = sum(1 for i in all_issues if i['severity']=='high')
    debt_score = max(0,100-critical*20-high*7)

    # Architecture map data
    node_ids = list(path_graph.keys())[:28]
    node_index = {n:i for i,n in enumerate(node_ids)}
    edges = []
    for src,targets in path_graph.items():
        if src not in node_index:
            continue
        for tgt in targets:
            if tgt in node_index and tgt!=src:
                edges.append({'source':node_index[src],'target':node_index[tgt]})

    degree = defaultdict(int)
    for e in edges:
        degree[e['source']]+=1
        degree[e['target']]+=1

    map_nodes = [{
        'id':i,'label':os.path.basename(rel),'full_path':rel,
        'loc':file_locs.get(rel,0),'degree':degree[i],
        'is_god':any(iss.get('file')==rel for iss in god_issues),
        'is_large':any(iss.get('file')==rel for iss in large_issues)
    } for i,rel in enumerate(node_ids)]

    return {
        'debt_score':debt_score,'total_files':len(source_files),
        'total_issues':len(all_issues),'critical_count':critical,'high_count':high,
        'issues':all_issues,
        'summary':{'circular_dependencies':len(circular_issues),'god_files':len(god_issues),'oversized_files':len(large_issues)},
        'map':{'nodes':map_nodes,'edges':edges}
    }

if __name__=='__main__':
    import sys
    path = sys.argv[1] if len(sys.argv)>1 else '.'
    r = analyze_architecture_debt(path)
    no_map = {k:v for k,v in r.items() if k!='map'}
    print(json.dumps(no_map,indent=2))
    if 'map' in r:
        print(f"\nArchitecture map: {len(r['map']['nodes'])} nodes, {len(r['map']['edges'])} edges")