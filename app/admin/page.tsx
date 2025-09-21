'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Package, ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { EnhancedPagination } from '@/components/ui/enhanced-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/use-products';
import { useOrders } from '@/hooks/use-orders';
import { useAuthStore } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import { useAdminCategories } from '@/hooks/use-admin-categories';
import { apiClient } from '@/lib/api';
import { getCategoryName } from '@/lib/category-utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order-status-badge';
import { OrderItemsList } from '@/components/order-items-list';
import { SimpleProductForm } from '@/components/admin/simple-product-form';
import { EnhancedProductForm } from '@/components/admin/enhanced-product-form';
import { CategoryForm } from '@/components/admin/category-form';
import { CSVUpload } from '@/components/admin/csv-upload';

// TypeScript interfaces
interface ProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  ingredients: string[];
  isNewProduct: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  subcategories: string[];
  isActive: boolean;
}

interface StatusUpdateForm {
  status: string;
  paymentStatus: string;
  trackingNumber: string;
  carrier: string;
  notes: string;
  expectedDeliveryAt: string;
  shippedAt: string;
  deliveredAt: string;
  paymentAt: string;
  confirmedAt: string;
}

interface ServiceabilityForm {
  fromPincode: string;
  toPincode: string;
  weight: number;
  codAmount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasInitialized, isLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(200);
  const { products, loading: productsLoading, pagination } = useProducts({ 
    page: currentPage, 
    limit: productsPerPage,
    search: debouncedSearch || undefined // Use debounced search
  });
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const { orders, loading: ordersLoading } = useOrders({ limit: 20 });
  const { categories, loading: categoriesLoading } = useCategories();
  const { categories: adminCategories, loading: adminCategoriesLoading, refetch: refetchCategories } = useAdminCategories();
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    images: [''],
    category: '',
    subcategory: '',
    brand: '',
    stock: 0,
    rating: 0,
    reviewCount: 0,
    tags: [],
    features: [],
    ingredients: [],
    isNewProduct: false,
    isBestseller: false,
    isFeatured: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingProduct, setSavingProduct] = useState(false);
  
  // Order management state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
const [statusUpdateForm, setStatusUpdateForm] = useState<StatusUpdateForm>({
    status: '',
    paymentStatus: '',
    trackingNumber: '',
    carrier: '',
    notes: '',
    expectedDeliveryAt: '',
    shippedAt: '',
    deliveredAt: '',
    paymentAt: '',
    confirmedAt: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isServiceabilityOpen, setIsServiceabilityOpen] = useState(false);
  const [serviceabilityForm, setServiceabilityForm] = useState<ServiceabilityForm>({ fromPincode: '', toPincode: '', weight: 500, codAmount: 0 });
  const [serviceabilityResults, setServiceabilityResults] = useState<any[] | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'shiprocket' | 'delhivery'>('shiprocket');
  
  // Bulk delete state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Category management state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    image: '',
    subcategories: [],
    isActive: true
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [savingCategory, setSavingCategory] = useState(false);
  const [useEnhancedForm, setUseEnhancedForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);


  useEffect(() => {
    if (!hasInitialized) return; // wait until auth store is initialized
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth');
    }
  }, [hasInitialized, isAuthenticated, user, router]);

  // Remove client-side filtering since we're using server-side search
  const filteredProducts = products;
  
  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Bulk delete helper functions
  const handleSelectProduct = (productSlug: string) => {
    setSelectedProducts(prev => 
      prev.includes(productSlug) 
        ? prev.filter(slug => slug !== productSlug)
        : [...prev, productSlug]
    );
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedProducts([]);
      setIsSelectAll(false);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.slug));
      setIsSelectAll(true);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to delete');
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeletingBulk(true);
    try {
      const deletePromises = selectedProducts.map(slug => apiClient.deleteProduct(slug));
      await Promise.all(deletePromises);
      
      setSelectedProducts([]);
      setIsSelectAll(false);
      setIsBulkDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to delete some products. Please try again.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Update select all state when filtered products change
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setIsSelectAll(false);
    } else if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setIsSelectAll(true);
    } else {
      setIsSelectAll(false);
    }
  }, [selectedProducts.length, filteredProducts.length]);

  // Keyboard shortcut for select all (Ctrl+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'a' && !isProductOpen) {
        event.preventDefault();
        handleSelectAll();
      }
      // Delete selected products with Delete key
      if (event.key === 'Delete' && selectedProducts.length > 0 && !isProductOpen && !isBulkDeleteDialogOpen) {
        event.preventDefault();
        handleBulkDeleteClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedProducts.length, isProductOpen, isBulkDeleteDialogOpen]);

  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          <div className="text-sm text-gray-600">
            {!hasInitialized ? 'Initializing...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access the admin dashboard.</p>
          <button 
            onClick={() => router.push('/auth')}
            className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have admin privileges to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-rose-600">BeautyMart</Link>
              <Badge variant="secondary">Admin</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">View Store</Button>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your products, orders, and store settings</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 border shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Quick Insights</div>
              <div className="flex gap-6 text-xs">
                <div className="text-green-600">
                  <span className="font-medium">{orders.filter(o => o.createdAt && new Date(o.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</span> orders this week
                </div>
                <div className="text-blue-600">
                  <span className="font-medium">{products.filter(p => p.rating >= 4).length}</span> highly rated products
                </div>
                <div className="text-orange-600">
                  <span className="font-medium">{products.filter(p => p.stock <= 5 && p.stock > 0).length}</span> products need restocking
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border">
            <div className="text-2xl font-bold text-gray-900">
              {productsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                pagination?.totalItems || pagination?.total || products.length
              )}
            </div>
            <div className="text-gray-600">Total Products</div>
            <div className="text-xs text-gray-500 mt-1">
              {products.filter(p => p.stock <= 10).length} low stock
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <div className="text-2xl font-bold text-green-600">
              {ordersLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                orders.length
              )}
            </div>
            <div className="text-gray-600">Total Orders</div>
            <div className="text-xs text-gray-500 mt-1">
              {orders.filter(o => o.status === 'pending').length} pending
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <div className="text-2xl font-bold text-blue-600">
              {ordersLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                `₹${orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString('en-IN')}`
              )}
            </div>
            <div className="text-gray-600">Total Revenue</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: ₹{orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length).toLocaleString('en-IN') : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <div className="text-2xl font-bold text-purple-600">
              {categoriesLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                categories.length
              )}
            </div>
            <div className="text-gray-600">Categories</div>
            <div className="text-xs text-gray-500 mt-1">
              {categories.filter(c => c.isActive).length} active
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-lg font-semibold text-orange-600">
              {productsLoading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse w-8"></div>
              ) : (
                products.filter(p => p.stock === 0).length
              )}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-lg font-semibold text-blue-600">
              {productsLoading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse w-8"></div>
              ) : (
                products.filter(p => (p as any).isFeatured).length
              )}
            </div>
            <div className="text-sm text-gray-600">Featured Products</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-lg font-semibold text-green-600">
              {ordersLoading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse w-8"></div>
              ) : (
                orders.filter(o => o.status === 'delivered').length
              )}
            </div>
            <div className="text-sm text-gray-600">Completed Orders</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-lg font-semibold text-purple-600">
              {ordersLoading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse w-8"></div>
              ) : (
                orders.filter(o => o.status === 'shipped').length
              )}
            </div>
            <div className="text-sm text-gray-600">Shipped Orders</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-lg font-semibold text-indigo-600">
              {productsLoading ? (
                <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
              ) : (
                products.reduce((sum, p) => sum + (p.stock || 0), 0).toLocaleString('en-IN')
              )}
            </div>
            <div className="text-sm text-gray-600">Total Stock</div>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Products</h2>
                    {selectedProducts.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {selectedProducts.length} selected
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProducts([]);
                            setIsSelectAll(false);
                          }}
                          disabled={isDeletingBulk}
                        >
                          Clear Selection
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleBulkDeleteClick}
                          disabled={isDeletingBulk}
                          className="bg-red-600 hover:bg-red-700 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeletingBulk ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            `Delete ${selectedProducts.length} Product${selectedProducts.length !== 1 ? 's' : ''}`
                          )}
                        </Button>
                      </div>
                    )}
                    {filteredProducts.length > 0 && selectedProducts.length === 0 && (
                      <div className="text-xs text-gray-500">
                        Tip: Use Ctrl+A to select all products, Delete key to delete selected
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <select 
                        value={productsPerPage}
                        onChange={(e) => {
                          setProductsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors appearance-none pr-8"
                      >
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={200}>200 per page</option>
                        <option value={500}>500 per page</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronRight className="h-3 w-3 text-gray-400 transform rotate-90" />
                      </div>
                    </div>
                    <div className="relative w-64">
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-8 border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      {searchQuery !== debouncedSearch && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="bg-rose-600 hover:bg-rose-700 shadow-sm font-medium transition-all hover:shadow-md" 
                      onClick={() => {
                        setEditingSlug(null); 
                        setProductForm({ 
                          name: '', 
                          description: '', 
                          price: 0, 
                          originalPrice: undefined,
                          images: [''], 
                          category: '', 
                          subcategory: '', 
                          brand: '', 
                          stock: 0, 
                          rating: 0,
                          reviewCount: 0,
                          tags: [], 
                          features: [], 
                          ingredients: [], 
                          isNewProduct: false, 
                          isBestseller: false, 
                          isFeatured: false 
                        }); 
                        setIsProductOpen(true); 
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Pagination Info at Top */}
              {pagination && pagination.totalItems && pagination.totalItems > 0 && (
                <div className="bg-gray-50 border-x border-t rounded-t-lg px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900">
                      {((currentPage - 1) * productsPerPage) + 1}–{Math.min(currentPage * productsPerPage, pagination.totalItems || pagination.total)} of {pagination.totalItems || pagination.total}
                    </div>
                    {pagination.pages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-sm text-gray-600 min-w-[80px] text-center">
                          Page {currentPage} of {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                          disabled={currentPage === pagination.pages}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Products per page: {productsPerPage}
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                        disabled={filteredProducts.length === 0}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredProducts.map((product) => (
                    <TableRow key={product.id} className={selectedProducts.includes(product.slug) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.slug)}
                          onChange={() => handleSelectProduct(product.slug)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.brand}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryName(product, categories)}</Badge>
                      </TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            product.stock === 0 
                              ? 'text-red-600' 
                              : product.stock < 10 
                                ? 'text-orange-600' 
                                : product.stock < 20 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                          }`}>
                            {product.stock}
                          </span>
                          {product.stock === 0 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" title="Out of stock" />
                          )}
                          {product.stock > 0 && product.stock < 10 && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Low stock" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => { 
                              setEditingSlug(product.slug); 
                              setProductForm({
                                name: product.name,
                                description: product.description,
                                price: product.price,
                                originalPrice: product.originalPrice,
                                images: product.images || [''],
                                category: typeof product.category === 'object' ? product.category.id : product.category,
                                subcategory: product.subcategory || '',
                                brand: product.brand,
                                stock: product.stock,
                                rating: product.rating || 0,
                                reviewCount: product.reviewCount || 0,
                                tags: product.tags || [],
                                features: product.features || [],
                                ingredients: product.ingredients || [],
                                isNewProduct: (product as any).isNew || false,
                                isBestseller: (product as any).isBestseller || false,
                                isFeatured: (product as any).isFeatured || false
                              });
                              setIsProductOpen(true); 
                            }}
                            className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                            title="View product"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => { 
                              setEditingSlug(product.slug); 
                              setProductForm({
                                name: product.name,
                                description: product.description,
                                price: product.price,
                                originalPrice: product.originalPrice,
                                images: product.images || [''],
                                category: typeof product.category === 'object' ? product.category.id : product.category,
                                subcategory: product.subcategory || '',
                                brand: product.brand,
                                stock: product.stock,
                                rating: product.rating || 0,
                                reviewCount: product.reviewCount || 0,
                                tags: product.tags || [],
                                features: product.features || [],
                                ingredients: product.ingredients || [],
                                isNewProduct: (product as any).isNew || false,
                                isBestseller: (product as any).isBestseller || false,
                                isFeatured: (product as any).isFeatured || false
                              });
                              setIsProductOpen(true); 
                            }}
                            className="h-8 w-8 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={async () => { 
                              if (!confirm('Delete this product?')) return; 
                              await apiClient.deleteProduct(product.slug); 
                              router.refresh(); 
                            }}
                            className="h-8 w-8 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Enhanced Pagination Controls */}
              {pagination && pagination.totalItems && pagination.totalItems > 0 && (
                <div className="border-t bg-white shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4">
                    {/* Results Summary */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">
                          {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, pagination.totalItems || pagination.total)}
                        </span>
                        {' '}
                        of
                        {' '}
                        <span className="font-medium text-rose-600">{pagination.totalItems || pagination.total}</span>
                        {' '}
                        products
                      </div>
                    </div>

                    {/* Calculate correct total pages */}
                    {(() => {
                      const totalItems = pagination.totalItems || pagination.total || 0;
                      const correctTotalPages = Math.ceil(totalItems / productsPerPage);
                      
                      return (
                        <>
                          {/* Debug Info */}
                          <div className="text-xs text-gray-500 mb-2">
                            Debug: totalItems={totalItems}, perPage={productsPerPage}, correctPages={correctTotalPages}, backendPages={pagination.pages || 1}
                          </div>
                          
                          {/* Enhanced Pagination Component */}
                          <EnhancedPagination
                            currentPage={currentPage}
                            totalPages={correctTotalPages}
                            onPageChange={setCurrentPage}
                            size="sm"
                            showFirstLast={true}
                            maxPageNumbers={7}
                            className="[&>nav>ul]:gap-1 [&_button]:h-8 [&_a]:h-8"
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>{editingSlug ? 'Edit Product' : 'Add Product'}</DialogTitle>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Enhanced Form:</label>
                        <button
                          type="button"
                          onClick={() => setUseEnhancedForm(!useEnhancedForm)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                            useEnhancedForm ? 'bg-rose-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useEnhancedForm ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[80vh]">
                    {useEnhancedForm ? (
                      <EnhancedProductForm
                        initialData={productForm}
                        onSubmit={async (data) => {
                          setSavingProduct(true);
                          setFormErrors({});
                          
                          try {
                            // Client-side validation
                            const errors: Record<string, string> = {};
                            
                            if (!data.name || data.name.trim().length < 2) {
                              errors.name = 'Product name must be at least 2 characters';
                            }
                            
                            if (!data.description || data.description.trim().length < 10) {
                              errors.description = 'Description must be at least 10 characters';
                            }
                            
                            if (!data.price || data.price <= 0) {
                              errors.price = 'Price must be greater than 0';
                            }
                            
                            if (!data.category) {
                              errors.category = 'Please select a category';
                            }
                            
                            if (!data.brand || data.brand.trim().length === 0) {
                              errors.brand = 'Brand is required';
                            }
                            
                            if (data.stock === undefined || data.stock < 0) {
                              errors.stock = 'Stock must be 0 or greater';
                            }
                            
                            // Validate images
                            if (!data.images || data.images.length === 0 || !data.images[0]) {
                              errors.images = 'At least one image is required';
                            } else {
                              const validImages = data.images.filter((img) => img && img.trim() !== '');
                              if (validImages.length === 0) {
                                errors.images = 'At least one valid image is required';
                              } else {
                                // Validate image format (allow both URLs and local paths)
                                const invalidImages = validImages.filter((img) => {
                                  // Allow local upload paths (uploads/products/xxx or uploads/categories/xxx)
                                  const isLocalUpload = /^uploads\/(products|categories)\//.test(img);
                                  // Allow HTTP/HTTPS URLs
                                  const isValidUrl = /^https?:\/\/.+/i.test(img);
                                  return !isLocalUpload && !isValidUrl;
                                });
                                if (invalidImages.length > 0) {
                                  errors.images = 'Images must be either uploaded files or valid URLs starting with http:// or https://';
                                }
                              }
                            }
                            
                            if (Object.keys(errors).length > 0) {
                              setFormErrors(errors);
                              return;
                            }
                            
                            // Clean up arrays - remove empty strings and prepare data for API
                            const cleanedForm = {
                              name: data.name,
                              description: data.description,
                              price: data.price,
                              originalPrice: data.originalPrice,
                              images: data.images.filter((img: string) => img && img.trim() !== ''),
                              category: data.category,
                              subcategory: data.subcategory,
                              brand: data.brand,
                              stock: data.stock,
                              rating: data.rating || 0,
                              reviewCount: data.reviewCount || 0,
                              tags: data.tags?.filter((tag: string) => tag && tag.trim() !== '') || [],
                              features: data.features?.filter((feature: string) => feature && feature.trim() !== '') || [],
                              ingredients: data.ingredients?.filter((ingredient: string) => ingredient && ingredient.trim() !== '') || [],
                              isNewProduct: data.isNewProduct,
                              isBestseller: data.isBestseller,
                              isFeatured: data.isFeatured,
                              // Enhanced fields - only include if they have values
                              ...(data.sku && { sku: data.sku }),
                              ...(data.barcode && { barcode: data.barcode }),
                              ...(data.color && { color: data.color }),
                              ...(data.size && { size: data.size }),
                              ...(data.material && { material: data.material }),
                              ...(data.scent && { scent: data.scent }),
                              ...(data.gender && { gender: data.gender }),
                              ...(data.ageGroup && { ageGroup: data.ageGroup }),
                              ...(data.manufacturer && { manufacturer: data.manufacturer }),
                              ...(data.countryOfOrigin && { countryOfOrigin: data.countryOfOrigin }),
                              ...(data.weight && (data.weight.value || data.weight.unit) && { weight: data.weight }),
                              ...(data.dimensions && (data.dimensions.length || data.dimensions.width || data.dimensions.height) && { dimensions: data.dimensions }),
                              ...(data.allergens && data.allergens.length > 0 && { allergens: data.allergens.filter((allergen: string) => allergen && allergen.trim() !== '') }),
                              ...(data.dietaryInfo && data.dietaryInfo.length > 0 && { dietaryInfo: data.dietaryInfo.filter((info: string) => info && info.trim() !== '') }),
                              ...(data.skinType && data.skinType.length > 0 && { skinType: data.skinType.filter((type: string) => type && type.trim() !== '') }),
                              ...(data.hairType && data.hairType.length > 0 && { hairType: data.hairType.filter((type: string) => type && type.trim() !== '') }),
                              ...(data.careInstructions && data.careInstructions.length > 0 && { careInstructions: data.careInstructions.filter((instruction: string) => instruction && instruction.trim() !== '') }),
                              ...(data.certifications && data.certifications.length > 0 && { certifications: data.certifications.filter((cert: string) => cert && cert.trim() !== '') }),
                              ...(data.keywords && data.keywords.length > 0 && { keywords: data.keywords.filter((keyword: string) => keyword && keyword.trim() !== '') }),
                              ...(data.variants && data.variants.length > 0 && { variants: data.variants }),
                              ...(data.nutritionalInfo && Object.keys(data.nutritionalInfo).some(key => data.nutritionalInfo![key as keyof typeof data.nutritionalInfo] !== undefined) && { nutritionalInfo: data.nutritionalInfo }),
                              ...(data.technicalSpecs && (data.technicalSpecs.model || data.technicalSpecs.powerRequirements || data.technicalSpecs.warranty) && { technicalSpecs: data.technicalSpecs }),
                              ...(data.spf && { spf: data.spf }),
                              ...(data.season && { season: data.season }),
                              ...(data.minOrderQuantity && { minOrderQuantity: data.minOrderQuantity }),
                              ...(data.maxOrderQuantity && { maxOrderQuantity: data.maxOrderQuantity }),
                              ...(data.metaTitle && { metaTitle: data.metaTitle }),
                              ...(data.metaDescription && { metaDescription: data.metaDescription })
                            };
                            
                            if (editingSlug) {
                              const result = await apiClient.updateProduct(editingSlug, cleanedForm);
                            } else {
                              const result = await apiClient.createProduct(cleanedForm);
                              if (!result.success) {
                                alert(`Failed to create product: ${result.message || 'Unknown error'}`);
                                return;
                              }
                            }
                            
                            setIsProductOpen(false);
                            setFormErrors({});
                            router.refresh();
                        } catch (error) {
                          alert(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                            setSavingProduct(false);
                          }
                        }}
                        onCancel={() => {
                          setIsProductOpen(false);
                          setFormErrors({});
                        }}
                        isLoading={savingProduct}
                        errors={formErrors}
                      />
                    ) : (
                      <SimpleProductForm
                      initialData={productForm}
                      onSubmit={async (data) => {
                        setSavingProduct(true);
                        setFormErrors({});
                        
                        try {
                          
                          // Client-side validation
                          const errors: Record<string, string> = {};
                          
                          if (!data.name || data.name.trim().length < 2) {
                            errors.name = 'Product name must be at least 2 characters';
                          }
                          
                          if (!data.description || data.description.trim().length < 10) {
                            errors.description = 'Description must be at least 10 characters';
                          }
                          
                          if (!data.price || data.price <= 0) {
                            errors.price = 'Price must be greater than 0';
                          }
                          
                          if (!data.category) {
                            errors.category = 'Please select a category';
                          }
                          
                          if (!data.brand || data.brand.trim().length === 0) {
                            errors.brand = 'Brand is required';
                          }
                          
                          if (data.stock === undefined || data.stock < 0) {
                            errors.stock = 'Stock must be 0 or greater';
                          }
                          
                          // Validate images
                          if (!data.images || data.images.length === 0 || !data.images[0]) {
                            errors.images = 'At least one image is required';
                          } else {
                            const validImages = data.images.filter((img) => img && img.trim() !== '');
                            if (validImages.length === 0) {
                              errors.images = 'At least one valid image is required';
                            } else {
                              // Validate image format (allow both URLs and local paths)
                              const invalidImages = validImages.filter((img) => {
                                // Allow local upload paths (uploads/products/xxx or uploads/categories/xxx)
                                const isLocalUpload = /^uploads\/(products|categories)\//.test(img);
                                // Allow HTTP/HTTPS URLs
                                const isValidUrl = /^https?:\/\/.+/i.test(img);
                                return !isLocalUpload && !isValidUrl;
                              });
                              if (invalidImages.length > 0) {
                                errors.images = 'Images must be either uploaded files or valid URLs starting with http:// or https://';
                              }
                            }
                          }
                          
                          if (Object.keys(errors).length > 0) {
                            setFormErrors(errors);
                            return;
                          }
                          
                          // Clean up arrays - remove empty strings and prepare data
                          const cleanedForm = {
                            ...data,
                            images: data.images.filter((img: string) => img && img.trim() !== '') || [''],
                            tags: data.tags?.filter((tag: string) => tag && tag.trim() !== '') || [],
                            features: data.features?.filter((feature: string) => feature && feature.trim() !== '') || [],
                            ingredients: data.ingredients?.filter((ingredient: string) => ingredient && ingredient.trim() !== '') || [],
                            allergens: data.allergens?.filter((allergen: string) => allergen && allergen.trim() !== '') || [],
                            dietaryInfo: data.dietaryInfo?.filter((info: string) => info && info.trim() !== '') || [],
                            skinType: data.skinType?.filter((type: string) => type && type.trim() !== '') || [],
                            hairType: data.hairType?.filter((type: string) => type && type.trim() !== '') || [],
                            careInstructions: data.careInstructions?.filter((instruction: string) => instruction && instruction.trim() !== '') || [],
                            certifications: data.certifications?.filter((cert: string) => cert && cert.trim() !== '') || [],
                            keywords: data.keywords?.filter((keyword: string) => keyword && keyword.trim() !== '') || []
                          };
                          
                          if (editingSlug) {
                            const result = await apiClient.updateProduct(editingSlug, cleanedForm);
                          } else {
                            const result = await apiClient.createProduct(cleanedForm);
                            if (!result.success) {
                              alert(`Failed to create product: ${result.message || 'Unknown error'}`);
                              return;
                            }
                          }
                          
                          setIsProductOpen(false);
                          setFormErrors({});
                          router.refresh();
                        } catch (error) {
                          alert(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setSavingProduct(false);
                        }
                      }}
                      onCancel={() => {
                        setIsProductOpen(false);
                        setFormErrors({});
                      }}
                      isLoading={savingProduct}
                      errors={formErrors}
                    />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <CSVUpload
                  onSuccess={(result) => {
                    // Refresh the products list
                    router.refresh();
                  }}
                  onError={(error) => {
                    // Error handled by CSV component
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Categories</h2>
                    <p className="text-gray-600 text-sm">Manage product categories and subcategories</p>
                  </div>
                  <Button 
                    className="bg-rose-600 hover:bg-rose-700" 
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({
                        name: '',
                        slug: '',
                        description: '',
                        image: '',
                        subcategories: [],
                        isActive: true
                      });
                      setIsCategoryOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Subcategories</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminCategoriesLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    adminCategories.map((category) => {
                      const categoryProducts = products.filter(p => 
                        (typeof p.category === 'object' ? p.category.id : p.category) === category.id
                      );
                      
                      return (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {category.image && (
                                <img 
                                  src={category.image} 
                                  alt={category.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-gray-600">{category.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-600 truncate">
                                {category.description || 'No description'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {category.subcategories && category.subcategories.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {category.subcategories.slice(0, 3).map((sub: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {sub}
                                    </Badge>
                                  ))}
                                  {category.subcategories.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{category.subcategories.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <span className="font-medium">{categoryProducts.length}</span>
                              <div className="text-xs text-gray-500">products</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={category.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => {
                                  setEditingCategoryId(category.id);
                                  setCategoryForm({
                                    name: category.name,
                                    slug: category.slug,
                                    description: category.description || '',
                                    image: category.image || '',
                                    subcategories: category.subcategories || [],
                                    isActive: category.isActive
                                  });
                                  setIsCategoryOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={async () => {
                                  if (!confirm(`Delete category "${category.name}"? This will affect all products in this category.`)) return;
                                  
                                  try {
                                    await apiClient.deleteCategory(category.id);
                                    refetchCategories(); // Refresh admin categories
                                    router.refresh();
                                  } catch (error) {
                                    alert('Failed to delete category');
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Category Form Dialog */}
            <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{editingCategoryId ? 'Edit Category' : 'Add Category'}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[80vh]">
                  <CategoryForm
                    initialData={categoryForm}
                    onSubmit={async (data) => {
                      setSavingCategory(true);
                      setCategoryFormErrors({});
                      
                      try {
                        // Client-side validation
                        const errors: Record<string, string> = {};
                        
                        if (!data.name || data.name.trim().length < 2) {
                          errors.name = 'Category name must be at least 2 characters';
                        }
                        
                        if (!data.slug || data.slug.trim().length < 2) {
                          errors.slug = 'Slug must be at least 2 characters';
                        }
                        
                        if (Object.keys(errors).length > 0) {
                          setCategoryFormErrors(errors);
                          return;
                        }
                        
                        // Add timestamp to slug to ensure uniqueness only for new categories
                        const finalForm = {
                          ...data,
                          slug: editingCategoryId ? data.slug : data.slug + '-' + Date.now().toString().slice(-6)
                        };
                        
                        if (editingCategoryId) {
                          // Update existing category
                          await apiClient.updateCategory(editingCategoryId, finalForm);
                        } else {
                          // Create new category
                          await apiClient.createCategory(finalForm);
                        }
                        
                        setIsCategoryOpen(false);
                        setCategoryFormErrors({});
                        refetchCategories(); // Refresh admin categories
                        router.refresh();
                      } catch (error) {
                        alert(`Error saving category: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setSavingCategory(false);
                      }
                    }}
                    onCancel={() => {
                      setIsCategoryOpen(false);
                      setCategoryFormErrors({});
                    }}
                    isLoading={savingCategory}
                    errors={categoryFormErrors}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold">Order Management</h2>
                  <div className="flex gap-3">
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onChange={(e) => {
                        // Filter orders by status
                        const status = e.target.value;
                        // This would trigger a refetch with status filter
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select 
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as 'shiprocket' | 'delhivery')}
                    >
                      <option value="shiprocket">🚀 Shiprocket (Primary)</option>
                      <option value="delhivery">📦 Delhivery</option>
                    </select>
                    <Input
                      placeholder="Search orders..."
                      className="w-64"
                    />
                    <Button variant="outline" onClick={() => setIsServiceabilityOpen(true)}>Check Serviceability</Button>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.shippingAddress?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-600">{order.shippingAddress?.phone || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.length} item(s)
                          <div className="text-gray-600">
                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{order.total}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              // Open order details modal
                              setSelectedOrder(order);
                              setIsOrderDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              // Open status update modal with prefilled dates
                              setSelectedOrder(order);
setStatusUpdateForm({
                                status: order.status || '',
                                paymentStatus: order.paymentStatus || '',
                                trackingNumber: (order as any).trackingNumber || '',
                                carrier: (order as any).carrier || '',
                                notes: '',
                                expectedDeliveryAt: (order as any).expectedDeliveryAt ? new Date((order as any).expectedDeliveryAt).toISOString().slice(0,10) : '',
                                shippedAt: (order as any).shippedAt ? new Date((order as any).shippedAt).toISOString().slice(0,10) : '',
                                deliveredAt: (order as any).deliveredAt ? new Date((order as any).deliveredAt).toISOString().slice(0,10) : '',
                                paymentAt: (order as any).paymentAt ? new Date((order as any).paymentAt).toISOString().slice(0,10) : '',
                                confirmedAt: (order as any).confirmedAt ? new Date((order as any).confirmedAt).toISOString().slice(0,10) : ''
                              });
                              setIsStatusUpdateOpen(true);
                            }}
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                          <Button 
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={async () => {
                              try {
                                const idOrNumber = order.id || order.orderNumber;
                                const res = await apiClient.createShipment(idOrNumber, selectedProvider);
                                if (res.success) {
                                  router.refresh();
                                }
                              } catch (e) {
                                // Shipment creation failed
                              }
                            }}
                            title="Create Shiprocket Shipment"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            {selectedProvider === 'shiprocket' ? '🚀 Shiprocket' : '📦 Delhivery'}
                          </Button>
                          <Button 
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              if (!confirm('Delete this order? This cannot be undone.')) return;
                              try {
                                await apiClient.deleteOrder(order.id);
                                router.refresh();
                              } catch (err) {
                                // Order deletion failed
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Top Categories</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Makeup</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full w-[45%]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Skincare</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-[35%]"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Monthly Growth</h3>
                  <div className="text-3xl font-bold text-green-600">+23%</div>
                  <p className="text-sm text-gray-600">vs. last month</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Modal */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Name:</strong> {selectedOrder.shippingAddress?.name}</p>
                      <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}</p>
                      <p><strong>Email:</strong> {selectedOrder.shippingAddress?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{selectedOrder.shippingAddress?.address}</p>
                      <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                      <p>{selectedOrder.shippingAddress?.pincode}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Order Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Order Number:</span>
                        <span className="font-mono">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Date:</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedOrder.paymentAt && (
                        <div className="flex justify-between">
                          <span>Payment Date:</span>
                          <span>{new Date(selectedOrder.paymentAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedOrder.confirmedAt && (
                        <div className="flex justify-between">
                          <span>Confirmed Date:</span>
                          <span>{new Date(selectedOrder.confirmedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedOrder.shippedAt && (
                        <div className="flex justify-between">
                          <span>Shipped Date:</span>
                          <span>{new Date(selectedOrder.shippedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedOrder.deliveredAt && (
                        <div className="flex justify-between">
                          <span>Delivered Date:</span>
                          <span>{new Date(selectedOrder.deliveredAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedOrder.expectedDeliveryAt && (
                        <div className="flex justify-between">
                          <span>Expected Delivery:</span>
                          <span>{new Date(selectedOrder.expectedDeliveryAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <OrderStatusBadge status={selectedOrder.status} />
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-4">Order Items</h3>
                <OrderItemsList items={selectedOrder.items} />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>₹{selectedOrder.shipping}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
{selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Order Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    value={statusUpdateForm.status}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    value={statusUpdateForm.paymentStatus}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, paymentStatus: e.target.value })}
                  >
                    <option value="">Select Payment Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              
              {statusUpdateForm.status === 'shipped' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Tracking Number</label>
                    <Input
                      placeholder="Enter tracking number"
                      value={statusUpdateForm.trackingNumber}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, trackingNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Carrier</label>
                    <Input
                      placeholder="e.g., Blue Dart, DTDC, etc."
                      value={statusUpdateForm.carrier}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, carrier: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Expected Delivery Date</label>
                  <Input
                    type="date"
                    value={statusUpdateForm.expectedDeliveryAt}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, expectedDeliveryAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shipped Date</label>
                  <Input
                    type="date"
                    value={statusUpdateForm.shippedAt}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, shippedAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Delivered Date</label>
                  <Input
                    type="date"
                    value={statusUpdateForm.deliveredAt}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, deliveredAt: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                  placeholder="Add any notes about this status update..."
                  value={statusUpdateForm.notes}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, notes: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Payment Date</label>
                  <Input
                    type="date"
                    value={statusUpdateForm.paymentAt}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, paymentAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirmed Date</label>
                  <Input
                    type="date"
                    value={statusUpdateForm.confirmedAt}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, confirmedAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsStatusUpdateOpen(false);
setStatusUpdateForm({ status: '', paymentStatus: '', trackingNumber: '', carrier: '', notes: '', expectedDeliveryAt: '', shippedAt: '', deliveredAt: '', paymentAt: '', confirmedAt: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!statusUpdateForm.status) return;
                
                setUpdatingStatus(true);
                try {
await apiClient.updateOrder(selectedOrder.id, ({
                    status: statusUpdateForm.status,
                    paymentStatus: statusUpdateForm.paymentStatus || undefined,
                    trackingNumber: statusUpdateForm.trackingNumber,
                    carrier: statusUpdateForm.carrier,
                    expectedDeliveryAt: statusUpdateForm.expectedDeliveryAt || undefined,
                    shippedAt: statusUpdateForm.shippedAt || undefined,
                    deliveredAt: statusUpdateForm.deliveredAt || undefined,
                    paymentAt: statusUpdateForm.paymentAt || undefined,
                    confirmedAt: statusUpdateForm.confirmedAt || undefined
                  } as any));
                  setIsStatusUpdateOpen(false);
setStatusUpdateForm({ status: '', paymentStatus: '', trackingNumber: '', carrier: '', notes: '', expectedDeliveryAt: '', shippedAt: '', deliveredAt: '', paymentAt: '', confirmedAt: '' });
                  router.refresh();
                } catch (error) {
                  // Order status update failed
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              disabled={!statusUpdateForm.status || updatingStatus}
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Serviceability Check Modal */}
      <Dialog open={isServiceabilityOpen} onOpenChange={setIsServiceabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Serviceability</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">From Pincode</label>
              <Input
                placeholder="Warehouse pincode"
                value={serviceabilityForm.fromPincode}
                onChange={(e) => setServiceabilityForm({ ...serviceabilityForm, fromPincode: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Pincode</label>
              <Input
                placeholder="Customer pincode"
                value={serviceabilityForm.toPincode}
                onChange={(e) => setServiceabilityForm({ ...serviceabilityForm, toPincode: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Weight (grams)</label>
              <Input
                type="number"
                value={serviceabilityForm.weight}
                onChange={(e) => setServiceabilityForm({ ...serviceabilityForm, weight: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">COD Amount (optional)</label>
              <Input
                type="number"
                value={serviceabilityForm.codAmount}
                onChange={(e) => setServiceabilityForm({ ...serviceabilityForm, codAmount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="pt-4">
            {serviceabilityResults && (
              <div className="space-y-2">
                {serviceabilityResults.map((r, idx) => (
                  <div key={idx} className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{r.provider}</div>
                      <div className="text-sm text-gray-600">Estimated Days: {r.estimatedDays} • Cost: ₹{r.shippingCost}</div>
                    </div>
                    <Badge className={r.serviceable ? 'bg-green-500' : 'bg-red-500'}>
                      {r.serviceable ? 'Serviceable' : 'Not Serviceable'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceabilityOpen(false)}>Close</Button>
            <Button onClick={async () => {
              setCheckingServiceability(true);
              try {
                const res = await apiClient.checkServiceability(serviceabilityForm as any);
                if (res.success) setServiceabilityResults(res.data);
              } finally {
                setCheckingServiceability(false);
              }
            }} disabled={checkingServiceability}>
              {checkingServiceability ? 'Checking...' : 'Check'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedProducts.length}</strong> product(s)? 
              This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Products to be deleted:</h4>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-sm text-red-700 space-y-1">
                  {selectedProducts.map((slug) => {
                    const product = filteredProducts.find(p => p.slug === slug);
                    return (
                      <li key={slug} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                        <span className="truncate">{product?.name || slug}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isDeletingBulk}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDeleteConfirm}
              disabled={isDeletingBulk}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingBulk ? 'Deleting...' : `Delete ${selectedProducts.length} Product(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
