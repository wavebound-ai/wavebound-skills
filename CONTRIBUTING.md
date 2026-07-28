# Contributing a skill

This repo is a Claude Code **plugin marketplace**: each role bundle under `plugins/`
is one installable plugin, and each skill is one folder with a `SKILL.md` inside it.

```
.claude-plugin/marketplace.json      <- lists the bundles
plugins/
  dev-skills/
    .claude-plugin/plugin.json       <- bundle name + description
    skills/
      tldr/SKILL.md                  <- one skill
      tldr-extended/SKILL.md
templates/
  skill-template/SKILL.md            <- start here
```

## Add a skill to an existing bundle

1. Copy `templates/skill-template/SKILL.md` to
   `plugins/<bundle>/skills/<your-skill-name>/SKILL.md`.
2. Set the frontmatter:
   - `name:` must match the folder name, lowercase, hyphens only. It becomes the
     `/slash-command`.
   - `description:` is the **only thing Claude reads when deciding whether to
     trigger the skill** — one sentence on what it does, then the literal phrases a
     user would say ("Use when the user says \"...\", \"...\", or asks to ...").
3. Write the body: who's asking and what outcome they want, the rules that make it
   reliable, and a concrete output format (length cap, required sections).
4. Test it before the PR: `cp -r` your skill folder into `~/.claude/skills/`, start
   a fresh Claude Code session, and check both the explicit `/name` invocation and
   the trigger phrases.
5. Open a PR.

## Add a new role bundle (legal, marketing, ...)

1. Create `plugins/<bundle-name>/` mirroring `dev-skills`: a
   `.claude-plugin/plugin.json` (copy the dev-skills one, change name/description)
   and a `skills/` folder with at least one skill.
2. Add a matching entry to the `plugins` array in
   `.claude-plugin/marketplace.json` with `"source": "./plugins/<bundle-name>"`.
3. Add the bundle to the table in `README.md`.

Bundle names are what people type to install (`/plugin install
legal-skills@wavebound-skills`), so keep them short and role-shaped:
`legal-skills`, `marketing-skills`.

## Rules

- **This repo is public.** No API keys, credentials, customer names or data,
  internal URLs, or anything Wavebound-confidential — in skills, examples, or
  commit messages. If a skill only works with private context, it doesn't belong
  here.
- **Skills must be self-contained.** No references to specific private repos,
  people, or infrastructure. Anyone at any company should be able to install and
  use them.
- **One skill, one job.** If the description needs "and also", split it.
- Writing style: short, declarative rules with the first sentence bolded. Say what
  to do, not what to avoid, wherever possible.
