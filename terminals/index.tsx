import { command, focusTerminal, markTerminal, messageAction, onTerminals, terminals } from "@kiwi/mod"

interface Waits {
  asks: number
  tasks: number[]
}

interface Terminal {
  id: string
  room: string
  agent: string
  waits: Waits
}

const AGAIN_MS = 60_000

const marked = new Map<string, string>()
let latest: Terminal[] = []
let turn = 0

const keyOf = (w: Waits): string => (w.asks || w.tasks.length ? `${w.asks}:${w.tasks.join(",")}` : "")

const waiting = (list: Terminal[]): Terminal[] => [...list.filter((t) => t.waits.asks > 0), ...list.filter((t) => t.waits.asks === 0 && t.waits.tasks.length > 0)]

function title(list: Terminal[]): string {
  return waiting(list).length ? "Go to the agent that needs you" : "Go to the agent that needs you: none does now"
}

async function paint(list: Terminal[], all = false): Promise<void> {
  latest = list
  const here = new Set(list.map((t) => t.id))
  for (const id of [...marked.keys()]) if (!here.has(id)) marked.delete(id)
  for (const t of list) {
    const key = keyOf(t.waits)
    if (!all && (marked.get(t.id) ?? "") === key) continue
    if (!key && !marked.has(t.id) && !all) continue
    try {
      await markTerminal(t.id, key ? t.waits : null)
      if (key) marked.set(t.id, key)
      else marked.delete(t.id)
    } catch {
      // The pane or block went away, or Rex isn't showing that agent now: the next list tries again.
    }
  }
  go()
}

async function look(all = false): Promise<void> {
  try {
    await paint(await terminals(), all)
  } catch {
    // The app couldn't list the agents just now: the next look tries again.
  }
}

async function next(): Promise<void> {
  await look()
  const list = waiting(latest)
  if (!list.length) return
  const t = list[turn++ % list.length]
  if (!t) return
  try {
    await focusTerminal(t.id)
  } catch {
    // The app already said why in a toast.
  }
}

function go(): void {
  command({ id: "next", title: title(latest), run: next })
}

go()

messageAction({
  id: "show",
  title: "Show in terminal",
  run: async (m) => {
    try {
      await focusTerminal({ room: m.channelId, agent: m.from })
    } catch {
      // The app already said why in a toast.
    }
  },
})

onTerminals((list) => void paint(list as Terminal[]))
void look(true)
setInterval(() => void look(true), AGAIN_MS)
