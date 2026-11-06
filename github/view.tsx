import { useState, type ReactNode } from "react"

import { ago, Avatar, Count, cx, Dot, Empty, Icon, open, show, Track, useShowing } from "@kiwi/mod"

import { ciOf, isOpen, issueGroups, matches, prGroups, type Group, type GroupKey, type Shown } from "./groups"
import { choreTitle, since, trouble as troubleOf, type Trouble } from "./health"
import { checksLine, DiffBar, IssueMark, issueWord, PrMark, Ticks } from "./parts"
import type { Issue, Kind, PullRequest, Snapshot, Target, Task } from "./types"

const SHOWN = 8

const LOUD: Partial<Record<GroupKey, string>> = { fail: "tone-alert", running: "tone-doing" }

const shortRepo = (repo: string, repos: readonly string[]): string => {
  const name = repo.split("/")[1] ?? repo
  return repos.filter((r) => (r.split("/")[1] ?? r).toLowerCase() === name.toLowerCase()).length > 1 ? repo : name
}

export function reposOf(data: Snapshot): string[] {
  const seen = new Map<string, string>()
  for (const r of [...data.repos, ...data.prs.map((p) => p.repo), ...data.issues.map((i) => i.repo)]) if (!seen.has(r.toLowerCase())) seen.set(r.toLowerCase(), r)
  return [...seen.values()]
}

const isOn = (on: Target | null, kind: "pr" | "issue", x: { repo: string; number: number }): boolean => on?.kind === kind && on.repo === x.repo && on.number === x.number

export function GithubView({ data, kind, setKind }: { data: Snapshot; kind: Kind; setKind: (k: Kind) => void }) {
  const [shown, setShown] = useState<Shown>("open")
  const [repo, setRepo] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const on = useShowing() as Target | null
  const repos = reposOf(data)
  if (!repos.length) return <NoRepo />
  const tasks = new Map(data.tasks.map((t) => [t.id, t]))
  const inRepo = <T extends { repo: string }>(xs: readonly T[]) => (repo ? xs.filter((x) => x.repo.toLowerCase() === repo.toLowerCase()) : xs)
  const prs = inRepo(data.prs).filter((p) => matches(p, query))
  const issues = inRepo(data.issues).filter((i) => matches(i, query))
  const items: readonly { state: string }[] = kind === "prs" ? prs : issues
  const openCount = items.filter(isOpen).length
  const many = repos.length > 1
  const trouble = data.health ? troubleOf(data.health, repo ? [repo] : data.repos, kind) : null
  return (
    <div className="board">
      <div className="board-list gh-list">
        <div className="gh-top">
          <Track className="seg gh-kind" role="group" aria-label="Pull requests or issues">
            <button type="button" aria-pressed={kind === "prs"} onClick={() => setKind("prs")}>
              <Icon name="pr" size={14} />
              Pull requests <Count n={prs.filter(isOpen).length} />
            </button>
            <button type="button" aria-pressed={kind === "issues"} onClick={() => setKind("issues")}>
              <Icon name="issue" size={14} />
              Issues <Count n={issues.filter(isOpen).length} />
            </button>
          </Track>
          <Track className="seg" role="group" aria-label="Open or closed">
            <button type="button" aria-pressed={shown === "open"} onClick={() => setShown("open")}>
              Open <span className="gh-n num">{openCount}</span>
            </button>
            <button type="button" aria-pressed={shown === "closed"} onClick={() => setShown("closed")}>
              Closed <span className="gh-n num">{items.length - openCount}</span>
            </button>
          </Track>
          <div className="gh-end">
            {many && (
              <Track className="seg gh-repos" role="group" aria-label="Repo">
                <button type="button" aria-pressed={repo === null} onClick={() => setRepo(null)}>
                  All repos
                </button>
                {repos.map((r) => (
                  <button key={r} type="button" aria-pressed={repo?.toLowerCase() === r.toLowerCase()} title={r} onClick={() => setRepo(r)}>
                    {shortRepo(r, repos)}
                  </button>
                ))}
              </Track>
            )}
            <label className="gh-find">
              <Icon name="search" size={14} />
              <input
                value={query}
                aria-label={kind === "prs" ? "Filter pull requests" : "Filter issues"}
                placeholder="Filter"
                title={kind === "prs" ? "Title, #number, author or branch" : "Title, #number or author"}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && query) {
                    e.stopPropagation()
                    setQuery("")
                  }
                }}
              />
              {query && (
                <button type="button" className="gh-find-clear" aria-label="Clear the filter" onClick={() => setQuery("")}>
                  <Icon name="close" size={12} />
                </button>
              )}
            </label>
          </div>
        </div>
        {kind === "prs" ? (
          <Groups
            groups={prGroups(prs, shown)}
            empty={<Nothing query={query} clear={() => setQuery("")} what={shown === "open" ? "open pull requests" : "closed pull requests"} icon="pr" trouble={trouble} />}
            row={(pr: PullRequest) => (
              <PrRow key={`${pr.repo}#${pr.number}`} pr={pr} task={pr.task === undefined ? undefined : tasks.get(pr.task)} on={isOn(on, "pr", pr)} repos={many ? repos : null} />
            )}
          />
        ) : (
          <Groups
            groups={issueGroups(issues, shown)}
            empty={<Nothing query={query} clear={() => setQuery("")} what={shown === "open" ? "open issues" : "closed issues"} icon="issue" trouble={trouble} />}
            row={(i: Issue) => <IssueRow key={`${i.repo}#${i.number}`} issue={i} task={i.task === undefined ? undefined : tasks.get(i.task)} on={isOn(on, "issue", i)} repos={many ? repos : null} />}
          />
        )}
      </div>
    </div>
  )
}

function Groups<T>({ groups, empty, row }: { groups: Group<T>[]; empty: ReactNode; row: (x: T) => ReactNode }) {
  if (!groups.length) return <>{empty}</>
  return (
    <div className="board-stack">
      {groups.map((g) => (
        <GroupCard key={g.key} group={g} row={row} />
      ))}
    </div>
  )
}

function GroupCard<T>({ group, row }: { group: Group<T>; row: (x: T) => ReactNode }) {
  const [all, setAll] = useState(false)
  const rows = all ? group.rows : group.rows.slice(0, SHOWN)
  return (
    <section className={cx("board-group gh-group", `is-${group.key}`)} aria-label={group.label}>
      <div className="board-head">
        <h2 className="board-h">
          <span className={cx("board-label", LOUD[group.key])}>{group.label}</span>
          <span className="board-n num">{group.rows.length}</span>
        </h2>
      </div>
      <ul className="gh-rows">{rows.map(row)}</ul>
      {group.rows.length > SHOWN && (
        <button type="button" className="board-more" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show ${group.rows.length - SHOWN} more`}
        </button>
      )}
    </section>
  )
}

const EVENT_NAMES: Record<string, string> = { pull_request: "Pull request", check_run: "Check run", issues: "Issues" }

const listed = (xs: readonly string[]): string => (xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`)

function Nothing({ query, clear, what, icon, trouble }: { query: string; clear: () => void; what: string; icon: "pr" | "issue"; trouble: Trouble | null }) {
  if (query.trim())
    return (
      <Empty title={`No ${what} match “${query.trim()}”.`} icon="search">
        <button type="button" className="btn is-small" onClick={clear}>
          Clear the filter
        </button>
      </Empty>
    )
  if (trouble?.kind === "no-app")
    return (
      <Empty title="GitHub can't reach this channel." icon="github">
        <p>This relay has no GitHub App, so GitHub has nowhere to send a repo's pull requests and issues. Whoever runs the relay sets one up, as docs/github-app.md says.</p>
      </Empty>
    )
  if (trouble?.kind === "not-installed")
    return (
      <Empty title={`Kiwi Channels isn't installed on ${trouble.owner}.`} icon="github">
        <p>GitHub tells only the Apps installed on a repo about its pull requests, checks and issues.</p>
        {trouble.install && (
          <a className="btn is-small gh-empty-btn" href={trouble.install}>
            Install Kiwi Channels on {trouble.owner}
          </a>
        )}
      </Empty>
    )
  if (trouble?.kind === "events")
    return (
      <Empty title={`Kiwi Channels doesn't get ${listed(trouble.missing.map((e) => EVENT_NAMES[e] ?? e))} events.`} icon="github">
        <p>Turn them on under Permissions & events in the App's settings, then accept the new permissions on {trouble.owner}.</p>
      </Empty>
    )
  if (trouble?.kind === "syncing")
    return (
      <Empty title={`Fetching ${trouble.repo}'s ${icon === "pr" ? "pull requests" : "issues"}…`} icon={icon}>
        <p>The open ones, and the ones closed in the last 30 days.</p>
      </Empty>
    )
  if (trouble?.kind === "failed")
    return (
      <Empty title={`${choreTitle(trouble.what, trouble.repo)}.`} icon="github">
        <p>{trouble.message}</p>
      </Empty>
    )
  return (
    <Empty title={`No ${what}.`} icon={icon}>
      {trouble?.kind === "quiet" && (trouble.last === null ? "GitHub hasn't sent this channel anything yet." : `GitHub's last news came ${since(trouble.last)}.`)}
    </Empty>
  )
}

function NoRepo() {
  return (
    <div className="board">
      <div className="board-list gh-list">
        <Empty title="No GitHub repo linked yet." icon="github">
          <button type="button" className="btn is-small gh-empty-btn" onClick={() => open({ kind: "settings" })}>
            Open channel settings
          </button>
        </Empty>
      </div>
    </div>
  )
}

function Owner({ task }: { task: Task | undefined }) {
  if (!task) return <span className="gh-col-task" />
  return (
    <span className="gh-col-task num" title={`T${task.id} ${task.title}`}>
      <Dot status={task.status} />T{task.id}
      {task.owner && <Avatar person={task.owner.person ?? undefined} size="sm" />}
    </span>
  )
}

function Item({ on, url, label, target, issue, children }: { on: boolean; url: string; label: string; target: Target; issue?: boolean; children: ReactNode }) {
  return (
    <li className={cx("gh-item", on && "is-on")}>
      <button type="button" className={cx("gh-row", issue && "is-issue")} aria-current={on || undefined} onClick={() => show(target)}>
        {children}
      </button>
      <a className="gh-out" href={url} aria-label={`${label} on GitHub`} title="Open on GitHub">
        <Icon name="out" size={14} />
      </a>
    </li>
  )
}

function ciWord(pr: PullRequest): string {
  const t = pr.ticks
  const ci = ciOf(pr)
  if (t && ci === "fail") return t.failed.length === 1 ? (t.failed[0] ?? "1 failed") : `${t.failed.length} failed`
  if (t && ci === "running") return `${t.passed} of ${t.passed + t.running + t.failed.length}`
  return ci === "fail" ? "failed" : "running"
}

function PrRow({ pr, task, on, repos }: { pr: PullRequest; task: Task | undefined; on: boolean; repos: string[] | null }) {
  const line = checksLine(pr)
  const ci = ciOf(pr)
  const closed = pr.state === "merged" || pr.state === "closed"
  return (
    <Item on={on} url={pr.url} label={`PR #${pr.number}`} target={{ kind: "pr", repo: pr.repo, number: pr.number }}>
      <PrMark pr={pr} />
      <span className="gh-title">{pr.title}</span>
      <span className="gh-meta">
        <span className="num">#{pr.number}</span>
        {repos && <span>{shortRepo(pr.repo, repos)}</span>}
        {pr.by && <span>{pr.by}</span>}
        {closed ? <span>{`${pr.state} ${ago(pr.at ?? 0)}`}</span> : pr.at !== undefined && <span>{ago(pr.at)}</span>}
        {pr.release && <span>shipped in {pr.release}</span>}
        {line && (ci === "fail" || ci === "running") && <span className={cx("gh-meta-ci", line.tone)}>{line.text}</span>}
      </span>
      <span className={cx("gh-col-ci", closed && "is-quiet")}>
        {!closed && pr.list?.length ? <Ticks list={pr.list} /> : null}
        {!closed && (ci === "fail" || ci === "running") && (
          <span className={cx("gh-ci-word", line?.tone)} title={pr.ticks?.failed.length ? `Failed: ${pr.ticks.failed.join(", ")}` : undefined}>
            {ciWord(pr)}
          </span>
        )}
      </span>
      <span className="gh-col-size num">
        {pr.additions !== undefined && pr.deletions !== undefined && (
          <>
            <DiffBar additions={pr.additions} deletions={pr.deletions} />
            <span className="tone-live">+{pr.additions}</span>
            <span className="tone-alert">−{pr.deletions}</span>
          </>
        )}
      </span>
      <Owner task={task} />
    </Item>
  )
}

function IssueRow({ issue, task, on, repos }: { issue: Issue; task: Task | undefined; on: boolean; repos: string[] | null }) {
  return (
    <Item issue on={on} url={issue.url} label={`Issue #${issue.number}`} target={{ kind: "issue", repo: issue.repo, number: issue.number }}>
      <IssueMark issue={issue} />
      <span className="gh-title">{issue.title}</span>
      <span className="gh-meta">
        <span className="num">#{issue.number}</span>
        {repos && <span>{shortRepo(issue.repo, repos)}</span>}
        {issue.by && <span>{issue.by}</span>}
        <span>{issue.state === "open" ? ago(issue.at) : `${issueWord(issue)} ${ago(issue.at)}`}</span>
      </span>
      <Owner task={task} />
    </Item>
  )
}
