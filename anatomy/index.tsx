import { render } from "@kiwi/mod"

const AsyncFunction = (async () => {}).constructor as FunctionConstructor

const INLINE = `
html, body { height: 100% !important; margin: 0 !important; overflow: hidden !important; background: transparent !important; }
.iso-page, .iso-figure, .iso-plate, .iso-stage { width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important; box-shadow: none !important; }
.iso-plate-corners, .iso-legend { display: none !important; }
.iso-svg { width: 100% !important; height: 100% !important; margin: 0 !important; }
`

render("figure", ({ html, dark, full }) => {
  const page = new DOMParser().parseFromString(html, "text/html")
  for (const el of document.querySelectorAll("link[rel=stylesheet], style")) el.remove()
  const code = [...page.querySelectorAll("script")].flatMap((s) => {
    s.remove()
    return s.src ? [] : [{ module: s.type === "module", text: s.textContent ?? "" }]
  })
  for (const a of page.documentElement.attributes) document.documentElement.setAttribute(a.name, a.value)
  document.documentElement.style.setProperty("color-scheme", dark ? "dark" : "light", "important")
  document.head.append(...page.head.querySelectorAll("style"))
  if (!full) document.head.append(Object.assign(document.createElement("style"), { textContent: INLINE }))
  document.body.replaceWith(document.adoptNode(page.body))
  for (const c of code) {
    if (c.module) void new AsyncFunction(`"use strict";\n${c.text}`)()
    else new Function(c.text)()
  }
})
