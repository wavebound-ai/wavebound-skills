---
name: tldr
description: Collapse the conversation so far into a plain-English TLDR — what actually happened, why it matters, and one recommended next step. Use when the user says "tldr", "explain this in plain english", "short version", "too technical", "i'm lost", "i'm in a rush", "what do i actually need to know", or asks to cut a long or technical answer down to what matters.
---

# TLDR

The user is asking because the last output was too long, too technical, or they're
short on time. Assume they own the outcome — a founder, a lead, a teammate on
another track — and are not reading the code. Make them correctly informed in under
30 seconds.

## Rules

**Summarize what's already in this conversation. Do not do new work.** No file reads,
no greps, no re-verification, no tool calls. If you don't already know something, say
so in half a sentence instead of going to find out. Speed is the entire point.
Exception: if they point at a specific thing (a file, a doc, a pasted block), read
that one thing — it's the subject, not an investigation.

**Plain English is not the same as good news.** If something is broken, unverified,
skipped, or cost money unexpectedly, that leads. A reassuring TLDR that buries a red
flag is the only way this skill can actually hurt the user.

**No jargon.** Not "PGRST202", "fail-closed", "idempotent", "tombstone",
"incremental model". Say what it does in words a smart non-engineer uses. If a term
is unavoidable, gloss it in five words. Keep only the identifiers the user would
need to act on — a PR number, a job id, a file path — and drop every other one.

**Don't re-teach the session.** Assume they half-read it. Successes get one line
total, not a list. Spend the words on what's true now and what it means.

## Output

Max 150 words. No preamble, no "Here's the TLDR". Four labeled lines:

**Short version** — 1–3 sentences or up to 4 bullets. What happened and where things
actually stand, with just enough context to make sense standing alone.

**Why it matters** — 1–2 sentences, in terms of money, time, risk, customers, or the
launch. Not technical elegance.

**Needs you** — only if something is genuinely blocked on the user's decision. State
the choice in one line. Omit this line entirely otherwise.

**Recommend** — exactly one sentence, picking one of:
- *Stop and close this out* — done, verified, nothing pending.
- *Save a handoff summary and open a fresh chat with these followups* — clean
  stopping point but more to do, or the context is getting long. Name the followups
  (2–4 max).
- *Keep going — next: X* — obvious next step, context still good.

Commit to one. Never offer a menu; they asked for a recommendation because they're
in a rush.
