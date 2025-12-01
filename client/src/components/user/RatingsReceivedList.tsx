import { useState, useEffect } from 'react';
import { bidderApi } from '@services/bidder.api';
import type { RatingReceived } from '@interfaces/bidder';
import Spinner from '@components/ui/Spinner';

const RatingsReceivedList: React.FC = () => {
  const [ratings, setRatings] = useState<RatingReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchRatings();
  }, [page]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidderApi.getReceivedRatings(page, limit);
      setRatings(response.data || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
        <button onClick={() => fetchRatings()} className='mt-4 text-blue-600 hover:underline'>
          Thử lại
        </button>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500'>
        <p className='text-lg'>Bạn chưa nhận được đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {ratings.map((rating) => (
        <div
          key={rating._id}
          className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
        >
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                <span className='text-blue-600 font-semibold text-lg'>{rating.rater.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>{rating.rater.name}</h3>
                <p className='text-sm text-gray-500'>{rating.rater.email}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {rating.score === 1 ? (
                <div className='flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full'>
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' />
                  </svg>
                  <span className='font-medium'>Tích cực</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full'>
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z' />
                  </svg>
                  <span className='font-medium'>Tiêu cực</span>
                </div>
              )}
            </div>
          </div>

          <p className='text-gray-700 mb-3 pl-13'>{rating.comment}</p>

          <div className='text-sm text-gray-500 pl-13'>{formatDate(rating.createdAt)}</div>
        </div>
      ))}

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

export default RatingsReceivedList;
