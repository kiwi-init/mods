import { useState } from "react"

import { Avatar, copy, cx, Dot, Icon, open } from "@kiwi/mod"

import type { Check, Issue, PullRequest, Task } from "./types"

const PR_GLYPHS: Record<PullRequest["state"], string> = { open: "pr-open", draft: "pr-draft", merged: "pr-merged", closed: "pr-closed" }
export const PR_TONES: Record<PullRequest["state"], string> = { open: "tone-live", draft: "tone-quiet", merged: "tone-review", closed: "tone-quiet" }
export const PR_WORDS: Record<PullRequest["state"], string> = { open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }

export function PrMark({ pr, size = 16 }: { pr: PullRequest; size?: number }) {
  return (
    <span className={cx("gh-mark", PR_TONES[pr.state])}>
      <Icon name={PR_GLYPHS[pr.state]} size={size} label={PR_WORDS[pr.state]} />
    </span>
  )
}

const issueDone = (i: Issue): boolean => i.state === "closed" && i.reason !== "not_planned"

export const issueWord = (i: Issue): string => (i.state === "open" ? "open" : i.reason === "not_planned" ? "not planned" : "closed")

export const issueTone = (i: Issue): string => (i.state === "open" ? "tone-live" : issueDone(i) ? "tone-review" : "tone-quiet")

export function IssueMark({ issue, size = 16 }: { issue: Issue; size?: number }) {
  return (
    <span className={cx("gh-mark", issueTone(issue))}>
      <Icon name={issue.state === "open" ? "issue-open" : issueDone(issue) ? "issue-done" : "issue-dropped"} size={size} label={issueWord(issue)} />
    </span>
  )
}

const CHECK_TONES: Record<Check["state"], string> = { pass: "tone-live", fail: "tone-alert", running: "tone-doing", waiting: "tone-quiet", skipped: "tone-quiet" }

export function checksLine(pr: PullRequest): { text: string; tone: string } | null {
  if (pr.state === "merged") return { text: "merged", tone: "" }
  if (pr.state === "closed") return { text: "closed", tone: "" }
  const t = pr.ticks
  if (t) {
    const total = t.passed + t.running + t.failed.length
    if (t.failed.length) return { text: t.failed.length === 1 ? `${t.failed[0]} failed` : `${t.failed.length} checks failed`, tone: "tone-alert" }
    if (t.running) return { text: `${t.passed} of ${total} checks`, tone: "tone-doing" }
    if (total) return { text: total === 1 ? "1 check passed" : `${total} checks passed`, tone: "" }
  }
  if (pr.checks === "fail") return { text: "checks failed", tone: "tone-alert" }
  if (pr.checks === "running") return { text: "checks running", tone: "tone-doing" }
  if (pr.checks === "pass") return { text: "checks passed", tone: "" }
  return null
}

const MAX_TICKS = 12

export function Ticks({ list }: { list: readonly Check[] }) {
  return (
    <span className="gh-ticks" aria-hidden="true">
      {list.slice(0, MAX_TICKS).map((c) => (
        <span key={c.name} className={cx("gh-tick", `is-${c.state}`)} />
      ))}
    </span>
  )
}

function CheckRow({ c }: { c: Check }) {
  return (
    <li className={cx("gh-check", `is-${c.state}`)}>
      <span className={cx("gh-check-mark", CHECK_TONES[c.state])}>
        <Icon name={`check-${c.state}`} size={14} />
      </span>
      {c.url ? (
        <a className="gh-check-name" href={c.url} title={`${c.name} on GitHub`}>
          {c.name}
        </a>
      ) : (
        <span className="gh-check-name">{c.name}</span>
      )}
      {c.required && <span className="gh-check-req">required</span>}
      <span className={cx("gh-check-word", c.state === "fail" && "tone-alert", c.state === "running" && "tone-doing")}>{c.word}</span>
    </li>
  )
}

export function Checks({ list, fold = true }: { list: readonly Check[]; fold?: boolean }) {
  const [shown, setShown] = useState(!fold)
  const quiet = list.filter((c) => c.state === "pass" || c.state === "skipped")
  const loud = list.filter((c) => c.state !== "pass" && c.state !== "skipped")
  const passed = quiet.filter((c) => c.state === "pass").length
  const skipped = quiet.length - passed
  const summary = [passed ? (loud.length ? `${passed} passed` : `All ${passed} checks passed`) : "", skipped ? `${skipped} skipped` : ""].filter(Boolean).join(" · ")
  return (
    <ul className="gh-checks" aria-label="Checks">
      {loud.map((c) => (
        <CheckRow key={c.name} c={c} />
      ))}
      {fold && quiet.length > 0 && (
        <li>
          <button type="button" className="gh-check is-fold" aria-expanded={shown} onClick={() => setShown(!shown)}>
            <span className={cx("gh-check-mark", passed ? "tone-live" : "tone-quiet")}>
              <Icon name={passed ? "check-pass" : "check-skipped"} size={14} />
            </span>
            <span className="gh-check-name">{summary}</span>
            <span className="gh-check-word">{shown ? "Hide" : "Show"}</span>
          </button>
        </li>
      )}
      {shown && quiet.map((c) => <CheckRow key={c.name} c={c} />)}
    </ul>
  )
}

const DIFF_W = 48

export function DiffBar({ additions, deletions }: { additions: number; deletions: number }) {
  if (!additions && !deletions) return null
  const plus = Math.round((DIFF_W * additions) / (additions + deletions))
  return (
    <span className="gh-diff" role="img" aria-label={`${additions} added, ${deletions} removed`}>
      <span className="is-add" style={{ width: plus }} />
      <span className="is-del" style={{ width: DIFF_W - plus }} />
    </span>
  )
}

export function Size({ pr }: { pr: PullRequest }) {
  if (pr.additions === undefined || pr.deletions === undefined) return null
  return (
    <span className="gh-size num">
      <DiffBar additions={pr.additions} deletions={pr.deletions} />
      <span className="tone-live">+{pr.additions}</span>
      <span className="tone-alert">−{pr.deletions}</span>
      {pr.files !== undefined && <span className="dim">{pr.files === 1 ? "1 file" : `${pr.files} files`}</span>}
    </span>
  )
}

export function Branch({ name, copyable }: { name: string; copyable?: boolean }) {
  return (
    <span className="gh-branch" title={name}>
      <Icon name="branch" size={13} />
      <span className="gh-branch-name">{name}</span>
      {copyable && (
        <button type="button" className="gh-copy" aria-label={`Copy ${name}`} title="Copy the branch name" onClick={() => copy(name, "Branch name copied")}>
          <Icon name="copy" size={13} />
        </button>
      )}
    </span>
  )
}

export function TaskLink({ task }: { task: Task }) {
  return (
    <button type="button" className="gh-task" onClick={() => open({ kind: "task", id: task.id })}>
      <Dot status={task.status} />
      <span className="gh-task-id num">T{task.id}</span>
      <span className="gh-task-title">{task.title}</span>
      {task.owner && (
        <span className="gh-task-who">
          <Avatar person={task.owner.person ?? undefined} size="sm" />
          {task.owner.nickname}
        </span>
      )}
    </button>
  )
}
