import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bidderApi } from '@services/bidder.api';
import type { AuctionItem, RateSellerDto } from '@interfaces/bidder';
import ProductCard from '@components/product/ProductCard';
import Spinner from '@components/ui/Spinner';
import RateSellerModal from '@components/user/RateSellerModal';

const WonAuctionsTab: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [ratingMode, setRatingMode] = useState<'create' | 'update'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const limit = 12;

  useEffect(() => {
    fetchAuctions();
  }, [page]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidderApi.getWonAuctions(page, limit);
      setAuctions(response.data || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đấu giá đã thắng');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRateModal = (auction: AuctionItem, mode: 'create' | 'update') => {
    setSelectedAuction(auction);
    setRatingMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAuction(null);
  };

  const handleSubmitRating = async (data: RateSellerDto) => {
    if (!selectedAuction?.seller?._id) return;

    try {
      setSubmitting(true);
      if (ratingMode === 'create') {
        await bidderApi.rateSeller(selectedAuction.seller._id, data);
      } else {
        await bidderApi.updateSellerRating(selectedAuction.seller._id, data);
      }
      handleCloseModal();
      await fetchAuctions(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (auction: AuctionItem) => {
    if (!auction.seller?._id) return;
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      await bidderApi.deleteSellerRating(auction.seller._id);
      await fetchAuctions(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Không thể xóa đánh giá');
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
        <p className='text-lg mb-4'>Bạn chưa thắng đấu giá nào</p>
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
      <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
        <p className='text-green-800'>
          <span className='font-semibold'>🎉 Chúc mừng!</span> Đây là danh sách các sản phẩm mà bạn đã thắng đấu giá.
          Hãy đánh giá người bán để giúp cộng đồng!
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {auctions.map((auction) => (
          <div key={auction._id} className='space-y-3'>
            <ProductCard product={auction} />

            {/* Rating Section */}
            <div className='bg-white border border-gray-200 rounded-lg p-3'>
              {!auction.hasRated ? (
                <button
                  onClick={() => handleOpenRateModal(auction, 'create')}
                  className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition'
                >
                  ⭐ Đánh giá người bán
                </button>
              ) : (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Đánh giá của bạn:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        auction.myRating?.score === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {auction.myRating?.score === 1 ? '👍 +1' : '👎 -1'}
                    </span>
                  </div>
                  {auction.myRating?.comment && (
                    <p className='text-sm text-gray-700 italic'>"{auction.myRating.comment}"</p>
                  )}
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleOpenRateModal(auction, 'update')}
                      className='flex-1 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition'
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteRating(auction)}
                      className='flex-1 px-3 py-1.5 text-sm border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition'
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      {/* Rating Modal */}
      {selectedAuction && (
        <RateSellerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitRating}
          sellerName={selectedAuction.seller?.name || 'Người bán'}
          productName={selectedAuction.name}
          existingRating={selectedAuction.myRating}
          mode={ratingMode}
          loading={submitting}
        />
      )}
    </div>
  );
};

export default WonAuctionsTab;
