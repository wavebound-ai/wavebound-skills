#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

type JsonRecord = Record<string, unknown>;

type SessionSummary = {
  path: string;
  sessionId: string;
  cwd: string | null;
  entrypoint: string | null;
  gitBranch: string | null;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  assistantTurns: number;
  userTurns: number;
  toolUses: number;
  toolResults: number;
  models: Record<string, number>;
  topLevel: boolean;
  bytes: number;
  firstUserText: string | null;
  firstAssistantText: string | null;
  taskHint: string | null;
};

const DEFAULT_ROOT = `${Deno.env.get("HOME") ?? "."}/.claude/projects`;
const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9_=-]{32,}\b/g, "[REDACTED_LONG_TOKEN]"],
  [/\b(sk|pk|rk|ghp|gho|ghu|github_pat|supabase|sbp|xoxb|xoxp|resend)_[A-Za-z0-9_=-]{10,}\b/gi, "[REDACTED_KEY]"],
  [/\b(password|passwd|pwd|secret|token|api[_-]?key|service[_-]?role)\s*[:=]\s*["']?[^"'\s,;]+/gi, "$1=[REDACTED]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "postgresql://[REDACTED]"],
  [/https?:\/\/[^@\s"'<>]+:[^@\s"'<>]+@[^\s"'<>]+/gi, "https://[REDACTED_CREDENTIALS]@[REDACTED_HOST]"],
];

function usage(): never {
  console.error(`Usage:
  deno run --allow-read --allow-write --allow-env scripts/fable-review-corpus.ts index [--root PATH] [--out PATH] [--model MODEL]
  deno run --allow-read --allow-write --allow-env scripts/fable-review-corpus.ts condense --session PATH --out PATH [--max-text N]
  deno run --allow-read --allow-write --allow-env scripts/fable-review-corpus.ts condense-many --manifest PATH --out-dir PATH [--limit N] [--model MODEL]

Defaults:
  --root ${DEFAULT_ROOT}
  --model claude-fable-5

--model matches a model id exactly or as a dash-separated prefix: claude-fable-5 covers
claude-fable-5 and claude-fable-5-1; claude-opus-5 covers claude-opus-5 and claude-opus-5-5.
Pass --model all to keep every session.`);
  Deno.exit(2);
}

function modelCount(models: Record<string, number>, filter: string): number {
  let total = 0;
  for (const [model, count] of Object.entries(models)) {
    if (filter === "all" || model === filter || model.startsWith(`${filter}-`)) total += count;
  }
  return total;
}

function argValue(args: string[], key: string, fallback?: string): string | undefined {
  const index = args.indexOf(key);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) usage();
  return value;
}

function hasArg(args: string[], key: string): boolean {
  return args.includes(key);
}

function redact(input: string): string {
  let out = input;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function compactWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function truncate(input: string, max = 1200): string {
  const clean = redact(input);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}...[truncated ${clean.length - max} chars]`;
}

async function* walkJsonl(root: string): AsyncGenerator<string> {
  let entries: Deno.DirEntry[];
  try {
    entries = [];
    for await (const entry of Deno.readDir(root)) entries.push(entry);
  } catch {
    return;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walkJsonl(path);
    } else if (entry.isFile && entry.name.endsWith(".jsonl")) {
      yield path;
    }
  }
}

function parseJson(line: string): JsonRecord | null {
  try {
    return JSON.parse(line) as JsonRecord;
  } catch {
    return null;
  }
}

async function readJsonl(path: string): Promise<JsonRecord[]> {
  const text = await Deno.readTextFile(path);
  const rows: JsonRecord[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = parseJson(line);
    if (row) rows.push(row);
  }
  return rows;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function messageOf(row: JsonRecord): JsonRecord | null {
  return asRecord(row.message);
}

function modelOf(row: JsonRecord): string | null {
  const message = messageOf(row);
  return stringValue(message?.model) ?? stringValue(row.model);
}

function roleOf(row: JsonRecord): string | null {
  return stringValue(messageOf(row)?.role) ?? stringValue(row.type);
}

function contentItems(row: JsonRecord): unknown[] {
  const content = messageOf(row)?.content;
  if (typeof content === "string") return [{ type: "text", text: content }];
  return asArray(content);
}

function textFromRow(row: JsonRecord, max = 1200): string | null {
  const parts: string[] = [];
  for (const item of contentItems(row)) {
    const obj = asRecord(item);
    if (!obj) continue;
    const type = stringValue(obj.type);
    if (type === "text") {
      const text = stringValue(obj.text);
      if (text) parts.push(text);
    } else if (type === "tool_use") {
      const name = stringValue(obj.name) ?? "tool";
      const input = JSON.stringify(obj.input ?? {});
      parts.push(`[tool_use ${name} ${truncate(input, 500)}]`);
    } else if (type === "tool_result") {
      const content = typeof obj.content === "string" ? obj.content : JSON.stringify(obj.content ?? "");
      parts.push(`[tool_result ${truncate(content, 500)}]`);
    }
  }
  if (parts.length === 0) return null;
  return truncate(parts.join("\n\n"), max);
}

function firstText(rows: JsonRecord[], role: "user" | "assistant"): string | null {
  for (const row of rows) {
    if (roleOf(row) !== role) continue;
    const text = textFromRow(row, 2000);
    if (text && !text.startsWith("[tool_result")) return compactWhitespace(text);
  }
  return null;
}

function summarizeSession(path: string, rows: JsonRecord[], bytes: number): SessionSummary {
  const models: Record<string, number> = {};
  let assistantTurns = 0;
  let userTurns = 0;
  let toolUses = 0;
  let toolResults = 0;
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;
  let cwd: string | null = null;
  let entrypoint: string | null = null;
  let gitBranch: string | null = null;
  let sessionId = path.split("/").pop()?.replace(/\.jsonl$/, "") ?? path;
  let topLevel = !path.includes("/subagents/");

  for (const row of rows) {
    const timestamp = stringValue(row.timestamp);
    if (timestamp && !firstTimestamp) firstTimestamp = timestamp;
    if (timestamp) lastTimestamp = timestamp;
    cwd ??= stringValue(row.cwd);
    entrypoint ??= stringValue(row.entrypoint);
    gitBranch ??= stringValue(row.gitBranch);
    sessionId = stringValue(row.sessionId) ?? sessionId;
    const model = modelOf(row);
    if (model) models[model] = (models[model] ?? 0) + 1;
    const role = roleOf(row);
    if (role === "assistant") assistantTurns++;
    if (role === "user") userTurns++;
    for (const item of contentItems(row)) {
      const obj = asRecord(item);
      if (obj?.type === "tool_use") toolUses++;
      if (obj?.type === "tool_result") toolResults++;
    }
    if (row.type === "user" && row.toolUseResult) toolResults++;
  }

  const firstUserText = firstText(rows, "user");
  const firstAssistantText = firstText(rows, "assistant");
  const taskHint = firstUserText ?? firstAssistantText;

  return {
    path,
    sessionId,
    cwd,
    entrypoint,
    gitBranch,
    firstTimestamp,
    lastTimestamp,
    assistantTurns,
    userTurns,
    toolUses,
    toolResults,
    models,
    topLevel,
    bytes,
    firstUserText,
    firstAssistantText,
    taskHint: taskHint ? truncate(taskHint, 300) : null,
  };
}

async function indexCommand(args: string[]) {
  const root = argValue(args, "--root", DEFAULT_ROOT)!;
  const out = argValue(args, "--out");
  const modelFilter = argValue(args, "--model", "claude-fable-5")!;
  const includeSubagents = hasArg(args, "--include-subagents");
  const summaries: SessionSummary[] = [];

  for await (const path of walkJsonl(root)) {
    const stat = await Deno.stat(path);
    const rows = await readJsonl(path);
    if (rows.length === 0) continue;
    const summary = summarizeSession(path, rows, stat.size);
    if (!includeSubagents && !summary.topLevel) continue;
    if (modelFilter !== "all" && modelCount(summary.models, modelFilter) === 0) continue;
    summaries.push(summary);
  }

  summaries.sort((a, b) =>
    modelCount(b.models, modelFilter) - modelCount(a.models, modelFilter) ||
    b.bytes - a.bytes ||
    (a.firstTimestamp ?? "").localeCompare(b.firstTimestamp ?? "")
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    root,
    modelFilter,
    includeSubagents,
    count: summaries.length,
    summaries,
  };

  const json = JSON.stringify(payload, null, 2);
  if (out) {
    await Deno.mkdir(out.split("/").slice(0, -1).join("/") || ".", { recursive: true });
    await Deno.writeTextFile(out, `${json}\n`);
  } else {
    console.log(json);
  }
}

function toolNames(row: JsonRecord): string[] {
  const names: string[] = [];
  for (const item of contentItems(row)) {
    const obj = asRecord(item);
    if (obj?.type === "tool_use") names.push(stringValue(obj.name) ?? "tool");
  }
  return names;
}

async function condenseCommand(args: string[]) {
  const session = argValue(args, "--session");
  const out = argValue(args, "--out");
  const maxText = Number(argValue(args, "--max-text", "1400"));
  if (!session || !out) usage();

  const stat = await Deno.stat(session);
  const rows = await readJsonl(session);
  const summary = summarizeSession(session, rows, stat.size);
  const lines: string[] = [];
  lines.push(`# Condensed Fable Session`);
  lines.push("");
  lines.push(`- Source: ${session}`);
  lines.push(`- Session: ${summary.sessionId}`);
  lines.push(`- CWD: ${summary.cwd ?? "unknown"}`);
  lines.push(`- Dates: ${summary.firstTimestamp ?? "unknown"} -> ${summary.lastTimestamp ?? "unknown"}`);
  lines.push(`- Models: ${Object.entries(summary.models).map(([k, v]) => `${k}=${v}`).join(", ") || "unknown"}`);
  lines.push(`- Turns: assistant=${summary.assistantTurns}, user=${summary.userTurns}, tool_uses=${summary.toolUses}, tool_results=${summary.toolResults}`);
  lines.push(`- Task hint: ${summary.taskHint ?? "unknown"}`);
  lines.push("");
  lines.push("## Timeline");

  let ordinal = 0;
  for (const row of rows) {
    const role = roleOf(row);
    if (role !== "assistant" && role !== "user") continue;
    const timestamp = stringValue(row.timestamp) ?? "";
    const model = modelOf(row);
    const names = toolNames(row);
    const text = textFromRow(row, maxText);
    if (!text && names.length === 0) continue;
    ordinal++;
    lines.push("");
    lines.push(`### ${ordinal}. ${role}${model ? ` (${model})` : ""}${timestamp ? ` — ${timestamp}` : ""}`);
    if (names.length) lines.push(`Tools: ${names.join(", ")}`);
    if (text) {
      lines.push("");
      lines.push(text);
    }
  }

  await Deno.mkdir(out.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  await Deno.writeTextFile(out, `${lines.join("\n")}\n`);
}

async function condenseManyCommand(args: string[]) {
  const manifest = argValue(args, "--manifest");
  const outDir = argValue(args, "--out-dir");
  const model = argValue(args, "--model", "claude-fable-5")!;
  const limit = Number(argValue(args, "--limit", "999999"));
  if (!manifest || !outDir) usage();

  const data = JSON.parse(await Deno.readTextFile(manifest)) as { summaries?: SessionSummary[] };
  const sessions = (data.summaries ?? [])
    .filter((s) => model === "all" || modelCount(s.models, model) > 0)
    .slice(0, limit);

  await Deno.mkdir(outDir, { recursive: true });
  const generated: Array<{ source: string; condensed: string; assistantTurns: number; taskHint: string | null }> = [];
  for (const session of sessions) {
    const safeName = `${session.sessionId}-${String(session.taskHint ?? "session").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "session"}.md`;
    const out = `${outDir}/${safeName}`;
    await condenseCommand(["condense", "--session", session.path, "--out", out, "--max-text", "1200"]);
    generated.push({ source: session.path, condensed: out, assistantTurns: session.assistantTurns, taskHint: session.taskHint });
  }

  await Deno.writeTextFile(`${outDir}/manifest.json`, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: generated.length, generated }, null, 2)}\n`);
  console.log(`Condensed ${generated.length} sessions into ${outDir}`);
}

const [command, ...args] = Deno.args;
if (command === "index") {
  await indexCommand(args);
} else if (command === "condense") {
  await condenseCommand(args);
} else if (command === "condense-many") {
  await condenseManyCommand(args);
} else {
  usage();
}
