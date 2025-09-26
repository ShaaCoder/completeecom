import { HeroBanner } from '@/components/hero-banner';
import { CategoryShowcase } from '@/components/category-showcase';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const FeaturedProducts = dynamic(() => import('@/components/featured-products'), {
  ssr: false,
  loading: () => (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="h-6 bg-gray-200 w-48 mx-auto mb-4 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
});

export default function Home() {
  return (
    <main>
      <Header />
      <HeroBanner />
      <CategoryShowcase />
      <FeaturedProducts />
      <Footer />
    </main>
  );
}
