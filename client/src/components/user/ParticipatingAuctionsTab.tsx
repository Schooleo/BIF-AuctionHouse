import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bidderApi } from '@services/bidder.api';
import type { AuctionItem } from '@interfaces/bidder';
import ProductCard from '@components/product/ProductCard';
import Spinner from '@components/ui/Spinner';

const ParticipatingAuctionsTab: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const limit = 12;

  useEffect(() => {
    fetchAuctions();
  }, [page]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidderApi.getParticipatingAuctions(page, limit);
      setAuctions(response.data || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đấu giá');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Spinner size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>{error}</p>
        <button onClick={() => fetchAuctions()} className='mt-4 text-blue-600 hover:underline'>
          Thử lại
        </button>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500'>
        <p className='text-lg mb-4'>Bạn chưa tham gia đấu giá nào</p>
        <button
          onClick={() => navigate('/products')}
          className='px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition'
        >
          Tham gia đấu giá ngay
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
        <p className='text-blue-800'>
          <span className='font-semibold'>💡 Lưu ý:</span> Đây là danh sách các sản phẩm mà bạn đã đặt giá và đang trong
          thời gian đấu giá.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {auctions.map((auction) => (
          <ProductCard key={auction._id} product={auction} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-6'>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Trước
          </button>
          <span className='px-4 py-2'>
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipatingAuctionsTab;
