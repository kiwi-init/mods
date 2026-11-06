export interface Check {
  name: string
  state: "pass" | "fail" | "running" | "waiting" | "skipped"
  word: string
  required?: boolean
  url?: string
}

export interface PullRequest {
  repo: string
  number: number
  title: string
  url: string
  state: "open" | "draft" | "merged" | "closed"
  checks: "pass" | "fail" | "running" | "none"
  ticks?: { passed: number; running: number; failed: readonly string[] }
  list?: readonly Check[]
  additions?: number
  deletions?: number
  files?: number
  branch?: string
  by?: string
  at?: number
  task?: number
  release?: string
}

export interface Issue {
  repo: string
  number: number
  title: string
  url: string
  state: "open" | "closed"
  reason?: string
  by?: string
  at: number
  task?: number
}

export type TaskStatus = "todo" | "doing" | "review" | "landing" | "done" | "waiting"

export interface Task {
  id: number
  title: string
  status: TaskStatus
  owner: { nickname: string; person: Record<string, unknown> | null } | null
}

export type Chore = "status" | "drain" | "rules" | "releases" | "sync"

export interface Health {
  status: { app: boolean; repos: { repo: string; last: number | null; installed: boolean | null; events: string[]; install: string | null; error?: string }[] } | null
  errors: { what: Chore; repo?: string; message: string; at: number }[]
  syncing: string | null
}

export interface Snapshot {
  repos: string[]
  prs: PullRequest[]
  issues: Issue[]
  tasks: Task[]
  health: Health | null
}

export type Target = { kind: "pr" | "issue"; repo: string; number: number } | { kind: "view"; view: string }

export type Kind = "prs" | "issues"
