'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CartCounter } from '@/components/ui/cart-counter';
import { AuthWrapper } from '@/components/ui/auth-wrapper';
import { useAuthStore } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { data: session, status } = useSession();
  const { categories, loading: categoriesLoading } = useCategories();

  // Check authentication - either NextAuth session or existing auth store
  const isUserAuthenticated = isAuthenticated || !!session;
  const currentUser = session?.user || user;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      // Use the store's logout to clear NextAuth session, backend session, and local state
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      // Force a full page reload to ensure all client state is reset
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/');
        router.refresh();
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      {/* Top bar */}
      <div className="border-b bg-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-rose-700">Free shipping on orders above ₹999</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/customer-care" className="text-gray-600 hover:text-rose-600 transition-colors">
                Customer Care
              </Link>
              <Link href="/track-order" className="text-gray-600 hover:text-rose-600 transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-rose-600">BeautyMart</span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="Search for products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-full border-gray-200 focus:border-rose-500 focus:ring-rose-500"
              />
            </form>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="w-5 h-5" />
            </Button>
            
            <AuthWrapper 
              fallback={
                <Link href="/auth/login">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              }
            >
              {isUserAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/profile?tab=orders')}>
                      My Orders
                    </DropdownMenuItem>
                    {currentUser?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </AuthWrapper>

            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="w-5 h-5" />
                <CartCounter className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search bar - mobile */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Search for products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full"
            />
          </form>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center space-x-8 h-12">
            {categoriesLoading ? (
              // Loading skeleton for categories
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              ))
            ) : (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                >
                  {category.name}
                </Link>
              ))
            )}
            <Link href="/brands" className="text-gray-700 hover:text-rose-600 transition-colors font-medium">
              Brands
            </Link>
            <Link href="/offers" className="text-rose-600 font-medium">
              Offers
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              {categoriesLoading ? (
                // Loading skeleton for mobile categories
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                ))
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="block text-gray-700 hover:text-rose-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))
              )}
              <Link
                href="/brands"
                className="block text-gray-700 hover:text-rose-600 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </Link>
              <Link
                href="/offers"
                className="block text-rose-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Offers
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}