---
name: your-skill-name
description: One sentence saying what this skill does and what it produces. Then the triggers — Use when the user says "phrase one", "phrase two", "phrase three", or asks to <do the thing in their own words>. This description is the ONLY text Claude reads when deciding whether to use the skill, so the trigger phrases live here, not in the body.
---

# Skill Title

One short paragraph: who invokes this, what situation they're in, and what outcome
they want. Write it so the model understands the *intent*, not just the task.

## Rules

A few strong constraints beat many weak ones. Bold the first sentence of each rule,
then explain it in one or two more.

**The most important constraint goes first.** Usually: what the skill must NOT do
(scope it), or what must always lead the output (order it).

**A second rule.** For example: tone, honesty requirements, what to do when
information is missing.

## Output

Exactly what the response should look like — format, length cap, required sections,
and what to omit. The more concrete this section is, the more consistent the
results. Example shape:

**Section one** — what goes here, how long.

**Section two** — what goes here. Omit entirely when it doesn't apply (say so).

End with the single behavior that keeps the skill sharp, e.g. "Commit to one
recommendation; never offer a menu."
