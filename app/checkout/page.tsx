export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckoutPageClient } from '@/components/checkout-page-client';

export default function CheckoutPage() {
  return (
    <div>
      <Header />
      <CheckoutPageClient />
      <Footer />
    </div>
  );
}