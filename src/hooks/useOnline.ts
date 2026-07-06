import { useEffect, useState } from 'react'

function getInitialOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  if (typeof navigator.onLine !== 'boolean') return true
  return navigator.onLine
}

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(getInitialOnline)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}
