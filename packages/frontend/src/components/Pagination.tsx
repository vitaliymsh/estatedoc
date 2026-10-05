import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useTranslation } from '@/lib/i18n'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <PaginationRoot className="mt-10 border-t pt-6">
      <PaginationContent className="gap-3">
        <PaginationItem>
          <PaginationPrevious
            text={t('pagination_previous')}
            size="sm"
            className={`gap-1 rounded-full text-xs cursor-pointer ${
              page <= 1 ? 'pointer-events-none opacity-50' : ''
            }`}
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-xs text-muted-foreground font-medium">
            {t('page_of', { page, totalPages })}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            text={t('pagination_next')}
            size="sm"
            className={`gap-1 rounded-full text-xs cursor-pointer ${
              page >= totalPages ? 'pointer-events-none opacity-50' : ''
            }`}
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
