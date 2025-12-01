import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "@components/product/ProductCard";
import type { Product } from "@interfaces/product";
//import { allMockProducts, getTopProducts } from "@utils/product";
import { productApi } from "@services/product.api"; // Đổi import này
import Spinner from "@components/ui/Spinner";

const HomePage: React.FC = () => {
  const [topEndingSoon, setTopEndingSoon] = useState<Product[]>([]);
  const [topMostBidOn, setTopMostBidOn] = useState<Product[]>([]);
  const [topHighestPriced, setTopHighestPriced] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);

        const data = await productApi.fetchHomeData();

        setTopEndingSoon(data.endingSoon);
        setTopMostBidOn(data.mostBids);
        setTopHighestPriced(data.highestPrice);
      } catch (err) {
        console.error("Error fetching top products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, []);

  const handleViewAll = () => {
    navigate("/products");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={150} />
      </div>
    );
  if (error)
    return (
      <div className="text-center py-16 text-xl text-red-600">{error}</div>
    );

  return (
    <div className="homepage-container py-8">
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Top 5 Products Ending Soon
          </h2>
          <button
            onClick={handleViewAll}
            className="bg-primary-blue text-white px-4 py-2 rounded-md hover:scale-105 transition-transform duration-200"
          >
            View All Products
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {topEndingSoon.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Top 5 Most Bid-On Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {topMostBidOn.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Top 5 Highest Priced Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {topHighestPriced.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
