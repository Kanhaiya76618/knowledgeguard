#  KnowledgeGuard

> *Your best developer just quit. KnowledgeGuard makes sure their knowledge didn't leave with them.*

Built with **IBM Bob** at the IBM Bob Hackathon 2026.

---

## The Problem

Every engineering team has a bus factor problem. One developer 
who "just knows" how the critical payment system works. One person 
who understands why the auth module was built that way. When they 
leave — and they will — you spend months reconstructing that knowledge.

**89% of software projects have lost their core development team at least once.**  
**The cost? Months of knowledge reconstruction, not hours.**

---

## What KnowledgeGuard Does

KnowledgeGuard uses **IBM Bob's full repository context** to:

1. **Scan** your codebase and identify files with bus factor 1
   — files only one developer truly understands
2. **Score** your repo's Knowledge Health (0–100)
   — a single number that tells you how safe your team is
3. **Document** at-risk files automatically
   — Bob generates deep knowledge transfer docs, not just code comments
4. **Ghost Developer Mode** — the feature that's never been built before
   — ask Bob questions as if your departed developer is still on the team

---

## Demo
---

## How IBM Bob Powers This

KnowledgeGuard uses Bob's most powerful features:

| Bob Feature | How We Use It |
|---|---|
| **Ask Mode** | Reads entire repo to understand file purpose and context |
| **Architect Mode** | Maps dependencies between at-risk files |
| **Custom Skills** | `knowledge-audit` skill generates structured transfer docs |
| **Custom Modes** | `Ghost Developer` mode simulates departed developer knowledge |
| **BobShell** | Self-documenting audit trail of every file Bob analyzed |

---

## Tech Stack

- **IBM Bob** — AI engine (repo context, documentation generation)
- **Python** — Git history analysis and bus factor calculation
- **HTML / JavaScript** — Knowledge Health Dashboard
- **GitHub API** — Repository scanning

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Kanhaiya76618/knowledgeguard
cd knowledgeguard

# Install dependencies
pip install -r requirements.txt

# Run bus factor analysis on any repo
python analyzer.py /path/to/your/repo

# Open the dashboard
open dashboard/index.html
```

---

## Project Status

⚡ Built during the **IBM Bob Hackathon** (May 15–17, 2026)  
🚧 Active development — star this repo to follow progress

---

## Why This Matters

> *"Knowledge silos don't announce themselves.  
> They reveal themselves when someone leaves."*

Senior developers carry years of context that never makes it into 
code comments or documentation. KnowledgeGuard makes that invisible 
knowledge visible — before it walks out the door.

---

## License

MIT — free to use, modify, and build on.

---

*Made with IBM Bob · IBM Bob Hackathon 2026*
