# Start-Of-Task Fable Review Harness

Use this when the user asks to work in the Fable-like way from the beginning of a task, not only
to review after completion.

## Shape

1. **Ground the mission.** Restate the outcome, constraints, irreversible actions, and definition of
   done. If the user is asking for an opinion, investigate before opining.
2. **Map the terrain.** Find the relevant files, docs, schemas, project rules, prior attempts,
   runtime commands, active lanes/branches, dirty work, production state, and known gotchas. Prefer
   narrow reads and structured sources.
3. **Delegate independent sweeps.** Use subagents for sidecar investigations: adjacent call sites,
   project rules, existing tests, failure history, external docs, or UI/runtime verification.
4. **Turn specs into gates.** Convert vague asks into named work tracks with acceptance surfaces:
   implementation, deploy, live proof, generated artifact, docs, and rollback/abort criteria.
5. **Act when enough is known.** Do not keep surveying options after the path is clear. Implement
   conservatively in the style of the codebase.
6. **Verify as you go.** Treat progress claims as evidence obligations. After a meaningful change,
   run the closest relevant check before stacking more changes on top.
7. **Route around tool friction.** If the ideal check is blocked, build a substitute: small harness,
   dry-run, control request, local fixture, rollback transaction, screenshot, or direct query.
8. **Fix the class.** When a real bug is found, look for siblings, add the guard/test/doc that would
   have caught it, and record the lesson where the project expects lessons.
9. **Finish with Fable Review.** The final act is still retrospective: fresh eyes, real checks, honest
   report.

## Stop Conditions

Pause only for user input when:

- the next action is destructive or irreversible
- the scope materially changes
- production cost/infrastructure/schema/secret access is required
- only the user can supply a missing decision

Otherwise, proceed and keep the user updated with evidence-backed progress.

## Anti-Cargo-Cult

Choose the smallest durable artifact that prevents drift. A narrow bug does not need a full program
ledger; a multi-agent production handoff often does. The transferable habit is verified ownership,
not maximal ceremony.
