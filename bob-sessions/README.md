# IBM Bob IDE Session Exports

Exported IBM Bob IDE sessions used during development of KnowledgeGuard.

## Sessions

Four sessions are included, each as a folder named by its task UUID.
Each folder contains three files:
- `ui_messages.json` — full conversation history (prompts + responses)
- `api_conversation_history.json` — raw API message log
- `task_metadata.json` — files read/edited during the session

## Session Summary

### eba44f73 — Repository Complexity Analysis
**Prompt:** "What are the most complex and critical files in this repository? Which files would cause the most damage if their author left the team?"
Bob analyzed the Flask source tree, identified high-risk files, and ranked them by criticality and bus-factor risk.

### 6e876406 — Knowledge Transfer Document Generation
**Prompt:** "@knowledge-audit Please audit the file test/test_routes.py and generate a knowledge transfer document for it."
Bob read the test file and produced a structured knowledge transfer document covering purpose, structure, and developer notes.

### fbc35bf7 — React/Vite ESLint Fix
**Prompt:** Fix ESLint errors across all JSX files in the KnowledgeGuard frontend without changing any logic or UI.
Bob audited all source files, removed a stray App.css import, corrected inter-component import paths, and added missing `key` props in `.map()` calls.

### 1fbe645d — ArchMap.jsx Interaction Bug Fixes
**Prompt:** Fix two specific issues: zoom too sensitive (0.9/1.1 → 0.97/1.03) and pan should only activate on left-mouse-button drag.
Bob applied the two targeted changes with no other modifications.

## Integration

IBM Bob was used as a VS Code extension (`ibm.bob-code`) with the project
working directory set to the KnowledgeGuard repository root.
See `backend/bob_client.py` for the backend integration that calls Bob via CLI
for the live in-app Q&A features.
