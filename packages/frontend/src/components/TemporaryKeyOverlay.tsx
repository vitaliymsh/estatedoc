import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

interface TemporaryKeyOverlayProps {
  open: boolean
  error?: string | null
  isVerifying?: boolean
  onSubmit: (key: string) => void
}

export function TemporaryKeyOverlay({ open, error, isVerifying, onSubmit }: TemporaryKeyOverlayProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isVerifying) return
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 text-card-foreground">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">{t('temporary_key_title')}</h2>
          <p className="text-xs text-muted-foreground max-w-xs">{t('temporary_key_desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Input
              type="password"
              autoFocus
              disabled={isVerifying}
              placeholder={t('temporary_key_placeholder')}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-10 text-center font-mono text-sm tracking-wider"
            />
            {error && (
              <p className="text-[11px] text-destructive font-medium text-center">{error}</p>
            )}
          </div>

          <Button type="submit" disabled={!value.trim() || isVerifying} className="w-full h-10 font-semibold cursor-pointer">
            {isVerifying ? '...' : t('temporary_key_submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
