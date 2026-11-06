import { ago } from "@kiwi/mod"

import type { Chore, Health, Kind } from "./types"

const CHORES: Record<Chore, string> = {
  status: "Checking the GitHub App",
  drain: "Reading GitHub's news",
  rules: "Reading the merge rules",
  releases: "Reading the releases",
  sync: "Fetching pull requests and issues",
}

export const choreTitle = (what: Chore, repo?: string): string => `${CHORES[what]}${repo ? ` for ${repo}` : ""} failed`

export function since(at: number): string {
  const when = ago(at)
  return when === "now" ? "just now" : /^\d+[mhd]$/.test(when) ? `${when} ago` : `on ${when}`
}

export type Trouble =
  | { kind: "no-app" }
  | { kind: "not-installed"; owner: string; install: string | null }
  | { kind: "events"; owner: string; missing: string[] }
  | { kind: "syncing"; repo: string }
  | { kind: "failed"; what: Chore; repo?: string; message: string }
  | { kind: "quiet"; last: number | null }

const WANTS: Record<Kind, readonly string[]> = { prs: ["pull_request", "check_run"], issues: ["issues"] }

const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

export function trouble(health: Health, repos: readonly string[], shows: Kind): Trouble | null {
  const status = health.status
  if (status && !status.app) return { kind: "no-app" }
  const mine = (status?.repos ?? []).filter((r) => repos.some((x) => same(x, r.repo)))
  const missing = mine.find((r) => r.installed === false)
  if (missing) return { kind: "not-installed", owner: missing.repo.split("/")[0] ?? missing.repo, install: missing.install }
  const deaf = mine.find((r) => r.installed && WANTS[shows].some((e) => !r.events.includes(e)))
  if (deaf) return { kind: "events", owner: deaf.repo.split("/")[0] ?? deaf.repo, missing: WANTS[shows].filter((e) => !deaf.events.includes(e)) }
  if (health.syncing && repos.some((r) => same(r, health.syncing ?? ""))) return { kind: "syncing", repo: health.syncing }
  const failed = health.errors.find((e) => !e.repo || repos.some((r) => same(r, e.repo ?? "")))
  if (failed) return { kind: "failed", what: failed.what, ...(failed.repo ? { repo: failed.repo } : {}), message: failed.message }
  const looked = mine.find((r) => r.error)
  if (looked?.error) return { kind: "failed", what: "status", repo: looked.repo, message: looked.error }
  if (!status) return null
  const seen = mine.flatMap((r) => (r.last === null ? [] : [r.last]))
  return { kind: "quiet", last: seen.length ? Math.max(...seen) : null }
}
