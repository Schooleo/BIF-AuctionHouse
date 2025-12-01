import { useState } from 'react';
import PasswordField from '@components/forms/PasswordField';
import Button from '@components/forms/Button';
import type { ChangePasswordDto } from '@interfaces/bidder';

interface ProfilePasswordFormProps {
  onSubmit: (data: ChangePasswordDto) => Promise<void>;
  loading?: boolean;
}

const ProfilePasswordForm: React.FC<ProfilePasswordFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});

      await onSubmit({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Auto hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Có lỗi xảy ra' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Mật khẩu hiện tại <span className='text-red-500'>*</span>
        </label>
        <PasswordField
          label='Mật khẩu hiện tại'
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          error={errors.currentPassword}
          disabled={loading || submitting}
          placeholder='Nhập mật khẩu hiện tại'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Mật khẩu mới <span className='text-red-500'>*</span>
        </label>
        <PasswordField
          label='Mật khẩu mới'
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          error={errors.newPassword}
          disabled={loading || submitting}
          placeholder='Nhập mật khẩu mới (tối thiểu 8 ký tự)'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Xác nhận mật khẩu mới <span className='text-red-500'>*</span>
        </label>
        <PasswordField
          label='Xác nhận mật khẩu'
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          disabled={loading || submitting}
          placeholder='Nhập lại mật khẩu mới'
        />
      </div>

      {errors.submit && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600'>{errors.submit}</div>
      )}

      {success && (
        <div className='p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600'>
          Đổi mật khẩu thành công! Vui lòng đăng nhập lại.
        </div>
      )}

      <Button
        type='submit'
        label={submitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        disabled={loading || submitting}
        className='w-full'
      />
    </form>
  );
};

export default ProfilePasswordForm;
