import { useEffect, useState } from 'react'
import { onToast } from './toastBus'

export function Toast(): React.JSX.Element | null {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const off = onToast((m) => {
      setMsg(m)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 2600)
    })
    return () => {
      off()
      clearTimeout(timer)
    }
  }, [])

  if (!msg) return null
  return <div className="toast">{msg}</div>
}
