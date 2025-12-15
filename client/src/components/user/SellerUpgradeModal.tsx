import React, { useState } from 'react';
import PopUpWindow from '@components/ui/PopUpWindow';

interface SellerUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  loading?: boolean;
}

const SellerUpgradeModal: React.FC<SellerUpgradeModalProps> = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);

    if (!reason.trim()) {
      setError('Please enter your reason for wanting to become a seller');
      return;
    }

    if (reason.trim().length < 20) {
      setError('Reason must be at least 20 characters');
      return;
    }

    try {
      await onSubmit(reason.trim());
      setReason('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Request to Become a Seller'
      submitText='Submit Request'
      isLoading={loading}
      size='lg'
    >
      <div className='space-y-6'>
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
          <p className='text-sm text-blue-800'>
            <span className='font-semibold'>ℹ️ Note:</span> After submitting your request, admin will review and respond
            within 7 days. If rejected, you need to wait 7 days before submitting a new request.
          </p>
        </div>

        <div>
          <label htmlFor='reason' className='block text-sm font-medium text-gray-700 mb-2'>
            Reason for Wanting to Become a Seller <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            placeholder='Tell us why you want to become a seller on our platform...'
            disabled={loading}
          />
          <p className='text-xs text-gray-500 mt-1'>Minimum 20 characters</p>
        </div>

        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}
      </div>
    </PopUpWindow>
  );
};

export default SellerUpgradeModal;
