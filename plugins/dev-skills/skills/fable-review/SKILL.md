---
name: fable-review
description: >-
  Subagent-required, retrospective craftsmanship review of work produced in this
  conversation. Use only when the user explicitly invokes /fable-review, $fable-review,
  "Fable Review", "run Fable Review", or asks to use this skill for a serious final audit
  of work completed in this conversation, explicitly handed off for audit, or produced by
  agents/prompts/PRs coordinated from it.
  Reconstructs the original request, scales the review to blast radius, sends fresh-eye
  adversarial subagents, verifies non-destructively, fixes proven local issues, re-reviews
  substantial fixes, and reports evidence-backed confidence. Do not trigger for ordinary
  clarification, pre-task planning, standalone PR review, or "harden that" implementation
  requests unless the user explicitly asks to run Fable Review. Also runs when an orchestrator skill or loop prompt calls it through the Skill tool as
  its review gate; that is why this skill stays model-invocable.
---

# Fable Review

Run the final pass a careful senior engineer runs before work goes out under their own name.
The reward is not "done"; the reward is the thing being right.

This skill is retrospective on purpose. Same-chat self-review has a systematic leniency bias:
the author and reviewer share the same blind spots. Fable Review breaks that bias by anchoring to
the original request, sending in fresh eyes, and verifying against the real artifact.

The method is inspired by mined Fable 5 sessions and later real-world skill runs, but it is not
proof of Fable-specific magic. Treat it as a strong operating method with known limits: same-model
reviewers can share blind spots, one user's corpus is not a universal baseline, and live behavior
beats any written skill.

## Availability Gate

Before Phase 0, confirm a real subagent mechanism is available. A valid mechanism creates
independent model contexts; another paragraph of solo self-review does not count. In Claude Code,
also confirm the `fable-reviewer` agent type is available, as `fable-reviewer` when its definition
sits in `~/.claude/agents/` or a repo's `.claude/agents/`, or as `dev-skills:fable-reviewer` when this
skill is installed as the plugin (see Model Tier Gate). That definition is what pins the reviewer
model and effort.

If no valid subagent mechanism is available, do not run Fable Review. Say:

```text
Fable Review requires fresh subagents and this environment does not expose them. I can do a
separate solo verification pass if you want, but it is not Fable Review.
```

## Model Tier Gate

Fable Review depends on the reviewers being strong and running at a known effort. Do not send review
work to cheap, fast, default, or lower-context agents, and do not assume a subagent inherits a high
effort: in Claude Code the Agent tool has no effort parameter, and an unpinned subagent inherits the
session effort, which is `medium` on Opus 5.5. The only way to get a known tier is an agent
definition that pins it.

- **Claude Code default: the `fable-reviewer` agent.** Spawn every reviewer with that agent type,
  using the name your session lists: `fable-reviewer` when the definition sits in `~/.claude/agents/`
  or a repo's `.claude/agents/`, `dev-skills:fable-reviewer` when it comes from the plugin. Its
  definition pins `model: opus` (Opus 5.5 as of 2026-10-05; the alias follows the newest Opus) and
  `effort: high`, and removes the file-editing tools so reviewers report instead of patching. The
  definition ships with this bundle as `agents/fable-reviewer.md`.
- **Do not pass a `model` on the Agent call.** A per-call `model` beats the definition's pin. The one
  exception is the user asking for a different tier in this conversation (for example "use Fable
  reviewers" or "max effort"); then pass it and say so in the report.
- **The pin is a floor.** Never Sonnet, Haiku, fast mode, or a default or medium/low-effort agent.
  If `fable-reviewer` is missing from the available agent types, copy `agents/fable-reviewer.md`
  into `~/.claude/agents/` or the repo's `.claude/agents/`. A definition added mid-session shows up
  on a later turn, not inside the turn that created it, so install it, end the turn, then spawn. If
  it still is not listed, fall back to a general-purpose agent with `model: opus`, which runs at the
  session's effort, and record that downgrade in the report. If only Sonnet, Haiku, default, or fast
  agents exist, do not call the run a true Fable Review.
- Other hosts apply the same rule with their own pin. Codex: pass `model: "gpt-6-astra"`,
  `reasoning_effort: "high"`, and `fork_turns: "none"` on every `spawn_agent` call (as of
  2026-10-05); a spawn that names no effort runs at `medium`.
- Include the requested tier in each subagent prompt. If the platform exposes the actual model or
  effort used, record them in the final report.
- Never downshift for token cost without saying so. If the pinned tier is likely to exceed the
  user's budget, stop and ask before running a cheaper imitation.

## Operating Standard

- Do not trust memory. Rebuild the task from the conversation, files, diffs, and tool output.
- Do not trust status words. "Done", "green", "merged", "deployed", "fixed", and "empty result"
  are hypotheses until checked against the actual system.
- Use precise state labels when scope matters: `local-code-green` means local files/checks only;
  `PR-green` means branch/PR contents and CI are verified; `multi-lane-reconciled` means named
  agents/PRs/branches were inventoried and classified; `staging-green` means staging runtime and
  checks are verified; `prod-ready` means verified up to the production gate but not deployed; and
  `prod-deployed` means production runtime evidence was checked after deploy.
- Do not trust your own surprising output. A clean zero, perfect parse, or no failures where
  failures were expected often means the command, query, or harness is wrong.
- Do not seed reviewers with your suspected findings. Fresh eyes given your conclusion are no
  longer fresh.
- Verify non-destructively. A review pass must not deploy, mutate data, fire paid APIs, rotate
  secrets, run broad workers, or perform irreversible external actions. "Paid APIs" means
  project/external APIs beyond the reviewer model calls explicitly required for Fable Review.
- Fix only findings you can prove and safely change locally. Aggressive care must not become
  aggressive guessing.
- Findings do not automatically expand the current lane. Report whether each finding blocks the
  current lane, blocks launch but can be scheduled separately, belongs in a future lane, is only a
  watch/note, or is rejected. The orchestrator/human decides execution order.
- Scale the ceremony to the blast radius. The point is not maximum ritual; it is the smallest
  durable artifact and verification surface that prevents drift.
- The last file gets the same attention as the first.

## Review Scale

State the scale in the report.

- **Lightweight:** small, local, low-risk change. Use 2 focused subagents, a fresh change-set read,
  and the one or two checks that directly cover the change.
- **Full:** multi-file, user-facing, security/data/deploy/schema, production, or hard-to-reverse
  change. Use 3-5 subagents across distinct lenses, run real non-destructive verification, and
  re-review substantial fixes.
- **Broad audit:** cross-system, handoff, drift, or reality-audit work. Use 4+ subagents or a
  workflow, require source-of-truth inventory, and produce durable state.

Note rough agent/token cost in the report so over-spend stays visible.

## Modes

Use the same phases below, but name the mode up front.

- **Retrospective Review:** Default. Review the work just completed in this conversation.
- **Handoff Audit:** Use when inheriting another agent's or prior session's work. Every inherited
  claim like done, merged, deployed, green, fixed, or blocked needs an independent check.
- **Drift Reconcile:** Use when local/prod/fork/worktree state has diverged. Snapshot first,
  classify differences as LAND / DROP / UNKNOWN, exclude secrets, define an abort list, then
  verify the resulting server/repo state.
- **Production/External Action Review:** Use when the work touched deploys, credentials, org
  settings, database mutations, schema, billing, or long production runs. Review and prepare only;
  new external writes require fresh user confirmation in the current turn.
- **Prompt Grounding:** Use when reviewing a prompt or handoff. Ground it in code rails, existing
  CLIs, cost limits, project rules, and account/repo constraints before polishing text.
- **Coordinator Audit:** Use when this conversation spawned agents, prompts, PRs, branches, or
  follow-up work. Inventory each lane, then judge the combined estate instead of one artifact.

## Phase 0: Reconstruct The Mission

Define the rubric before judging the work.

1. State the exact task being reviewed in one or two sentences.
   If a **fable-start brief** exists for this work (check the conversation, the project's goals
   directory, and the session scratchpad), load it as the rubric: its acceptance criteria seed the
   requirement list in step 7, its out-of-scope list bounds the diff audit, and its rules-read list
   is verified against the work. Still cross-check the brief against what was actually asked —
   brief-vs-ask drift is itself a finding.
2. List explicit and implicit requirements as checkable items. Include error, empty, loading,
   auth, scale, data, docs/tests, downstream integration, and project-rule implications.
   Surface this list proportional to blast radius so per-requirement coverage is auditable later.
3. Identify the artifact root before running git commands:
   - If changed files are inside a git repo, run commands from that repo root.
   - If work was already committed this session, use `git show`, `git diff <base>...HEAD`, or the
     relevant commit range. Empty `git diff` often means committed, not unchanged.
   - If the artifact is outside git, inspect the touched files, timestamps, generated outputs,
     sibling files, and source references directly.
   - Never assume the caller's current working directory is the artifact root.
4. Re-run the change-set command fresh. Do not trust your memory of what you changed.
5. Cross-check the change set against what you claimed in chat. A mismatch is a finding.
6. Read local correctness rules: `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`, `.cursorrules`,
   contributing docs, postmortems, feature docs, schema docs, or task-specific instructions.
7. Write acceptance criteria. These become the report's requirement coverage table.
8. For broad audits, do a read-only inventory before fixes: source-of-truth docs, prompts created,
   agents spawned, git state, dirty files, active branches/worktrees, merged/open/stale PRs,
   production/runtime state, CI/deploy state, and adjacent agents' ownership.
9. If an open PR or branch is reviewed after related work landed, check it against current base:
   use `git merge-tree` or a disposable worktree when practical, run the combined relevant checks,
   and audit PR text/docs/comments for stale claims. Never trial-merge in the user's active
   worktree unless explicitly confirmed and cleaned up.
10. For production-facing work, check source/runtime drift: live version/source, `origin/main`
    source, open PR source, and the next deploy path. If production is patched but main is not,
    treat a future deploy from main as a regression risk, not as a closed issue.

For non-code work, keep the same spine. For docs, verify factual claims against sources and check
internal consistency. For configs, schema-validate/lint and dry-run. For generated artifacts, render
or export and inspect the actual output.

## Phase 1: Send Fresh Eyes

Spawn independent reviewers in parallel. In Claude Code every reviewer is the `fable-reviewer`
agent type with no `model` override (see Model Tier Gate). Give each the same context kit:

- task summary
- requirements and acceptance criteria
- project rules
- changed files/diff or artifact paths
- verification already run

Do not include suspected defects or conclusions you already have. Frame every reviewer as a skeptic:

```text
Assume there are defects. Find them and prove them with evidence. Do not reassure.
```

Use these lenses, scaled to the work:

- **Verification and evidence:** Treat every load-bearing claim as a hypothesis until checked
  against ground truth. Was state verified after the change? Did the command actually run?
- **Correctness and bugs:** Try to break it with nulls, empties, large inputs, unsafe integers,
  malformed external data, failed APIs, time zones, encoding, retries, and concurrency.
- **Completeness and bigger picture:** Walk each requirement as met / partial / missed. Check
  call sites, configs, migrations, docs, tests, downstream consumers, and root cause.
- **Reachability and live data path:** If the change adds or alters a data path, prove real/live
  data flows through it end-to-end. Check sibling/existing tables or producers for where the live
  data already lands. Perfect code on an unpopulated path is inert; that must be the headline
  finding, not "nothing open."
- **Source-omission audit:** For extraction, diligence, audit, or summary work, at least one
  reviewer re-opens the source artifact and hunts for items omitted entirely.
- **Project and domain compliance:** Check local rules and known traps. Postmortems usually exist
  because the failure already happened.
- **Runtime/user surface:** Check the surface a real consumer uses: frontend query, public API,
  deployed function manifest, generated artifact, logs, console, queue state, or downstream table.
- **Craft and efficiency:** Look for the sigh: confusing names, dead code, duplication, foreign
  style, needless complexity, missing guardrails, N+1s, repeated external calls, or wasteful
  re-scraping/recomputing.

Add specialized lenses only when the work calls for them:

- **Coverage binding:** Would each new test fail against the broken behavior, live call site, or
  production-shaped fixture it claims to cover?
- **Scope inventory:** Challenge omitted files, routes, functions, PRs, branches, docs, and deploy
  targets. A neat list can still be the wrong list.
- **Consumer semantics:** For signed/derived/internal values, check every public word, threshold,
  constraint, and downstream consumer that may require different semantics.
- **Runtime parity and deploy order:** Check whether merged code is actually running, whether hosts
  pulled it, and whether deploy order or shared-module packaging changes behavior.
- **Data identity/linkage:** For pipelines, prove upstream proof rows match the downstream entity,
  not merely the immediate source row.
- **Operator/source inheritance:** For docs and runbooks, verify commands are pasteable and copied
  claims still match source truth.

Each reviewer returns:

```text
Severity: Critical | Should-fix | Polish
Location: file + quoted offending line, or artifact section
Evidence: why this is real
Suggested fix: concrete next action
Confidence: verified | inferred | unknown
Lane impact: blocks current lane | blocks launch | future lane | watch/note | rejected
```

## Phase 2: Verify Non-Destructively

Reading is not verification. But verification must itself be non-destructive and free of external
side effects.

Prefer read-only checks, dry-runs, local harnesses, controls, and rolled-back transactions:

- tests, type-checks, linters, builds, format checks
- `deno check`, `deno test`, `npm test`, `pytest`, `dbt test`, CI-equivalent commands
- local/test/staging endpoint probes or documented zero-side-effect health/read endpoints,
  read-only/idempotent local or test-scope function calls, dry-runs, SQL `SELECT`s,
  `BEGIN ... ROLLBACK`, rendered screenshots, exports, or sample validation

For git-backed work, add an inclusion gate before any positive verdict: prove the reviewed artifact
is in the actual commit/PR/head, not merely the working tree. Check `git status --short`, the
changed-file list, `git diff <base>...HEAD`, and for new files `git ls-files <path>` or
`git show HEAD:<path>`.

Never run a write, production deploy, schema migration, data mutation, paid external API call,
worker, mass retry, backfill, queue drain, secret/auth change, global account switch, or costly
production job as "verification." If proving something requires one, surface it as a gated
ready-to-run command in the report instead of executing it.

For data/pipeline work, verify downstream quality, not just row existence:

- no NULLs in required fields
- no duplicate keys
- JSON is real JSON, not double-encoded strings
- required URLs are reachable
- numeric ranges are sane
- row counts match expected deltas
- failure reasons, retry behavior, cooldowns, polling states, and timeout budgets distinguish
  operator bugs from retryable external failures

For UI work, screenshots are not enough. Build or render where possible, inspect responsive states,
and clear console/log errors or prove/report them as unrelated.

When the canonical check is unavailable, reconstruct an equivalent: known-good vs known-bad probes,
render with real config, local fixtures, rollback transactions, or a pre-change comparison. If you
claim a failure is pre-existing, prove it by isolating your changes where possible.

For empirical claims, label numbers as **measured**, **estimated**, or **hypothesis**. For costly,
production-facing, or easy-to-fool-yourself measurements, pre-register scope, taint rules, sample
size, and decision gates before collecting data.

If CI or deploy status is part of the verdict, classify them separately:
`CI: pass | code-fail | skipped-secret | infra-fail | flaky-retry-pass | unknown` and
`Deploy: not-deployed | staging-deployed | prod-gate-pending | prod-deployed | deploy-failed |
unknown`, with the evidence source for each.

## Phase 3: Judge Honestly

1. Deduplicate findings.
2. Verify each finding before changing code. Reviewers can be wrong. Record findings you disproved
   instead of quietly dropping them.
3. Bucket:
   - **Critical:** wrong, unsafe, data-corrupting, production-breaking, or violates the core request.
   - **Should-fix:** works but fragile, non-compliant, incomplete, or meaningfully sloppy.
   - **Polish:** improves inheritance quality without changing behavior.
4. Classify lane impact separately from severity:
   - **blocks current lane:** must be fixed or explicitly accepted before the reviewed lane can proceed.
   - **blocks launch:** real and important, but can become a separate lane before launch/customer exposure.
   - **future lane:** valid follow-up that should be scheduled, not folded into this lane by default.
   - **watch/note:** useful context or low-confidence risk that should be recorded.
   - **rejected:** disproved, out of scope, or not a real issue after verification.
5. Name what you could not verify and why. Honest coverage beats confident theater.

## Phase 4: Fix Properly

Fix everything you are genuinely confident in and allowed to change locally. Confidence means you
can say why the change is correct and have re-run verification to show it.

Allowed by default:

- local source, docs, and tests in the current worktree
- deterministic generated local artifacts already part of the task
- formatting/type fixes that do not broaden runtime behavior beyond the proven issue

Disallowed without fresh confirmation in the current turn:

- production deploys/redeploys
- schema migrations or data writes
- external account, org, repo, auth, or secret changes
- global auth switching
- paid calls, long-running jobs, broad workers
- bulk retries, force-discard flows, backfills, queue drains, or broad production automation

After each meaningful fix, re-run the relevant verification.

Send fresh eyes (the same `fable-reviewer` tier) back over the fix diff when the fix is
non-trivial, concretely if it:

- touches more than about 3 files
- adds, removes, or relies on new tracked files
- adds new branching/control flow
- changes any factual claim, status label, test, doc, or operator command
- changes auth, tenant scope, security, data paths, deploy/runtime scripts, boundary predicates,
  pagination, time windows, identity guards, or user-visible behavior

Loop fix -> verify -> re-review until only Polish remains or nothing new appears. Cap at about 3
rounds. If the loop does not converge, stop and report that as a finding. State in the report
whether post-fix re-review ran.

If a fix is correct but only provable by a gated/destructive/external action, apply only the local
part, label it **inferred, not verified**, and include the exact verification command in the report.

Match surrounding code. Fix the class, not just the instance: add the guard/test/doc that would have
caught it, repair data it silently skipped when allowed, and write the lesson where the project
expects lessons.

Default non-destructive. Never `git checkout`, `git restore`, or `git reset` a file that also holds
your uncommitted fixes. Revert exact lines surgically; if a broad revert is unavoidable, stash or
commit your fixes first.

## Phase 5: Report Honestly

Use this report contract. Do not substitute a freeform summary. If a section has nothing to
report, write `None.` so absence is explicit instead of implied.

```markdown
## Fable Review - <task reviewed> [lightweight | full | broad audit]

**Verdict:** Clean | Fixed | Needs-fix | Needs-your-call | Blocked - one honest sentence.

**Checked:** <mode/scale, artifact root/source of truth, subagents requested (agent type, model,
effort), actual models if exposed, model downgrades if any, commands/tests/live checks/screenshots/queries actually run,
post-fix re-review status, rough token/agent cost>

**Highest-impact findings:**
- **Critical | Should-fix | Polish:** <short finding>
  **Location:** <file + quoted line, artifact section, endpoint, table, or "unknown">
  **Evidence:** <why this is real; measured/inferred/unknown where relevant>
  **Suggested fix:** <concrete next action>
  **Confidence:** verified | inferred | unknown
  **Lane impact:** blocks current lane | blocks launch | future lane | watch/note | rejected

**Requirements:**
- <acceptance criterion>: met | partial | missed | not-checked - <evidence or reason>

**Fixed:**
- <fix applied: file/section + why it is correct + verification rerun; mark inferred/not verified>

**Not fixed:**
- <verified issue left open: severity, owner, reason, follow-up needed>

**Disproved:**
- <reviewer finding checked and rejected, with evidence>

**Not verified:**
- <important thing not checked, why, and what would verify it>

**Recommended next step:** <one concrete action: ship, open follow-up PR, rerun gated check, ask for
product/security call, rollback, etc.>
```

For coordinator audits, or any audit involving agents, PRs, branches, or spawned follow-up work,
include `Lanes reviewed: <agent/PR/branch/artifact | source of truth | checked evidence |
disposition>`. For broad or production/external audits, add concise optional lines when they matter:
`State labels`, `Execution boundary`, `Runtime/deploy state`, `Source/runtime drift`, `CI caveats`,
and `Superseded branches`.

Lead with the single finding that most changes the user's plan, even if unasked. Every confidence
claim needs evidence. Do not bury a blocking issue under a generally positive verdict. The report
must separate "tests are green" from "the behavior is trustworthy."

When referencing files, give ready-to-paste commands:

```bash
open /absolute/path/to/file
```

## Companion Files

- `agents/fable-reviewer.md` (in this bundle's top-level `agents/` folder) is the reviewer agent
  definition this skill spawns. Installed as a plugin it registers on its own. Installed as plain
  skill folders, copy it to `~/.claude/agents/` (every repo on the machine) or a repo's
  `.claude/agents/` (checkouts, scheduled and cloud sessions); keep every copy byte-identical and
  change the model or effort pin in all of them in the same change.
- Never add a `commands/fable-review.md` next to this skill. A command file with the skill's name
  shadows the skill: the slash command and the Skill tool load the command's text instead of this
  file, and a command that says "use the fable-review skill" resolves back to itself.
- When improving this skill from transcript evidence, do not mine vibes. Use the bundled corpus
  script and `references/corpus-mining.md`.
- `references/start-of-task-harness.md` is source material for a start-of-task companion skill
  that writes the brief this skill grades against (Phase 0, step 1). That companion is not part of
  this bundle. Do not trigger Fable Review from start-of-task requests.
