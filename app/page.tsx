import { HeroBanner } from '@/components/hero-banner';
import { CategoryShowcase } from '@/components/category-showcase';
import { FeaturedProducts } from '@/components/featured-products';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

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
