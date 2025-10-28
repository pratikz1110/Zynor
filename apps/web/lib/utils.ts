import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(): string {
  if (typeof process !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL
    if (envUrl && envUrl.length > 0) return envUrl
  }
  return 'http://localhost:8000'
}


