import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wrench, X, RefreshCw, Database, Play, CheckCircle2, AlertCircle } from 'lucide-react'
import type { IngestOptions } from '@/hooks/use-offers'

interface DevIntakeFabProps {
  isSyncing: boolean
  onSync: (options?: IngestOptions) => Promise<{ ok: boolean; message?: string; error?: unknown }>
}

const PAGE_OPTIONS = [1, 2, 3, 5] as const

export function DevIntakeFab({ isSyncing, onSync }: DevIntakeFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [portal, setPortal] = useState<'all' | 'sprzedajemy' | 'morizon'>('all')
  const [maxPages, setMaxPages] = useState<number>(1)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen])

  const handleRun = async () => {
    setStatus(null)
    const res = await onSync({ portal, maxPages })
    setStatus(
      res.ok
        ? { type: 'ok', text: res.message || 'Ingestion zakończone sukcesem' }
        : { type: 'err', text: String(res.error || 'Błąd podczas pobierania') }
    )
  }

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-80 rounded-2xl border bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-1.5 font-semibold">
              <Database className="size-4 text-primary" />
              <span>DEV Intake Hub</span>
              <Badge variant="outline" className="text-[10px] font-mono px-1 py-0">DEV</Badge>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-muted-foreground">Portal:</label>
            <Select value={portal} onValueChange={(v) => setPortal(v as typeof portal)}>
              <SelectTrigger size="sm" className="w-full text-xs cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie (Sprzedajemy + Morizon)</SelectItem>
                <SelectItem value="sprzedajemy">Sprzedajemy.pl</SelectItem>
                <SelectItem value="morizon">Morizon.pl</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-medium text-muted-foreground">
              <span>Liczba stron:</span>
              <span className="font-mono text-foreground font-bold">{maxPages}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {PAGE_OPTIONS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={maxPages === p ? 'default' : 'outline'}
                  onClick={() => setMaxPages(p)}
                  className="h-7 text-xs cursor-pointer"
                >
                  {p} {p === 1 ? 'strona' : 'strony'}
                </Button>
              ))}
            </div>
          </div>

          {status && (
            <div
              className={`flex items-start gap-1.5 p-2 rounded-lg border text-[11px] leading-tight ${
                status.type === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {status.type === 'ok' ? (
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              )}
              <span className="break-words">{status.text}</span>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isSyncing}
            className="w-full gap-1.5 text-xs font-semibold cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                Pobieranie ofert...
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Uruchom Ingestion
              </>
            )}
          </Button>
        </div>
      )}

      <button
        type="button"
        title="Narzędzia developerskie — Ingestion"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative size-12 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 flex items-center justify-center transition active:scale-95 cursor-pointer border border-primary/20"
      >
        {isSyncing ? <RefreshCw className="size-5 animate-spin" /> : <Wrench className="size-5" />}
        <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow">
          D
        </span>
      </button>
    </div>
  )
}
