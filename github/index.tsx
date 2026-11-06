import "./github.css"

import { useEffect, useState } from "react"

import { onShow, panel, showTab, tab, title, useGithub, useShowing } from "@kiwi/mod"

import { panelTitle, Shown } from "./panel"
import type { Kind, Snapshot, Target } from "./types"
import { GithubView } from "./view"

function look(data: Snapshot): { shown: boolean; alert: string | null; hint: string } {
  const open = data.prs.filter((p) => p.state === "open" || p.state === "draft")
  const red = open.some((p) => p.checks === "fail" || !!p.ticks?.failed.length)
  const issues = data.issues.filter((i) => i.state === "open").length
  return {
    shown: data.repos.length > 0 || data.prs.length > 0 || data.issues.length > 0,
    alert: red ? "An open pull request's checks failed" : null,
    hint: `${open.length} open pull requests, ${issues} open issues`,
  }
}

function Tab() {
  const data = useGithub() as Snapshot | null
  const [kind, setKind] = useState<Kind>("prs")
  useEffect(
    () =>
      onShow((t: Target) => {
        if (t.kind === "view" && (t.view === "prs" || t.view === "issues")) setKind(t.view)
      }),
    []
  )
  useEffect(() => {
    if (data) showTab(look(data))
  }, [data])
  return data ? <GithubView data={data} kind={kind} setKind={setKind} /> : null
}

function Panel() {
  const data = useGithub() as Snapshot | null
  const target = useShowing() as Target | null
  useEffect(() => title(panelTitle(target)), [target])
  return data ? <Shown data={data} target={target} /> : null
}

panel({ title: "GitHub", render: Panel })
tab({ title: "GitHub", render: Tab, shown: false })
