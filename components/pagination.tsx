'use client'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">{total} registro{total !== 1 ? 's' : ''}</p>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary text-xs disabled:opacity-30"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-500">
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary text-xs disabled:opacity-30"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
