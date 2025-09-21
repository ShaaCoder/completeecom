# Enhanced Pagination Component

A modern, accessible, and feature-rich pagination component built with React, TypeScript, and Tailwind CSS.

## Features

✅ **Smart page numbering** - Intelligently shows/hides page numbers with ellipsis  
✅ **Multiple variants** - Default, compact, and pills styles  
✅ **Responsive design** - Mobile-friendly with adaptive layouts  
✅ **Accessibility** - ARIA labels and keyboard navigation support  
✅ **Smooth animations** - Hover effects and scale transitions  
✅ **TypeScript** - Full type safety and IntelliSense support  
✅ **Customizable** - Size, variant, and styling options  
✅ **Built-in hook** - `usePagination` hook for state management  

## Quick Start

### Basic Usage

```tsx
import { EnhancedPagination, usePagination } from "@/components/ui/enhanced-pagination"

function MyComponent() {
  const { currentPage, totalPages, goToPage } = usePagination({
    totalItems: 100,
    itemsPerPage: 10,
    initialPage: 1,
  })

  return (
    <EnhancedPagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={goToPage}
    />
  )
}
```

### With Custom Styling

```tsx
<EnhancedPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={goToPage}
  variant="pills"           // 'default' | 'compact' | 'pills'
  size="lg"                // 'sm' | 'default' | 'lg'
  showFirstLast={true}     // Show first/last buttons
  showPageInfo={true}      // Show "Page X of Y" info
  maxPageNumbers={7}       // Max page numbers to show
  className="my-4"         // Additional styling
/>
```

## API Reference

### EnhancedPagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | - | Current active page (1-indexed) |
| `totalPages` | `number` | - | Total number of pages |
| `onPageChange` | `(page: number) => void` | - | Callback when page changes |
| `showFirstLast` | `boolean` | `true` | Show first/last navigation buttons |
| `showPageNumbers` | `boolean` | `true` | Show individual page numbers |
| `maxPageNumbers` | `number` | `7` | Maximum page numbers to display |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size of pagination buttons |
| `variant` | `'default' \| 'compact' \| 'pills'` | `'default'` | Visual style variant |
| `showPageInfo` | `boolean` | `false` | Show "Page X of Y" text |
| `disabled` | `boolean` | `false` | Disable all interactions |
| `className` | `string` | - | Additional CSS classes |

### usePagination Hook

```tsx
const {
  currentPage,     // Current page number
  totalPages,      // Total pages calculated
  startIndex,      // Start index for current page items
  endIndex,        // End index for current page items
  goToPage,        // Function to go to specific page
  goToNext,        // Function to go to next page
  goToPrevious,    // Function to go to previous page
  hasNext,         // Boolean if has next page
  hasPrevious,     // Boolean if has previous page
} = usePagination({
  totalItems: 100,      // Total number of items
  itemsPerPage: 10,     // Items per page
  initialPage: 1,       // Starting page (optional)
})
```

## Style Variants

### Default
Standard pagination with rounded corners and outline active state.

### Compact
Tighter spacing, smaller buttons, perfect for mobile or dense layouts.

### Pills
Fully rounded buttons with more spacing, modern pill-like appearance.

## Usage Examples

### 1. Product Listing

```tsx
function ProductList({ products }: { products: Product[] }) {
  const { currentPage, totalPages, startIndex, endIndex, goToPage } = usePagination({
    totalItems: products.length,
    itemsPerPage: 12,
  })

  const currentProducts = products.slice(startIndex, endIndex)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {currentProducts.map(product => (
          <ProductCard key={product.id} product={product} />
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
```

### 2. Admin Table

```tsx
function UserTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const { data: users, total } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
  })

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Users</h2>
        <select 
          value={itemsPerPage} 
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <table>
        {/* Table content */}
      </table>

      <EnhancedPagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / itemsPerPage)}
        onPageChange={setCurrentPage}
        size="sm"
      />
    </div>
  )
}
```

### 3. Mobile-First Design

```tsx
<EnhancedPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={goToPage}
  variant="compact"
  size="sm"
  maxPageNumbers={3}  // Fewer pages on mobile
  showFirstLast={false}  // Save space
  className="sm:hidden"  // Show only on mobile
/>

{/* Desktop version */}
<EnhancedPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={goToPage}
  className="hidden sm:flex"
/>
```

## Styling & Theming

The component uses Tailwind CSS and follows your existing design system. It automatically adapts to:

- **Dark/Light mode** via CSS variables
- **Color scheme** from your Tailwind config
- **Spacing** and typography scales
- **Border radius** settings

### Custom Styling

```tsx
// Add custom classes
<EnhancedPagination
  className="[&>nav]:bg-white [&>nav]:shadow-lg [&>nav]:rounded-xl p-4"
  // ... other props
/>

// Or wrap in a styled container
<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
  <EnhancedPagination {...props} />
</div>
```

## Accessibility

The component includes:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader friendly text
- ✅ Focus management
- ✅ Semantic HTML structure

## Performance Tips

1. **Memoize handlers** when using with large datasets:
   ```tsx
   const handlePageChange = useCallback((page: number) => {
     setCurrentPage(page)
   }, [])
   ```

2. **Virtualization** for very large lists:
   ```tsx
   // Consider using react-window or similar for 1000+ items
   ```

3. **Server-side pagination** for database queries:
   ```tsx
   // Use page/limit parameters in API calls
   const { data } = useQuery(['users', currentPage, itemsPerPage], ...)
   ```

## Demo

Visit `/pagination-demo` to see all variants and examples in action.

## Troubleshooting

### Common Issues

**Buttons not clickable**: Ensure `onPageChange` is provided and not causing re-renders.

**Styling not applied**: Check that Tailwind CSS is properly configured and classes aren't being purged.

**TypeScript errors**: Ensure you're using the correct prop types and have the latest version.

**Performance issues**: Use `useCallback` for event handlers and consider memoizing heavy computations.

## Migration from Basic Pagination

If you're currently using the basic `Pagination` components:

```tsx
// Before
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="?page=1" />
    </PaginationItem>
    {/* Manual page number rendering */}
  </PaginationContent>
</Pagination>

// After  
<EnhancedPagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>
```

The enhanced version handles all the logic automatically!