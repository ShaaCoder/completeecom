"use client"

import React, { useState } from "react"
import { EnhancedPagination, usePagination } from "./ui/enhanced-pagination"

// Example 1: Basic pagination with products
export function ProductsPaginationExample() {
  // Mock data - replace with your actual data
  const products = Array.from({ length: 150 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 10,
  }))

  const {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination({
    totalItems: products.length,
    itemsPerPage: 12,
    initialPage: 1,
  })

  const currentProducts = products.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{endIndex} of {products.length} products
      </div>
      
      {/* Your product grid here */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentProducts.map((product) => (
          <div key={product.id} className="p-4 border rounded-lg">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-muted-foreground">${product.price}</p>
          </div>
        ))}
      </div>

      <EnhancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        showPageInfo
        className="mt-8"
      />
    </div>
  )
}

// Example 2: Compact pagination for mobile
export function CompactPaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 25

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compact Style (Mobile-friendly)</h3>
      <EnhancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        variant="compact"
        size="sm"
        maxPageNumbers={5}
        showPageInfo
      />
    </div>
  )
}

// Example 3: Pills style pagination
export function PillsPaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 15

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pills Style</h3>
      <EnhancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        variant="pills"
        size="lg"
        showFirstLast={false}
        className="bg-muted/30 p-4 rounded-lg"
      />
    </div>
  )
}

// Example 4: Admin table with pagination and page size selector
export function AdminTablePaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Mock data
  const users = Array.from({ length: 247 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? 'Admin' : 'User',
  }))

  const {
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination({
    totalItems: users.length,
    itemsPerPage,
    initialPage: currentPage,
  })

  // Update pagination when items per page changes
  React.useEffect(() => {
    goToPage(1)
    setCurrentPage(1)
  }, [itemsPerPage])

  const currentUsers = users.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Management</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">
            Show:
          </label>
          <select
            id="pageSize"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                <td className="px-4 py-3 text-sm">{user.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination with info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{endIndex} of {users.length} users
        </div>
        <EnhancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            goToPage(page)
            setCurrentPage(page)
          }}
          size="sm"
        />
      </div>
    </div>
  )
}

// Example 5: All pagination styles showcase
export function PaginationShowcase() {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Pagination Showcase</h2>
        <p className="text-muted-foreground mb-8">
          Different styles and configurations of the enhanced pagination component.
        </p>
      </div>

      <ProductsPaginationExample />
      
      <div className="border-t pt-8">
        <CompactPaginationExample />
      </div>

      <div className="border-t pt-8">
        <PillsPaginationExample />
      </div>

      <div className="border-t pt-8">
        <AdminTablePaginationExample />
      </div>
    </div>
  )
}