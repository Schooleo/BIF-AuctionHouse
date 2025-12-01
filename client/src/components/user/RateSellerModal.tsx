import { useState, useEffect } from 'react';
import type { RateSellerDto } from '@interfaces/bidder';

interface RateSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RateSellerDto) => Promise<void>;
  sellerName: string;
  productName: string;
  existingRating?: { score: 1 | -1; comment: string } | null;
  mode: 'create' | 'update';
  loading?: boolean;
}

const RateSellerModal: React.FC<RateSellerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sellerName,
  productName,
  existingRating,
  mode,
  loading = false,
}) => {
  const [score, setScore] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && existingRating) {
      setScore(existingRating.score);
      setComment(existingRating.comment || '');
    } else if (isOpen) {
      setScore(null);
      setComment('');
    }
    setError(null);
  }, [isOpen, existingRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (score === null) {
      setError('Please select a rating of +1 or -1');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    try {
      await onSubmit({ score, comment: comment.trim() });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
        <h2 className='text-2xl font-bold mb-4'>{mode === 'create' ? 'Rate Seller' : 'Edit Rating'}</h2>

        <div className='mb-4 p-3 bg-gray-50 rounded-md'>
          <p className='text-sm text-gray-600'>Seller:</p>
          <p className='font-semibold'>{sellerName}</p>
          <p className='text-sm text-gray-600 mt-2'>Product:</p>
          <p className='font-semibold'>{productName}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Score Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Rating <span className='text-red-500'>*</span>
            </label>
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={() => setScore(1)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                  score === 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <span className='text-2xl'>👍</span>
                <div className='font-semibold mt-1'>Positive (+1)</div>
              </button>
              <button
                type='button'
                onClick={() => setScore(-1)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                  score === -1 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <span className='text-2xl'>👎</span>
                <div className='font-semibold mt-1'>Negative (-1)</div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor='comment' className='block text-sm font-medium text-gray-700 mb-2'>
              Comment <span className='text-red-500'>*</span>
            </label>
            <textarea
              id='comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Share your experience with the seller...'
              disabled={loading}
            />
            <p className='text-xs text-gray-500 mt-1'>Minimum 10 characters</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              {loading ? 'Processing...' : mode === 'create' ? 'Submit Rating' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateSellerModal;
