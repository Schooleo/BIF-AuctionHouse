import { useState, useEffect } from 'react';
import InputField from '@components/forms/InputField';
import Button from '@components/forms/Button';
import ConfirmationModal from '@components/ui/ConfirmationModal';
import type { UpdateProfileDto } from '@interfaces/bidder';

interface ProfileInfoFormProps {
  initialData: {
    name: string;
    email: string;
    address?: string;
  };
  onSubmit: (data: UpdateProfileDto) => Promise<void>;
  loading?: boolean;
}

const COOLDOWN_TIME = 60; // 60 seconds = 1 minute
const COOLDOWN_KEY = 'profile_update_cooldown';

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({ initialData, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name,
    address: initialData.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown on mount
  useEffect(() => {
    const checkCooldown = () => {
      const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownEnd) {
        const remaining = Math.max(0, Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000));
        if (remaining > 0) {
          setCooldownRemaining(remaining);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
        }
      }
    };

    checkCooldown();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            localStorage.removeItem(COOLDOWN_KEY);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  // Check if form has changes
  const hasChanges = () => {
    return formData.name.trim() !== initialData.name || (formData.address.trim() || '') !== (initialData.address || '');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name cannot be empty';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
      });

      // Set cooldown
      const cooldownEnd = Date.now() + COOLDOWN_TIME * 1000;
      localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
      setCooldownRemaining(COOLDOWN_TIME);
    } catch (error: any) {
      setErrors({ submit: error.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFieldDisabled = cooldownRemaining > 0 || loading || submitting;

  return (
    <>
      <form onSubmit={handleUpdateClick} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
          <InputField label='Email' type='email' value={initialData.email} disabled className='bg-gray-100' />
          <p className='mt-1 text-xs text-gray-500'>Email cannot be changed</p>
        </div>

        {cooldownRemaining > 0 && (
          <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
            <p className='text-sm text-yellow-800'>
              <span className='font-semibold'>⏱️ Cooldown:</span> You can update your profile again in{' '}
              <span className='font-bold'>{formatTime(cooldownRemaining)}</span>
            </p>
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Name <span className='text-red-500'>*</span>
          </label>
          <InputField
            label='Name'
            type='text'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            disabled={isFieldDisabled}
            placeholder='Enter your name'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
          <InputField
            label='Address'
            type='text'
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            disabled={isFieldDisabled}
            placeholder='Enter your address'
          />
        </div>

        {errors.submit && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600'>{errors.submit}</div>
        )}

        {hasChanges() && cooldownRemaining === 0 && (
          <Button
            type='submit'
            label={submitting ? 'Updating...' : 'Update Information'}
            disabled={loading || submitting}
            className='w-full'
          />
        )}
      </form>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title='Confirm Update'
        message='Are you sure you want to update your information?'
        confirmText='Update'
        type='info'
      />
    </>
  );
};

export default ProfileInfoForm;
