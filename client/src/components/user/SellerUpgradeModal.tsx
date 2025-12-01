import { useState } from 'react';

interface SellerUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  loading?: boolean;
}

const SellerUpgradeModal: React.FC<SellerUpgradeModalProps> = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do muốn trở thành seller');
      return;
    }

    try {
      await onSubmit(reason.trim());
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-primary-blue bg-opacity-50 flex items-center justify-center z-50 p-4'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-xl max-w-lg w-full p-6'>
        <h2 className='text-2xl font-bold mb-4'>Yêu cầu trở thành Seller</h2>

        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
          <p className='text-sm text-blue-800'>
            <span className='font-semibold'>ℹ️ Lưu ý:</span> Sau khi gửi yêu cầu, admin sẽ xem xét và phản hồi trong
            vòng 7 ngày. Nếu bị từ chối, bạn cần đợi 7 ngày trước khi gửi yêu cầu mới.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='reason' className='block text-sm font-medium text-gray-700 mb-2'>
              Lý do muốn trở thành Seller <span className='text-red-500'>*</span>
            </label>
            <textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Hãy cho chúng tôi biết tại sao bạn muốn trở thành seller trên nền tảng của chúng tôi...'
              disabled={loading}
            />
            <p className='text-xs text-gray-500 mt-1'>Tối thiểu 20 ký tự</p>
          </div>

          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={handleClose}
              disabled={loading}
              className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition'
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerUpgradeModal;
