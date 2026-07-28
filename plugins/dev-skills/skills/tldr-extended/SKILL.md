---
name: tldr-extended
description: The longer sibling of /tldr — same job (collapse the conversation into plain English — what happened, why it matters, one recommended next step) but 2–4x longer and more detailed, for when a 150-word summary would cut too much. Use when the user says "tldr extended", "long tldr", "detailed tldr", "full tldr", "give me the full picture", "walk me through what happened", "catch me up properly", or asks for a plain-English summary with more detail than the short version.
---

# TLDR — Extended

The user is asking for the same thing /tldr gives them — the session in plain
English — but with room to actually understand it. They stepped away, or the session
was long or messy enough that a 150-word version would force them to trust
conclusions they can't see the reasoning behind. Assume they own the outcome but are
not reading the code. Make them correctly and completely informed in 2–3 minutes of
reading — and scannable in 15 seconds when they're only triaging.

## Rules

Same rules as /tldr. The extra length buys more explanation, not more license:

**Summarize what's already in this conversation. Do not do new work.** No file reads,
no greps, no re-verification, no tool calls. This is a summary, not an audit — if you
don't already know something, "I didn't verify X" is itself useful information, not a
gap to go fill now. Exception: if they point at a specific thing (a file, a doc, a
pasted block), read that one thing — it's the subject, not an investigation.

**Plain English is not the same as good news.** Anything broken, unverified, skipped,
assumed, or unexpectedly expensive leads its section. The extra length exists so bad
news gets properly explained, not diluted — a longer summary that buries a red flag
under three paragraphs of progress is worse than the short version.

**No jargon.** Not "PGRST202", "fail-closed", "idempotent", "tombstone",
"incremental model". You now have space to explain a mechanism in a plain sentence
instead of naming it — use it. Keep the identifiers the user would need to act on —
PR numbers, job ids, file paths, dollar amounts — and drop every other one.

**Tell the story, don't replay the transcript.** The user should end up
understanding what happened and why, not relive every command. Group by topic, not
by timestamp. Dead ends earn a mention only when they changed the conclusion or cost
something.

## Output

Target 300–600 words — roughly 2–4x the short version, never more. No preamble, no
"Here's the extended TLDR".

**Design for two reading speeds.** The full read is 2–3 minutes; the skim is 15
seconds. Headers say what lives where, status glyphs mark state, and bold is the
highlighter: in every bullet and paragraph, bold the few words that carry the
conclusion, so reading only the bold text still tells a true, coherent story. Bold
sparingly — once more than roughly 15% of the text is bold, nothing is highlighted.
Identifiers the user would act on (file paths, PR numbers, job ids, commands) go in
`code`. Bullets are the default, each leading with its point; use a short paragraph
only where the story genuinely flows better.

Render exactly these six sections, in this order, each with a real `##` markdown
header bearing exactly this name:

**Short version** — 2–4 sentences with the key outcomes **bolded**. What happened
and where things stand, so everything after it is elaboration rather than suspense.

**What happened** — the story, grouped by topic, never by timestamp. When there are
two or more distinct threads, give each its own `###` sub-header — a plain-English
mini-headline ("The staging check", "The cleanup that fought back") — so the reader
can skip a whole thread at a glance. Under each: 2–5 bullets covering what was
attempted, what was found or built, and what changed course and why. This is the
section the short /tldr doesn't have — spend the words here.

**Where things stand** — one bullet per item, grouped under these glyphs, in this
order, empty groups omitted:
- ✅ **Done and verified**
- 🟡 **Done but NOT verified** — name what would verify it
- ❌ **Broken or still open**
- ⏭️ **Deliberately skipped** — and why

"Done" without "verified" is always 🟡, never ✅.

**Why it matters** — 2–4 sentences or bullets in terms of money, time, risk,
customers, or the launch. Not technical elegance. If nothing rises to that level,
say so in one line.

**⚠️ Needs you** — only if something is genuinely blocked on the user's decision.
One bullet per decision: **the choice in bold**, then the tradeoff in plain terms.
Omit the section entirely — header included — otherwise.

**Recommend** — exactly one sentence, picking one of:
- *Stop and close this out* — done, verified, nothing pending.
- *Save a handoff summary and open a fresh chat with these followups* — clean
  stopping point but more to do, or the context is getting long. Name the followups
  (2–4 max).
- *Keep going — next: X* — obvious next step, context still good.

Commit to one. Never offer a menu; a recommendation is what they asked for.
