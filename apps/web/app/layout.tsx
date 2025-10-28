import './globals.css'
import type { Metadata } from 'next'
import { QueryProvider } from '../components/providers/query-provider'
import { Sidebar } from '../components/layout/sidebar'
import { Topbar } from '../components/layout/topbar'

export const metadata: Metadata = {
  title: 'Zynor',
  description: 'Zynor Web Application'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <div className="min-h-screen grid grid-cols-[240px_1fr] grid-rows-[56px_1fr]">
            <div className="row-span-2 border-r bg-secondary">
              <Sidebar />
            </div>
            <div className="border-b">
              <Topbar />
            </div>
            <main className="p-6">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}


