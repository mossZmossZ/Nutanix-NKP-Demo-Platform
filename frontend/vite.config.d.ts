import type { InlineConfig } from 'vitest'
import type { UserConfigExport } from 'vite'

declare global {
  namespace Vite {
    interface UserConfigExport {
      test?: InlineConfig
    }
  }
}
