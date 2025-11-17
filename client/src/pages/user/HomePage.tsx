import React, { useEffect, useState } from 'react';
import ProductCard from '../../components/ui/ProductCard';
import type { Product, Bid } from '../../types/product';

const generateMockProduct = (id: string, basePrice: number, bids: number, timeToEndHours: number): Product => {
  const now = Date.now();
  const startTime = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
  const endTime = new Date(now + timeToEndHours * 60 * 60 * 1000).toISOString();

  const mockBidders: Bid[] = Array.from({ length: bids }).map((_, index) => ({
    _id: `bid-${id}-${index}`,
    bidder: {
      _id: `bidder${index}`,
      name: `Bidder ${index + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
    },
    price: basePrice + index * 100000,
    time: new Date().toISOString(),
  }));

  return {
    _id: `prod${id}`,
    name: `Product Name ${id}`,
    description: `Description for product ${id}. This is a very interesting item.`,
    images: ['https://via.placeholder.com/250x200.png?text=Product+Image'],
    startingPrice: basePrice,
    currentPrice: mockBidders.length > 0 ? mockBidders[mockBidders.length - 1].price : basePrice,
    buyNowPrice: basePrice * 1.5,
    bidders: mockBidders,
    seller: {
      _id: 'seller1',
      name: 'Auction Seller',
      rating: 4.8,
    },
    category: { _id: 'cat1', name: 'Electronics' },
    startTime: startTime,
    endTime: endTime,
  };
};

const allMockProducts: Product[] = [
  // Ending Soon
  generateMockProduct('A1', 100_000_000, 5, 2),
  generateMockProduct('A2', 200_000_000, 7, 5),
  generateMockProduct('A3', 50_000_000, 3, 1),
  generateMockProduct('A4', 300_000_000, 8, 10),
  generateMockProduct('A5', 150_000_000, 6, 24),

  // Most Bid-On
  generateMockProduct('B1', 120_000_000, 15, 48),
  generateMockProduct('B2', 80_000_000, 12, 72),
  generateMockProduct('B3', 250_000_000, 20, 36),
  generateMockProduct('B4', 90_000_000, 10, 60),
  generateMockProduct('B5', 180_000_000, 18, 96),

  // Highest Priced
  generateMockProduct('C1', 500_000_000, 8, 12),
  generateMockProduct('C2', 700_000_000, 6, 72),
  generateMockProduct('C3', 600_000_000, 10, 24),
  generateMockProduct('C4', 400_000_000, 7, 48),
  generateMockProduct('C5', 800_000_000, 5, 96),
];

const getTopProducts = (
  products: Product[],
  type: 'endingSoon' | 'mostBidOn' | 'highestPriced',
  limit: number = 5
): Product[] => {
  let sortedProducts = [...products];
  if (type === 'endingSoon') {
    sortedProducts = sortedProducts
      .filter((p) => new Date(p.endTime).getTime() > Date.now())
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
  } else if (type === 'mostBidOn') {
    sortedProducts = sortedProducts.sort((a, b) => b.bidders.length - a.bidders.length);
  } else if (type === 'highestPriced') {
    sortedProducts = sortedProducts.sort((a, b) => b.currentPrice - a.currentPrice);
  }
  return sortedProducts.slice(0, limit);
};

const HomePage: React.FC = () => {
  const [topEndingSoon, setTopEndingSoon] = useState<Product[]>([]);
  const [topMostBidOn, setTopMostBidOn] = useState<Product[]>([]); // <<< SỬA LỖI: Thêm dấu '='
  const [topHighestPriced, setTopHighestPriced] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const endingSoon = getTopProducts(allMockProducts, 'endingSoon');
        const mostBidOn = getTopProducts(allMockProducts, 'mostBidOn');
        const highestPriced = getTopProducts(allMockProducts, 'highestPriced');
        setTopEndingSoon(endingSoon);
        setTopMostBidOn(mostBidOn);
        setTopHighestPriced(highestPriced);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <div className='text-center py-16 text-xl text-gray-700'>Loading exciting auctions...</div>;
  }
  if (error) {
    return <div className='text-center py-16 text-xl text-red-600'>Error: {error}</div>;
  }

  return (
    <div className='homepage-container py-8'>
      <section className='mb-12'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center md:text-left'>Top 5 Products Ending Soon</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
          {topEndingSoon.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className='mb-12'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center md:text-left'>Top 5 Most Bid-On Products</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
          {topMostBidOn.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className='mb-12'>
        <h2 className='text-3xl font-bold text-gray-800 mb-6 text-center md:text-left'>
          Top 5 Highest Priced Products
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
          {topHighestPriced.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
