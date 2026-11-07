import { afk, settings } from "@kiwi/mod"

import { Afk } from "./afk"

const WAITS: Record<string, number> = { Off: 0, "1 min": 1, "3 min": 3, "5 min": 5, "10 min": 10 }

const picked = settings()["after"]

afk({ after: typeof picked === "string" ? (WAITS[picked] ?? 3) : 3, backdrop: "meadow", render: Afk })
