import { tool } from "@opencode-ai/plugin"
import { execSync } from "child_process"

export default tool({
  description: "Get git diff between two refs with optional path filter",
  args: {
    baseRef: tool.schema.string().optional().default("main").describe("Base branch or ref"),
    headRef: tool.schema.string().optional().default("HEAD").describe("Head branch or ref"),
    path: tool.schema.string().optional().describe("Filter by file path"),
  },
  async execute({ baseRef, headRef, path }, ctx) {
    const filter = path ? ` -- "${path}"` : ""
    return execSync(`git diff ${baseRef}..${headRef}${filter}`, { cwd: ctx.worktree, encoding: "utf-8" })
  },
})
