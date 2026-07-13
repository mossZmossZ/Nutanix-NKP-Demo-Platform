import { Outlet } from 'react-router-dom'
import { GlobalNav } from '@/components/site/GlobalNav'
import { Footer } from '@/components/site/Footer'
import { Toaster } from '@/components/ui/sonner'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GlobalNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors closeButton position="top-right" visibleToasts={3} />
    </div>
  )
}
