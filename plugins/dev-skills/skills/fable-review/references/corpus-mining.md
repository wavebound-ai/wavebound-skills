# Corpus Mining Harness

Use this when evolving `fable-review` from local Claude Code transcripts. Run the commands from the skill folder.

The corpus artifact names use `fable-*` because they describe the Claude Fable
model lineage being mined. They are not active invocation names or skill package
names.

## Goal

Extract transferable procedures from real sessions. Do not imitate tone, confidence, or phrasing.
Only keep behaviors that are observable, repeated, useful, and checkable.

## Workflow

1. Build an index from structured transcript fields, not keyword search:

   ```bash
   deno run --allow-read --allow-write --allow-env scripts/fable-review-corpus.ts index --root ~/.claude/projects --out ./corpus/fable-session-index.json --model claude-fable-5
   ```

2. Select top-level sessions by actual `message.model`, not by text containing "Fable".
   `--model` matches exactly or as a dash-separated prefix, so `claude-fable-5` covers both
   `claude-fable-5` and `claude-fable-5-1` (transcripts since mid-2026 carry both), and
   `claude-opus-5` covers `claude-opus-5` and `claude-opus-5-5`.
3. Condense selected sessions before review:

   ```bash
   deno run --allow-read --allow-write --allow-env scripts/fable-review-corpus.ts condense-many --manifest ./corpus/fable-session-index.json --out-dir ./corpus/fable-condensed --limit 20 --model claude-fable-5
   ```

4. Split condensed sessions across subagents. Give each disjoint files and ask for:
   - recurring procedures
   - evidence anchors
   - frequency across assigned sessions
   - whether each belongs in the post-task skill, start-of-task harness, or mining harness
   - cautions against cargo-culting
5. Synthesize across agents. Keep only patterns with evidence from multiple unrelated task types,
   or one highly specific pattern that prevents a known severe failure.
   - Deduplicate forks and repeated continuation starts. Shared prompts or copied diaries are not
     independent proof unless the sessions diverge later.
   - Mark whether evidence is from backend, frontend, production/debugging, planning, prompt review,
     or handoff work. A pattern that appears across categories is more transferable.
6. Update `SKILL.md` only with operational instructions. Put background evidence here or in a
   scratch research note, not in the skill body.
7. Validate the skill against realistic with-skill and without-skill prompts before treating it as
   production-stable.

## Evidence Rules

- A model field beats a keyword.
- A tool result beats a chat claim.
- A post-change query beats a pre-change assumption.
- A repeated pattern across unrelated sessions beats a memorable anecdote.
- A precise procedure beats a slogan like "be thorough".

## Redaction

The script redacts common key and credential shapes, but transcripts may still contain sensitive
business details. Do not paste long transcript excerpts into chat. Use short anchors and summaries.
