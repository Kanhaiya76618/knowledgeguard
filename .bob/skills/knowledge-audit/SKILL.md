---
name: knowledge-audit
description: Analyze a source code file and generate a knowledge transfer document for files at risk of knowledge loss when their primary author leaves
---

When asked to audit a file for knowledge transfer, follow these steps:

## Step 1: Understand the file
- Read the entire file before writing anything
- Identify: what problem does this file solve?
- Identify: what would break if this file stopped working?

## Step 2: Document the non-obvious parts
Focus ONLY on things NOT obvious from reading the code:
- Why was this approach chosen over simpler alternatives?
- What external systems does this code depend on?
- What edge cases was this written to handle?
- What would a new developer get wrong in their first week?

## Step 3: Write the Knowledge Transfer Document
Use exactly this structure:

**WHAT THIS FILE DOES**
2-3 sentences, plain English, no jargon

**WHY IT EXISTS**
What would break or be missing without this file?

**CRITICAL DEPENDENCIES**
What does it assume about the system around it?

**THE TRICKY PARTS**
What took the original author the most time to figure out?

**SAFE TO CHANGE**
What can a new developer modify without fear?

**DO NOT TOUCH WITHOUT DEEP UNDERSTANDING**
What is dangerous to modify and why?

**3 QUESTIONS TO ASK BEFORE CHANGING THIS FILE**
1.
2.
3.

## Rules
- Write in plain English
- Never restate what the code obviously does
- Focus on knowledge that would be LOST if the author left tomorrow
- Keep each section under 5 sentences