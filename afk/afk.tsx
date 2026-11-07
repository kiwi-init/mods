import "./afk.css"

import { useEffect } from "react"

import { Count, cx, leave, open, useChannels, useStill, type Channel } from "@kiwi/mod"

import { Settle } from "./settle"

const SHOWN = 8
const AWAY = ["keydown", "wheel", "pointerdown", "contextmenu"] as const

function Row({ row, still }: { row: Channel; still: boolean }) {
  const needs = row.needs > 0
  const label = `${row.title}${needs ? `, ${row.needs} ${row.needs === 1 ? "needs" : "need"} you` : ""}, ${row.line ?? "quiet"}`
  return (
    <li>
      <button type="button" className={cx("afk-row", needs && "is-news")} aria-label={label} onClick={() => open({ kind: "channel", code: row.code })}>
        <span className="afk-mark">{needs ? <Count n={row.needs} loud /> : "·"}</span>
        <span className="afk-name">
          <Settle text={row.title} still={still} />
        </span>
        <span className={cx("afk-line", !row.line && "is-quiet")}>
          <Settle text={row.line ?? "quiet"} still={still} />
        </span>
      </button>
    </li>
  )
}

export function Afk() {
  const rows = (useChannels() ?? []).slice(0, SHOWN)
  const still = useStill()
  const total = rows.reduce((a, r) => a + r.needs, 0)

  useEffect(() => {
    const away = (e: Event): void => {
      if (e.type === "pointerdown" && e.target instanceof Element && e.target.closest(".afk-row")) return
      e.preventDefault()
      leave()
    }
    for (const type of AWAY) addEventListener(type, away, { capture: true, passive: false })
    return () => {
      for (const type of AWAY) removeEventListener(type, away, { capture: true })
    }
  }, [])

  return (
    <section className="afk-glance" aria-label="What needs you">
      {total > 0 ? (
        <p className="afk-count">
          Needs you <Count n={total} loud />
        </p>
      ) : (
        <p className="afk-quiet">Nothing needs you. Enjoy your time, or go worry about something else.</p>
      )}
      <ul className="afk-list" aria-label="Channels">
        {rows.map((r) => (
          <Row key={r.code} row={r} still={still} />
        ))}
      </ul>
    </section>
  )
}
