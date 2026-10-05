import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-3 border-t pt-6">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="gap-1 rounded-full text-xs"
      >
        <ChevronLeft className="size-3.5" />
        Poprzednia
      </Button>
      <span className="text-xs text-muted-foreground">
        Strona <strong className="text-foreground">{page}</strong> z{' '}
        <strong className="text-foreground">{totalPages}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="gap-1 rounded-full text-xs"
      >
        Następna
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}
