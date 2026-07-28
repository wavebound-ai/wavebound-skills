# Wavebound Skills

A company skill library for [Claude Code](https://claude.com/claude-code), organized
as role-based bundles so everyone installs only what their role needs. Built by
[Wavebound](https://wavebound.ai), open for anyone to use.

| Bundle | For | Skills |
| ------ | --- | ------ |
| `dev-skills` | Developers | `/tldr`, `/tldr-extended` |

More bundles (legal, marketing, ops, ...) land as teams add them — see
[CONTRIBUTING.md](CONTRIBUTING.md) for how.

## Install

In Claude Code:

```
/plugin marketplace add wavebound-ai/wavebound-skills
/plugin install dev-skills@wavebound-skills
```

Prefer plain skill folders instead of plugins? Copy them straight in — into
`~/.claude/skills/` for all your projects, or `<your-repo>/.claude/skills/` for one:

```
git clone https://github.com/wavebound-ai/wavebound-skills
cp -r wavebound-skills/plugins/dev-skills/skills/* ~/.claude/skills/
```

## The skills

### /tldr — the 30-second version

Collapses the session so far into a plain-English summary: **Short version**,
**Why it matters**, **Needs you** (only if something is blocked on you), and exactly
one **Recommend**ation. Max 150 words. Say "tldr", "short version", "i'm lost", or
"what do i actually need to know".

### /tldr-extended — the full picture

Same job, 2–4x the room (300–600 words, 2–3 minutes of reading), for when the short
version would force you to trust conclusions you can't see the reasoning behind.
Adds **What happened** (the story) and **Where things stand** (done-and-verified vs
done-but-unverified vs broken vs skipped, labeled honestly). Say "long tldr",
"give me the full picture", or "catch me up properly".

### Why they work

Both are deliberately opinionated:

- **No new work.** They summarize what's already in the conversation — no file
  reads, no re-verification, no tool calls. A TLDR that launches an investigation
  isn't a TLDR.
- **Bad news leads.** Anything broken, unverified, skipped, or unexpectedly
  expensive comes first. A reassuring summary that buries a red flag is the only way
  a summary can hurt you.
- **No jargon.** Plain words a smart non-engineer uses, keeping only the identifiers
  you'd act on (a PR number, a file path, a dollar amount).
- **One recommendation, never a menu.** Stop here / hand off to a fresh chat with
  named followups / keep going with a named next step.

## Adding skills

Copy [templates/skill-template/SKILL.md](templates/skill-template/SKILL.md) into the
right bundle and open a PR — full instructions, including adding a whole new role
bundle, in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
