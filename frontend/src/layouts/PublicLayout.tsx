import { Outlet } from 'react-router-dom'
import { GlobalNav } from '@/components/site/GlobalNav'
import { Footer } from '@/components/site/Footer'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <GlobalNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
