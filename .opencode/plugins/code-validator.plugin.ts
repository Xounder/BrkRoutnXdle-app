import type { Plugin } from "@opencode-ai/plugin"
import { extname, basename, join } from "path"
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { execSync } from "child_process"

type ValidationResult = {
  file: string
  errors: string[]
  warnings: string[]
}

type ValidatorFn = (filePath: string, ext: string) => Promise<string[]>
type ContentValidatorFn = (content: string, ext: string) => Promise<string[]>

const toolCache = new Map<string, boolean>()

function toolAvailable(tool: string): boolean {
  if (toolCache.has(tool)) return toolCache.get(tool)!
  try {
    execSync(`${tool} --version`, { stdio: "ignore", timeout: 5000 })
    toolCache.set(tool, true)
    return true
  } catch {
    toolCache.set(tool, false)
    return false
  }
}

export const CodeValidatorPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  client.app.log("[code-validator] Plugin initialized")

  const CODE_EXTENSIONS: Record<string, string | null> = {
    ".ts": "TypeScript",
    ".tsx": "TSX",
    ".js": "JavaScript",
    ".jsx": "JSX",
    ".mjs": "ES Module",
    ".cjs": "CommonJS",
    ".py": "Python",
    ".rs": "Rust",
    ".go": "Go",
    ".java": "Java",
    ".rb": "Ruby",
    ".php": "PHP",
    ".json": "JSON",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
    ".vue": "Vue",
    ".svelte": "Svelte",
  }

  function isCodeFile(filePath: string): boolean {
    return filePath in CODE_EXTENSIONS || Object.keys(CODE_EXTENSIONS).some(ext => filePath.endsWith(ext))
  }

  // --- TypeScript / TSX ---
  async function validateTs(filePath: string, ext: string): Promise<string[]> {
    if (!toolAvailable("npx")) return ["npx not found — cannot validate TypeScript"]

    const errors: string[] = []
    try {
      const output = await $`npx tsc --noEmit --pretty false 2>&1`.quiet().text()
      if (output) {
        errors.push(...output.split("\n").filter(l => l.includes("error TS")).map(l => l.trim()))
      }
    } catch (err: any) {
      const msg = err.message || err.stdout || err.stderr || ""
      if (msg) {
        errors.push(...msg.split("\n").filter(l => l.includes("error TS")).map(l => l.trim()))
      }
    }
    return errors
  }

  // --- JavaScript / JSX / MJS / CJS ---
  async function validateJs(filePath: string, ext: string): Promise<string[]> {
    if (!toolAvailable("node")) return ["node not found — cannot validate JavaScript"]

    try {
      await $`node --check "${filePath}" 2>&1`.quiet().text()
    } catch (err: any) {
      const msg = (err.message || err.stderr || err.stdout || "").replace(filePath, basename(filePath))
      if (msg) return [msg.trim()]
    }
    return []
  }

  // --- Python ---
  async function validatePy(filePath: string, ext: string): Promise<string[]> {
    const pyCmd = toolAvailable("python3") ? "python3" : toolAvailable("python") ? "python" : null
    if (!pyCmd) return ["python not found — cannot validate Python"]

    try {
      await $`${pyCmd} -m py_compile "${filePath}" 2>&1`.quiet().text()
    } catch (err: any) {
      const msg = (err.message || err.stderr || "").replace(filePath, basename(filePath))
      if (msg) return [msg.trim()]
    }
    return []
  }

  // --- Java ---
  async function validateJava(filePath: string, ext: string): Promise<string[]> {
    if (!toolAvailable("javac")) return ["javac not found — cannot validate Java"]

    try {
      await $`javac -Xlint:all -d "${directory}" "${filePath}" 2>&1`.quiet().text()
    } catch (err: any) {
      const msg = (err.message || err.stderr || err.stdout || "").replace(filePath, basename(filePath))
      if (msg) return [msg.trim()]
    } finally {
      const classFile = filePath.replace(/\.java$/, ".class")
      if (existsSync(classFile)) {
        try { await $`rm "${classFile}"`.quiet() } catch {}
      }
    }
    return []
  }

  // --- JSON ---
  async function validateJson(filePath: string, ext: string): Promise<string[]> {
    try {
      const content = readFileSync(filePath, "utf-8")
      JSON.parse(content)
    } catch (err: any) {
      return [`JSON parse error: ${err.message}`]
    }
    return []
  }

  // --- Unsupported language ---
  async function validateUnsupported(filePath: string, ext: string): Promise<string[]> {
    return []
  }

  // --- Content validators (for tool.execute.before — file doesn't exist yet) ---
  async function validateJsContent(content: string, ext: string): Promise<string[]> {
    if (!toolAvailable("node")) return ["node not found — cannot validate JavaScript"]
    const tmpDir = mkdtempSync(join(tmpdir(), "code-validator-"))
    const tmpFile = join(tmpDir, `content${ext}`)
    try {
      writeFileSync(tmpFile, content, "utf-8")
      await $`node --check "${tmpFile}" 2>&1`.quiet().text()
      return []
    } catch (err: any) {
      const msg = (err.message || err.stderr || err.stdout || "").replace(tmpFile, `[content]`)
      return msg ? [msg.trim()] : []
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  async function validatePyContent(content: string, ext: string): Promise<string[]> {
    const pyCmd = toolAvailable("python3") ? "python3" : toolAvailable("python") ? "python" : null
    if (!pyCmd) return ["python not found — cannot validate Python"]
    const tmpDir = mkdtempSync(join(tmpdir(), "code-validator-"))
    const tmpFile = join(tmpDir, `content${ext}`)
    try {
      writeFileSync(tmpFile, content, "utf-8")
      await $`${pyCmd} -m py_compile "${tmpFile}" 2>&1`.quiet().text()
      return []
    } catch (err: any) {
      const msg = (err.message || err.stderr || "").replace(tmpFile, `[content]`)
      return msg ? [msg.trim()] : []
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  function validateJsonContent(content: string, ext: string): Promise<string[]> {
    try {
      JSON.parse(content)
      return Promise.resolve([])
    } catch (err: any) {
      return Promise.resolve([`JSON parse error: ${err.message}`])
    }
  }

  const contentValidatorMap: Record<string, ContentValidatorFn> = {
    ".js": validateJsContent,
    ".jsx": validateJsContent,
    ".mjs": validateJsContent,
    ".cjs": validateJsContent,
    ".py": validatePyContent,
    ".json": validateJsonContent,
  }

  // --- Disk validators ---
  const extValidatorMap: Record<string, ValidatorFn> = {
    ".ts": validateTs,
    ".tsx": validateTs,
    ".js": validateJs,
    ".jsx": validateJs,
    ".mjs": validateJs,
    ".cjs": validateJs,
    ".py": validatePy,
    ".java": validateJava,
    ".json": validateJson,
  }

  async function validateFile(filePath: string): Promise<ValidationResult | null> {
    if (!isCodeFile(filePath) || !existsSync(filePath)) return null

    const ext = extname(filePath).toLowerCase()
    const result: ValidationResult = { file: filePath, errors: [], warnings: [] }

    const validator = extValidatorMap[ext] || validateUnsupported
    const errors = await validator(filePath, ext)
    result.errors.push(...errors)

    return result
  }

  async function validateContent(content: string, filePath: string): Promise<ValidationResult> {
    const ext = extname(filePath).toLowerCase()
    const result: ValidationResult = { file: filePath, errors: [], warnings: [] }

    const validator = contentValidatorMap[ext]
    if (validator) {
      const errors = await validator(content, ext)
      result.errors.push(...errors)
    }

    return result
  }

  function report(result: ValidationResult): void {
    if (result.errors.length === 0 && result.warnings.length === 0) return

    const fileName = basename(result.file)
    console.log(`[code-validator] ${fileName}: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`)

    client.app.log(`[code-validator] ${fileName} validated`)
    for (const err of result.errors) {
      client.app.log(`  ERROR: ${err}`)
    }
    for (const warn of result.warnings) {
      client.app.log(`  WARN: ${warn}`)
    }
  }

  return {
    "tool.execute.before": async (input) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "edit") return

      const filePath: string | undefined = input.args?.filePath || input.args?.path
      if (!filePath || !isCodeFile(filePath)) return

      let content: string | undefined

      if (toolName === "write") {
        content = input.args?.content
      } else if (toolName === "edit") {
        const existing = readFileSync(filePath, "utf-8")
        const oldStr = input.args?.oldString
        const newStr = input.args?.newString
        if (typeof oldStr === "string" && typeof newStr === "string") {
          content = existing.replace(oldStr, newStr)
        }
      }

      if (!content) return

      const result = await validateContent(content, filePath)
      if (result.errors.length > 0) {
        report(result)
        return { blocked: true, reason: `[code-validator] ${result.errors[0]}` }
      }
    },
    "tool.execute.after": async (input) => {
      const toolName = input.tool?.toLowerCase()
      if (toolName !== "write" && toolName !== "edit") return

      const filePath: string | undefined = input.args?.filePath || input.args?.path
      if (!filePath || !isCodeFile(filePath)) return

      const result = await validateFile(filePath)
      if (result) report(result)
    },
  }
}
