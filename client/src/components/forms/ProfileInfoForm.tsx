import { useState } from 'react';
import InputField from '@components/forms/InputField';
import Button from '@components/forms/Button';
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

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({ initialData, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name,
    address: initialData.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
      });
    } catch (error: any) {
      setErrors({ submit: error.message || 'Có lỗi xảy ra' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
        <InputField label='Email' type='email' value={initialData.email} disabled className='bg-gray-100' />
        <p className='mt-1 text-xs text-gray-500'>Email không thể thay đổi</p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Tên <span className='text-red-500'>*</span>
        </label>
        <InputField
          label='Tên'
          type='text'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          disabled={loading || submitting}
          placeholder='Nhập tên của bạn'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Địa chỉ</label>
        <InputField
          label='Địa chỉ'
          type='text'
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          error={errors.address}
          disabled={loading || submitting}
          placeholder='Nhập địa chỉ của bạn'
        />
      </div>

      {errors.submit && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600'>{errors.submit}</div>
      )}

      <Button
        type='submit'
        label={submitting ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
        disabled={loading || submitting}
        className='w-full'
      />
    </form>
  );
};

export default ProfileInfoForm;
