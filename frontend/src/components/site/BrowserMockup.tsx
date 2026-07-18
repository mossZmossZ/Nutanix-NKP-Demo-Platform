import { useEffect, useState } from 'react'

// Pure CSS "product" visual — a browser window showing the split lab UI
// (guide | terminal). Carries the single system shadow (design.md §3 shadow-md).
export function BrowserMockup() {
  const [terminalState, setTerminalState] = useState<'idle' | 'typing' | 'showing'>('idle')
  const [visibleNodes, setVisibleNodes] = useState(0)
  const [cursorVisible, setCursorVisible] = useState(true)

  const nodes = [
    { name: 'nkp-control-1', status: 'Ready', role: 'control-plane' },
    { name: 'nkp-worker-1', status: 'Ready', role: 'worker' },
  ]

  useEffect(() => {
    // Cursor blink
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 530)

    // Animation sequence
    const sequence = async () => {
      // Wait before starting
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Typing animation
      setTerminalState('typing')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show results
      setTerminalState('showing')
      
      // Reveal nodes one by one
      for (let i = 0; i <= nodes.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        setVisibleNodes(i)
      }

      // Hold final state
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Reset and loop
      setTerminalState('idle')
      setVisibleNodes(0)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    sequence()
    const loopInterval = setInterval(sequence, 9000) // Full loop every 9 seconds

    return () => {
      clearInterval(cursorInterval)
      clearInterval(loopInterval)
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-lg bg-navy-900 shadow-md">
      {/* prism edge — hero artifact top border (design-v2.md §1.3.2) */}
      <div className="h-[3px] w-full" style={{ background: 'var(--gradient-prism)' }} />
      {/* title bar */}
      <div className="flex items-center gap-xs bg-navy-800 px-md py-sm">
        <span className="size-[10px] rounded-full bg-red-500" />
        <span className="size-[10px] rounded-full bg-yellow-500" />
        <span className="size-[10px] rounded-full bg-green-500" />
        <span className="ml-auto text-label text-navy-fg">NKP Demo Platform</span>
      </div>
      {/* split panes */}
      <div className="grid grid-cols-2">
        <div className="border-r border-border bg-surface p-lg">
          <div className="flex items-center gap-sm">
            <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-h4 text-foreground">Lab 1 · Deploy NKP</p>
          </div>
          <div className="mt-lg space-y-sm">
            <div className="flex items-start gap-sm">
              <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</div>
              <div className="flex-1">
                <div className="h-[8px] w-full rounded-full bg-border" />
              </div>
            </div>
            <div className="flex items-start gap-sm">
              <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</div>
              <div className="flex-1">
                <div className="h-[8px] w-4/5 rounded-full bg-border" />
              </div>
            </div>
            <div className="flex items-start gap-sm">
              <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</div>
              <div className="flex-1">
                <div className="h-[8px] w-3/5 rounded-full bg-border" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative bg-navy-900 p-lg font-mono text-[13px] leading-relaxed text-navy-fg">
          <div className="flex items-center gap-sm text-navy-fg/50">
            <span className="text-blue-600">user@nkp-demo</span>
            <span>~</span>
          </div>
          <div className="mt-sm flex items-center">
            <span className="text-blue-600">$</span>
            <span className="ml-2">
              {terminalState === 'idle' && (
                <span className={`inline-block h-[14px] w-[8px] bg-iris-600 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
              )}
              {(terminalState === 'typing' || terminalState === 'showing') && (
                <>
                  kubectl get nodes
                  {terminalState === 'typing' && (
                    <span className={`inline-block h-[14px] w-[8px] bg-iris-600 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
                  )}
                </>
              )}
            </span>
          </div>
          {terminalState === 'showing' && (
            <div className="mt-md space-y-1">
              {visibleNodes > 0 && (
                <div className="flex gap-4 text-navy-fg/50">
                  <span className="w-[140px]">NAME</span>
                  <span className="w-[60px]">STATUS</span>
                  <span>ROLES</span>
                </div>
              )}
              {nodes.slice(0, visibleNodes).map((node, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <span className="w-[140px] text-navy-fg">{node.name}</span>
                  <span className="w-[60px] text-success">{node.status}</span>
                  <span className="text-navy-fg/60">{node.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
