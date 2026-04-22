import HeroBanner       from '@/components/storefront/HeroBanner';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import LatestProducts   from '@/components/storefront/LatestProducts';
import PromoStrip       from '@/components/storefront/PromoStrip';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <PromoStrip />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        <FeaturedProducts />
        <LatestProducts />
      </div>
    </>
  );
}
