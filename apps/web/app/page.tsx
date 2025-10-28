import { HealthBadge } from '../components/health-badge'

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <HealthBadge />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="rounded-lg border p-4 bg-white">Card 1</div>
        <div className="rounded-lg border p-4 bg-white">Card 2</div>
        <div className="rounded-lg border p-4 bg-white">Card 3</div>
      </div>
    </div>
  )
}


