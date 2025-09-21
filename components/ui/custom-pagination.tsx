"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showFirstLast?: boolean
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
}: CustomPaginationProps) {
  if (totalPages <= 1) return null

  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 4) {
        // Near the beginning: 1 2 3 4 5 ... last
        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
          pages.push(i)
        }
        if (totalPages > 5) {
          pages.push('ellipsis')
        }
      } else if (currentPage >= totalPages - 3) {
        // Near the end: 1 ... n-4 n-3 n-2 n-1 n
        if (totalPages > 5) {
          pages.push('ellipsis')
        }
        for (let i = Math.max(2, totalPages - 4); i <= totalPages - 1; i++) {
          pages.push(i)
        }
      } else {
        // In the middle: 1 ... current-1 current current+1 ... last
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
      }

      // Always show last page (if more than 1)
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <nav className={cn("flex items-center justify-center", className)} role="navigation" aria-label="Pagination">
      <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        {/* First Button */}
        {showFirstLast && currentPage > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-r border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            aria-label="Go to first page"
          >
            First
          </button>
        )}

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            "px-2 py-2 text-sm font-medium border-r border-gray-200 transition-colors duration-200",
            currentPage === 1
              ? "text-gray-400 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = currentPage === pageNum

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Go to page ${pageNum}`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            "px-2 py-2 text-sm font-medium border-l border-gray-200 transition-colors duration-200",
            currentPage === totalPages
              ? "text-gray-400 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900"
          )}
          aria-label="Go to next page"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Button */}
        {showFirstLast && currentPage < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-l border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            aria-label="Go to last page"
          >
            Last
          </button>
        )}
      </div>
    </nav>
  )
}