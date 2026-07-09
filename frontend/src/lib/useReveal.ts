import { useEffect, useRef, useState } from "react"

// design.md §6 "Marketing homepage" reveal: fade + 12px rise on first scroll
// into view, staggered ~60ms across sibling elements, plays once
// (IntersectionObserver, not scroll-jacking). Falls back to visible
// immediately in environments without IntersectionObserver support.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// Animate only opacity/transform (design.md §6). `prefers-reduced-motion`
// collapses the transition duration globally (see index.css), so this
// degrades to a near-instant fade rather than no motion at all.
export function revealClass(visible: boolean) {
  return (
    "transition-[opacity,transform] duration-[var(--duration-page)] ease-standard " +
    (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")
  )
}

// Stagger siblings ~60ms apart (design.md §6).
export function revealDelay(index: number) {
  return { transitionDelay: `${index * 60}ms` }
}
