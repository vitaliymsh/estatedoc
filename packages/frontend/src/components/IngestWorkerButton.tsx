import { RefreshCw, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { IngestOptions } from '@/hooks/use-offers'

interface IngestWorkerButtonProps {
  isSyncing: boolean
  onSync: (options?: IngestOptions) => Promise<{ ok: boolean; message?: string; error?: unknown }>
}

export function IngestWorkerButton({ isSyncing, onSync }: IngestWorkerButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => onSync()}
      disabled={isSyncing}
      title="Run Ingest Worker"
      aria-label="Run Ingest Worker"
      className="fixed bottom-20 md:bottom-5 right-4 sm:right-5 z-50 shadow-lg backdrop-blur bg-card/90 text-card-foreground border-border hover:bg-muted gap-2 rounded-full px-3.5 h-9 text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
    >
      <Database className="size-3.5 text-primary" />
      <span>{isSyncing ? 'Pobieranie...' : 'Run Ingest Worker'}</span>
      <div className={isSyncing ? 'animate-spin inline-flex shrink-0' : 'inline-flex shrink-0'}>
        <RefreshCw className="size-3 text-muted-foreground" />
      </div>
    </Button>
  )
}
