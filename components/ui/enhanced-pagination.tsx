"use client"

import React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPageNumbers?: boolean
  maxPageNumbers?: number
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "compact" | "pills"
  showPageInfo?: boolean
  disabled?: boolean
}

// Helper function to generate page numbers with smart ellipsis
const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | "ellipsis")[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = []
  const halfVisible = Math.floor(maxVisible / 2)

  // Always show first page
  pages.push(1)

  if (currentPage <= halfVisible + 1) {
    // Show pages from start
    for (let i = 2; i <= Math.min(maxVisible - 1, totalPages - 1); i++) {
      pages.push(i)
    }
    if (totalPages > maxVisible - 1) {
      pages.push("ellipsis")
    }
  } else if (currentPage >= totalPages - halfVisible) {
    // Show pages at end
    if (totalPages > maxVisible - 1) {
      pages.push("ellipsis")
    }
    for (let i = Math.max(totalPages - maxVisible + 2, 2); i <= totalPages - 1; i++) {
      pages.push(i)
    }
  } else {
    // Show pages around current
    pages.push("ellipsis")
    for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
      pages.push(i)
    }
    pages.push("ellipsis")
  }

  // Always show last page (if more than 1 page)
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

export function EnhancedPagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxPageNumbers = 7,
  className,
  size = "default",
  variant = "default",
  showPageInfo = false,
  disabled = false,
}: EnhancedPaginationProps) {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page)
    }
  }

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    default: "h-9 w-9",
    lg: "h-10 w-10 text-lg",
  }

  const variantClasses = {
    default: "",
    compact: "gap-0.5",
    pills: "gap-2",
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages, maxPageNumbers)

  if (totalPages <= 1) return null

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Pagination className={disabled ? "opacity-50 pointer-events-none" : ""}>
        <PaginationContent className={cn("gap-1", variantClasses[variant])}>
          {/* First Page Button */}
          {showFirstLast && currentPage > 1 && (
            <PaginationItem>
              <button
                onClick={() => handlePageChange(1)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "gap-1 px-2.5 hover:scale-105 active:scale-95",
                  sizeClasses[size],
                  variant === "pills" && "rounded-full"
                )}
                aria-label="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="hidden sm:inline">First</span>
              </button>
            </PaginationItem>
          )}

          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={cn(
                "hover:scale-105 active:scale-95 transition-all duration-200",
                currentPage <= 1 && "pointer-events-none opacity-50",
                variant === "pills" && "rounded-full"
              )}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {showPageNumbers &&
            pageNumbers.map((page, index) => (
              <PaginationItem key={`${page}-${index}`}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis className={variant === "pills" ? "rounded-full" : ""} />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                    className={cn(
                      "hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer",
                      sizeClasses[size],
                      variant === "pills" && "rounded-full",
                      variant === "compact" && "rounded-sm",
                      page === currentPage && [
                        "bg-primary text-primary-foreground shadow-lg",
                        "hover:bg-primary/90",
                        variant === "pills" && "shadow-primary/25",
                      ]
                    )}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={cn(
                "hover:scale-105 active:scale-95 transition-all duration-200",
                currentPage >= totalPages && "pointer-events-none opacity-50",
                variant === "pills" && "rounded-full"
              )}
            />
          </PaginationItem>

          {/* Last Page Button */}
          {showFirstLast && currentPage < totalPages && (
            <PaginationItem>
              <button
                onClick={() => handlePageChange(totalPages)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "gap-1 px-2.5 hover:scale-105 active:scale-95",
                  sizeClasses[size],
                  variant === "pills" && "rounded-full"
                )}
                aria-label="Go to last page"
              >
                <span className="hidden sm:inline">Last</span>
                <ChevronsRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>

      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  )
}

// Hook for pagination logic
export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: {
  totalItems: number
  itemsPerPage: number
  initialPage?: number
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage)

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNext,
    goToPrevious,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  }
}