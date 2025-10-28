"use client"

import { useQuery } from '@tanstack/react-query'
import { Badge } from './ui/badge'
import { getApiUrl } from '../lib/utils'

type HealthResponse = { status: string }

export function HealthBadge() {
  const apiUrl = getApiUrl()
  const { data, isError } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Health check failed')
      return (await res.json()) as HealthResponse
    },
    staleTime: 15_000,
    retry: 0
  })

  if (isError) {
    return <Badge variant="outline">API: Down</Badge>
  }

  if (data?.status === 'ok') {
    return <Badge variant="success">API: OK</Badge>
  }

  return <Badge variant="outline">API: ...</Badge>
}


