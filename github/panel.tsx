import type { ReactNode } from "react"

import { ago, cx, Empty, Heading, Icon, open } from "@kiwi/mod"

import { checksSummary } from "./groups"
import { Branch, Checks, checksLine, IssueMark, issueTone, issueWord, PR_TONES, PR_WORDS, PrMark, Size, TaskLink, Ticks } from "./parts"
import type { Snapshot, Target } from "./types"

const same = (a: { repo: string; number: number }, repo: string, number: number): boolean => a.number === number && a.repo.toLowerCase() === repo.toLowerCase()

const when = (at: number): string => {
  const a = ago(at)
  return a === "now" ? "just now" : /^\d+[mhd]$/.test(a) ? `${a} ago` : a
}

export const panelTitle = (t: Target | null): string => (t?.kind === "pr" ? `PR #${t.number}` : t?.kind === "issue" ? `Issue #${t.number}` : "GitHub")

function Out({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a className={cx("btn is-small", primary && "is-primary")} href={href}>
      {children}
      {primary && <Icon name="out" size={12} />}
    </a>
  )
}

function TaskSection({ data, id }: { data: Snapshot; id: number | undefined }) {
  const task = id === undefined ? undefined : data.tasks.find((t) => t.id === id)
  return (
    <section className="panel-section">
      <Heading>Task</Heading>
      {task ? (
        <TaskLink task={task} />
      ) : (
        <p className="gh-none">
          None yet.{" "}
          <button type="button" className="gh-inline" onClick={() => open({ kind: "chat" })}>
            Ask for one in the conversation
          </button>
        </p>
      )}
    </section>
  )
}

export function Shown({ data, target }: { data: Snapshot; target: Target | null }) {
  if (target?.kind === "pr") return <PrPanel data={data} repo={target.repo} number={target.number} />
  if (target?.kind === "issue") return <IssuePanel data={data} repo={target.repo} number={target.number} />
  return <Empty title="Pick a pull request or an issue in the GitHub tab." icon="github" />
}

function PrPanel({ data, repo, number }: { data: Snapshot; repo: string; number: number }) {
  const pr = data.prs.find((p) => same(p, repo, number))
  if (!pr) return <Empty title="This pull request isn't here any more." />
  const line = checksLine(pr)
  const closed = pr.state === "merged" || pr.state === "closed"
  return (
    <div className="panel-body">
      <section className="panel-section">
        <h3 className="task-title gh-panel-title">{pr.title}</h3>
        <p className="gh-state">
          <PrMark pr={pr} size={14} />
          <span className={PR_TONES[pr.state]}>{PR_WORDS[pr.state]}</span>
          {line && !closed && <span className={cx("gh-state-ci", line.tone)}>· {line.text}</span>}
          {pr.release && <span className="dim">· shipped in {pr.release}</span>}
        </p>
      </section>
      <section className="panel-section">
        <dl className="props task-props">
          <dt>Repo</dt>
          <dd className="gh-dd-mono">{pr.repo}</dd>
          {pr.branch && (
            <>
              <dt>Branch</dt>
              <dd>
                <Branch name={pr.branch} copyable />
              </dd>
            </>
          )}
          {pr.by && (
            <>
              <dt>Author</dt>
              <dd>{pr.by}</dd>
            </>
          )}
          {pr.additions !== undefined && (
            <>
              <dt>Size</dt>
              <dd>
                <Size pr={pr} />
              </dd>
            </>
          )}
          {pr.at !== undefined && (
            <>
              <dt>{pr.state === "merged" ? "Merged" : pr.state === "closed" ? "Closed" : "Updated"}</dt>
              <dd>{when(pr.at)}</dd>
            </>
          )}
        </dl>
      </section>
      {pr.list && pr.list.length > 0 && (
        <section className="panel-section">
          <Heading
            action={
              pr.list.length > 8 ? (
                <span className="gh-heading-side">
                  <Ticks list={pr.list} />
                  <span className="num">{checksSummary(pr.list)}</span>
                </span>
              ) : undefined
            }
          >
            Checks
          </Heading>
          <Checks list={pr.list} fold={pr.list.length > 8} />
        </section>
      )}
      <TaskSection data={data} id={pr.task} />
      <section className="panel-section gh-actions">
        <Out href={pr.url} primary>
          Open on GitHub
        </Out>
        <Out href={`${pr.url}/files`}>Files changed</Out>
        {!closed && <Out href={`${pr.url}/checks`}>Checks</Out>}
      </section>
    </div>
  )
}

function IssuePanel({ data, repo, number }: { data: Snapshot; repo: string; number: number }) {
  const issue = data.issues.find((i) => same(i, repo, number))
  if (!issue) return <Empty title="This issue isn't here any more." />
  return (
    <div className="panel-body">
      <section className="panel-section">
        <h3 className="task-title gh-panel-title">{issue.title}</h3>
        <p className="gh-state">
          <IssueMark issue={issue} size={14} />
          <span className={issueTone(issue)}>{issueWord(issue).replace(/^./, (c) => c.toUpperCase())}</span>
        </p>
      </section>
      <section className="panel-section">
        <dl className="props task-props">
          <dt>Repo</dt>
          <dd className="gh-dd-mono">{issue.repo}</dd>
          {issue.by && (
            <>
              <dt>{issue.state === "open" ? "Opened by" : "Closed by"}</dt>
              <dd>{issue.by}</dd>
            </>
          )}
          <dt>{issue.state === "open" ? "Updated" : "Closed"}</dt>
          <dd>{when(issue.at)}</dd>
        </dl>
      </section>
      <TaskSection data={data} id={issue.task} />
      <section className="panel-section gh-actions">
        <Out href={issue.url} primary>
          Open on GitHub
        </Out>
      </section>
    </div>
  )
}
