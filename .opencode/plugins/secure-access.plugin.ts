import type { Plugin } from "@opencode-ai/plugin"
import { resolve, sep } from "path"
import { realpathSync, existsSync } from "fs"

// --- Types (Fase 30 + 31) ---

type ArgType = "path" | "flag" | "content" | "pattern"

interface ClassifiedArg {
  value: string
  type: ArgType
}

interface ParsedCommand {
  type: string
  args: string[]
}

interface CommandRule {
  pattern: RegExp
  type: string
  validate?: (tokens: string[], classified: ClassifiedArg[]) => boolean
}

// --- Utilities ---

const hasChaining = (cmd: string): boolean => {
  const noQuotes = cmd.replace(/(['"])(?:(?!\1|\\).|\\.)*\1/g, "")
  return /&&|\|\||;|\||`|\$\(|\$\{|\n|\r|%0A|%0D/.test(noQuotes)
}

const safeRealPath = (target: string): string | null => {
  try {
    return realpathSync(target)
  } catch {
    return null
  }
}

// --- Tokenization ---

const tokenize = (cmd: string): string[] => {
  const tokens: string[] = []
  let i = 0
  while (i < cmd.length) {
    if (cmd[i] === " " || cmd[i] === "\t") { i++; continue }

    let token = ""
    while (i < cmd.length) {
      const c = cmd[i]
      if (c === "'" || c === '"') {
        const quote = c
        i++
        while (i < cmd.length) {
          if (cmd[i] === quote) { i++; break }
          if (cmd[i] === "\\" && i + 1 < cmd.length && quote === '"') {
            token += cmd[i + 1]
            i += 2
          } else {
            token += cmd[i]
            i++
          }
        }
      } else if (c === " " || c === "\t") {
        i++
        break
      } else {
        token += c
        i++
      }
    }
    tokens.push(token)
  }
  return tokens
}

const stripQuotes = (s: string): string => {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1)
  }
  return s
}

const nonFlagArgs = (tokens: string[]): string[] =>
  tokens.filter(t => !t.startsWith("-") && !t.startsWith("/"))

// --- Path classification (Fase 31) ---

const classifyArg = (token: string): ClassifiedArg => {
  if (token.startsWith("-") || token.startsWith("/")) {
    return { value: token, type: "flag" }
  }
  if (/[*?[\]{}]/.test(token)) {
    return { value: token, type: "pattern" }
  }
  return { value: token, type: "path" }
}

// --- Git semantic validation (Fase 29) ---

const gitHandlers: Record<string, (classified: ClassifiedArg[]) => boolean> = {
  status: () => true,
  diff: () => true,
  log: () => true,
  add: (c) => c.some(a => a.type === "path"),
  commit: (c) => {
    const mIdx = c.findIndex(a => a.value === "-m" || a.value === "--message")
    if (mIdx === -1) return false
    return mIdx < c.length - 1
  },
  checkout: (c) => c.some(a => a.type !== "flag"),
  restore: (c) => c.some(a => a.type === "path"),
  push: (c) => !c.some(a => a.value.includes("--exec")),
  pull: (c) => !c.some(a => a.value.includes("--upload-pack")),
  branch: () => true,
  fetch: () => true,
  merge: (c) => !c.some(a => a.value.includes("--receive-pack")),
  rebase: () => true,
  stash: () => true,
  reset: () => true,
  show: () => true,
  tag: () => true,
  init: () => true,
  remote: () => true,
}

// --- Command rules (Fase 30) ---

const commandRules: CommandRule[] = [
  { pattern: /^pnpm --filter (frontend|backend|@jobfindr\/types|@jobfindr\/utils)\s+(dev|build|start|lint|typecheck|test|preview|clean)$/i, type: "pnpm-filter" },
  { pattern: /^pnpm --filter backend exec tsx \.\.\/frontend\/playwright-check\.ts$/i, type: "pnpm-pw-check" },
  { pattern: /^pnpm install$/i, type: "pnpm-install" },
  { pattern: /^pnpm test$/i, type: "pnpm-test" },
  { pattern: /^docker compose (up|down|build)$/i, type: "docker-compose" },
  { pattern: /^npx playwright .+$/i, type: "npx-playwright" },
  { pattern: /^(?:\.\\node_modules\\.bin\\)?vitest(?:\.(?:CMD|ps1))? run(?:\s+.*)?$/i, type: "vitest-run" },
  { pattern: /^powershell -c "\[System\.Console\]::Beep\(\d+, \d+\)"$/i, type: "powershell-beep" },
  {
    pattern: /^git\s+(\S+)(?:\s+.*)?$/i,
    type: "git",
    validate: (tokens, classified) => {
      const subcmd = tokens[1]?.toLowerCase()
      if (!subcmd || !gitHandlers[subcmd]) return false
      const rest = tokens.slice(2).join(" ")
      if (/&&|\|\||[;|]|`|\$\(|\$\{/.test(rest)) return false
      return gitHandlers[subcmd](classified.slice(2))
    },
  },
  {
    pattern: /^(node|tsx)\s+(\S+)/i,
    type: "exec",
    validate: (tokens) => {
      if (tokens.length < 2) return false
      if (tokens[1].startsWith("-")) return false
      for (const arg of tokens.slice(2)) {
        if (["-e", "--eval", "--require", "--inspect", "--inspect-brk"].includes(arg)) return false
      }
      return true
    },
  },
  { pattern: /^cd\s+(\S+)$/i, type: "cd" },
  { pattern: /^rm\s+(-[rf]+\s+)?(\S+)$/i, type: "rm" },
  { pattern: /^del\s+(\/[a-z]+\s+)?(\S+)$/i, type: "del" },
  { pattern: /^mkdir\s+(-p\s+)?(\S+)$/i, type: "mkdir" },
  { pattern: /^Remove-Item\s+(.+)$/i, type: "remove-item" },
  { pattern: /^Copy-Item\s+(.+)$/i, type: "copy-item" },
  { pattern: /^Move-Item\s+(.+)$/i, type: "move-item" },
  { pattern: /^Set-Content\s+(.+)$/i, type: "set-content" },
  { pattern: /^New-Item\s+(.+)$/i, type: "new-item" },
  { pattern: /^cat\s+\S+$/i, type: "cat" },
  { pattern: /^ls(?:\s+\S*)?$/i, type: "ls" },
  { pattern: /^which\s+\S+$/i, type: "which" },
  { pattern: /^where\s+\S+$/i, type: "where" },
  { pattern: /^echo\s+.+$/i, type: "echo" },
  { pattern: /^type\s+\S+$/i, type: "type" },
  { pattern: /^Get-ChildItem\s+.+$/i, type: "get-childitem" },
  { pattern: /^Get-Content\s+.+$/i, type: "get-content" },
  { pattern: /^Get-Command\s+.+$/i, type: "get-command" },
  { pattern: /^Test-Path\s+.+$/i, type: "test-path" },
  { pattern: /^rm\s+-rf\s+node_modules$/i, type: "rm-node-modules" },
  { pattern: /^Stop-Process\s+-Name\s+(node|tsx)(\s+-Force)?$/i, type: "stop-process" },
  { pattern: /^taskkill\s+\/F\s+\/IM\s+(node|tsx)(\.exe)?$/i, type: "stop-process" },
  {
    pattern: /^curl\s+/i,
    type: "curl",
    validate: (tokens) => {
      const args = tokens.slice(1)
      const dangerousFlags = ["-o", "--output", "-O", "--remote-name", "--config", "-K", "--help", "--manual"]
      for (const arg of args) {
        if (dangerousFlags.includes(arg)) return false
      }
      const url = args.find(a => a.startsWith("http"))
      if (!url) return false
      return /localhost/i.test(url)
    },
  },
]

// --- Parser (Fase 30) ---

const parseCommand = (cmd: string): ParsedCommand | null => {
  for (const rule of commandRules) {
    const match = cmd.match(rule.pattern)
    if (match) {
      if (rule.validate) {
        const tokens = tokenize(cmd)
        const classified = tokens.map(classifyArg)
        if (!rule.validate(tokens, classified)) {
          throw new Error(`[secure-access] Blocked command validation:\n${cmd}`)
        }
      }
      const args = match.slice(1).filter((a): a is string => a !== undefined)
      return { type: rule.type, args }
    }
  }
  return null
}

// --- Path validation (Fase 46: prefix-based strict boundary) ---

export const createPathValidator = (projectDir: string) => {
  const projectRoot = resolve(projectDir)
  const projectReal = safeRealPath(projectRoot)
  const projectBoundary = projectReal === null ? null : projectReal + sep

  return (target: string): boolean => {
    if (projectBoundary === null) return false

    // Fase 32: Block UNC paths
    if (/^\\\\/.test(target)) return false

    // Fase 54: Block empty, dot-only, and root paths
    if (target === "" || target === "." || target === "..") return false

    const resolved = resolve(projectRoot, target)
    const real = safeRealPath(resolved)
    if (real === null) {
      return resolved.startsWith(projectBoundary) || resolved === projectReal
    }
    return real.startsWith(projectBoundary) || real === projectReal
  }
}

type PathValidator = ReturnType<typeof createPathValidator>

// --- Plugin ---

export const SecureAccessPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  const isPathInsideProject = createPathValidator(directory)

  const fileToolArgs: Record<string, string[]> = {
    read: ["filePath", "path"],
    write: ["filePath", "path"],
    edit: ["filePath", "path"],
    glob: ["cwd", "path"],
    grep: ["cwd", "path"],
  }

  return {
    "tool.execute.before": async (input, output) => {
      const args = (output.args ?? {}) as Record<string, unknown>

      const toolKeys = fileToolArgs[input.tool]
      if (toolKeys) {
        for (const key of toolKeys) {
          const val = args[key]
          if (typeof val === "string") {
            if ((input.tool === "glob" || input.tool === "grep") && (val.includes("..") || val.startsWith("/"))) {
              throw new Error(`[secure-access] Blocked invalid ${input.tool} path:\n${val}`)
            }
            if (!isPathInsideProject(val)) {
              throw new Error(
                `[secure-access] Blocked ${input.tool} outside project:\n${val}`
              )
            }
          }
        }
      }

      if (input.tool !== "bash") return

      const command = (args.command as string ?? "").trim()
      if (!command) return

      // Fase 28: Block chaining (with quote-aware detection)
      if (hasChaining(command)) {
        throw new Error(`[secure-access] Blocked chained command:\n${command}`)
      }

      // Normalize command before parsing
      let normalized: string
      try {
        normalized = decodeURIComponent(command)
      } catch {
        normalized = command
      }
      normalized = normalized
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")

      // Parse command
      const parsed = parseCommand(normalized)
      if (!parsed) {
        throw new Error(`[secure-access] Blocked undocumented command:\n${command}`)
      }

      // --- Validators per type ---

      // stop-process is always allowed (only matches node/tsx)
      if (parsed.type === "stop-process") {
        return
      }

      // Fase 27: node/tsx – validate script path, extension, and existence
      if (parsed.type === "exec") {
        const resolveScript = (base: string) => {
          const fullPath = resolve(directory, base, parsed.args[1])
          if (existsSync(fullPath)) return safeRealPath(fullPath)
          return null
        }
        const real = resolveScript(directory) ?? resolveScript(args.workdir as string)
        if (!real) {
          // File not found via directory or workdir; validate the path is within project boundary
          const scriptPath = resolve(directory, parsed.args[1])
          if (!isPathInsideProject(scriptPath)) {
            throw new Error(
              `[secure-access] Blocked ${parsed.args[0]} outside project:\n${parsed.args[1]}`
            )
          }
          if (/\.(exe|com|bat|ps1|sh|dll)$/i.test(parsed.args[1])) {
            throw new Error(
              `[secure-access] Blocked ${parsed.args[0]} with dangerous extension:\n${parsed.args[1]}`
            )
          }
        } else {
          if (!isPathInsideProject(real)) {
            throw new Error(
              `[secure-access] Blocked ${parsed.args[0]} outside project:\n${parsed.args[1]}`
            )
          }
          if (!/\.(ts|js|tsx|mjs|cjs)$/i.test(real)) {
            throw new Error(
              `[secure-access] Blocked ${parsed.args[0]} with invalid extension:\n${real}`
            )
          }
        }
      }

      if (parsed.type === "cd") {
        const target = parsed.args[0]
        if (!isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked cd outside project:\n${target}`)
        }
      }

      if (parsed.type === "rm") {
        const target = parsed.args[1] ?? parsed.args[0]
        if (target && target !== "node_modules" && !isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked rm outside project:\n${command}`)
        }
      }

      if (parsed.type === "del") {
        const target = parsed.args[1] ?? parsed.args[0]
        if (target && !isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked del outside project:\n${command}`)
        }
      }

      if (parsed.type === "remove-item") {
        const tokens = tokenize(parsed.args[0])
        const paths = tokens
          .map(classifyArg)
          .filter(a => a.type === "path")
          .map(a => stripQuotes(a.value))
        for (const p of paths) {
          if (!isPathInsideProject(p)) {
            throw new Error(`[secure-access] Blocked Remove-Item outside project:\n${command}`)
          }
        }
      }

      if (parsed.type === "mkdir") {
        const target = parsed.args[1] ?? parsed.args[0]
        if (target && !isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked mkdir outside project:\n${target}`)
        }
      }

      // Fase 26: Copy-Item / Move-Item – positional parsing
      if (parsed.type === "copy-item" || parsed.type === "move-item") {
        const tokens = tokenize(parsed.args[0])
        const paths = tokens
          .map(classifyArg)
          .filter(a => a.type === "path")
          .map(a => stripQuotes(a.value))
        if (paths.length > 0 && !isPathInsideProject(paths[0])) {
          throw new Error(
            `[secure-access] Blocked ${parsed.type} targeting outside project:\n${command}`
          )
        }
        if (paths.length > 1 && !isPathInsideProject(paths[1])) {
          throw new Error(
            `[secure-access] Blocked ${parsed.type} targeting outside project:\n${command}`
          )
        }
      }

      // Fase 25 + 42: Set-Content – only first path-classified arg is target
      if (parsed.type === "set-content") {
        const tokens = tokenize(parsed.args[0])
        const target = tokens
          .map(classifyArg)
          .filter(a => a.type === "path")
          .map(a => stripQuotes(a.value))[0]
        if (target && !isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked Set-Content outside project:\n${command}`)
        }
      }

      // Fase 25 + 42: New-Item – only first path-classified arg is target
      if (parsed.type === "new-item") {
        const tokens = tokenize(parsed.args[0])
        const target = tokens
          .map(classifyArg)
          .filter(a => a.type === "path")
          .map(a => stripQuotes(a.value))[0]
        if (target && !isPathInsideProject(target)) {
          throw new Error(`[secure-access] Blocked New-Item outside project:\n${command}`)
        }
      }
    }
  }
}
