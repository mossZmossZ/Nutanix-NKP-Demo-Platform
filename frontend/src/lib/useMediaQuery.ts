import { useSyncExternalStore } from "react"

// Reactively tracks a CSS media query via matchMedia. The lab view uses it to
// swap its >=1280px resizable Docs | Remote Session split for a <1280px tabbed
// layout. useSyncExternalStore avoids the mount-flicker a useEffect+useState
// pairing would cause.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
