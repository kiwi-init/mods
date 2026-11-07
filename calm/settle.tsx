import { useEffect, useState } from "react"

export function Settle({ text, still, rate = 70 }: { text: string; still: boolean; rate?: number }) {
  const [shown, setShown] = useState(() => (still ? text : ""))
  useEffect(() => {
    if (still) return
    const t0 = performance.now()
    let raf = 0
    const step = (): void => {
      const age = (performance.now() - t0) / 1000
      let out = ""
      for (let i = 0; i < text.length; i++) {
        const a = age - i / rate
        const ch = text[i] ?? ""
        out += ch === " " || a > 0.1 ? ch : a > -0.25 ? String.fromCharCode(97 + Math.floor(Math.random() * 26)) : ""
      }
      setShown(out)
      if (age < text.length / rate + 0.15) raf = requestAnimationFrame(step)
      else setShown(text)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, still, rate])
  return <>{still ? text : shown}</>
}
