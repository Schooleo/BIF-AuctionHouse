import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/useAuthStore';
import { bidderApi } from '@services/bidder.api';
import type { UpdateProfileDto, ChangePasswordDto, UpgradeRequestStatus } from '@interfaces/bidder';
import ProfileInfoForm from '@components/forms/ProfileInfoForm';
import ProfilePasswordForm from '@components/forms/ProfilePasswordForm';
import RatingsReceivedList from '@components/user/RatingsReceivedList';
import WatchlistTab from '@components/user/WatchlistTab';
import ParticipatingAuctionsTab from '@components/user/ParticipatingAuctionsTab';
import WonAuctionsTab from '@components/user/WonAuctionsTab';
import SellerUpgradeModal from '@components/user/SellerUpgradeModal';

type TabType = 'info' | 'password' | 'ratings' | 'watchlist' | 'participating' | 'won';

const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequestStatus | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUpgradeStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await bidderApi.getProfile();
      setUser({ ...response.profile, id: response.profile._id });
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const fetchUpgradeStatus = async () => {
    try {
      const response = await bidderApi.getUpgradeRequestStatus();
      setUpgradeRequest(response.request);
    } catch (err: any) {
      console.error('Failed to fetch upgrade status:', err);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileDto) => {
    try {
      setLoading(true);
      const response = await bidderApi.updateProfile(data);
      setUser({ ...response.profile, id: response.profile._id });
      setSuccessMessage('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      throw new Error(err.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordDto) => {
    try {
      setLoading(true);
      await bidderApi.changePassword(data);
      setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển đến trang đăng nhập...');

      // Logout and redirect to login after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/auth/login');
      }, 2000);
    } catch (err: any) {
      throw new Error(err.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = async (reason: string) => {
    try {
      setUpgradeLoading(true);
      await bidderApi.requestSellerUpgrade(reason);
      setSuccessMessage('Gửi yêu cầu thành công! Admin sẽ xem xét trong vòng 7 ngày.');
      setIsUpgradeModalOpen(false);
      await fetchUpgradeStatus();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      throw new Error(err.message || 'Không thể gửi yêu cầu');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const canRequestUpgrade = () => {
    if (!upgradeRequest) return true;
    if (upgradeRequest.status === 'approved') return false;
    if (upgradeRequest.status === 'pending') return false;
    return true;
  };

  const getUpgradeButtonText = () => {
    if (!upgradeRequest) return 'Want to be a seller?';
    if (upgradeRequest.status === 'pending') return 'Yêu cầu đang chờ xử lý';
    if (upgradeRequest.status === 'approved') return 'Đã là Seller';
    return 'Gửi lại yêu cầu';
  };

  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-gray-500'>Đang tải...</div>
      </div>
    );
  }

  const reputationPercentage =
    user.positiveRatings + user.negativeRatings > 0
      ? Math.round((user.positiveRatings / (user.positiveRatings + user.negativeRatings)) * 100)
      : 0;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'info', label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'password', label: 'Đổi mật khẩu', icon: '🔒' },
    { id: 'ratings', label: 'Đánh giá nhận được', icon: '⭐' },
    { id: 'watchlist', label: 'Danh sách yêu thích', icon: '❤️' },
    { id: 'participating', label: 'Đấu giá tham gia', icon: '🏷️' },
    { id: 'won', label: 'Đấu giá đã thắng', icon: '🏆' },
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header Section */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='flex items-center gap-4'>
            <div className='w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold'>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold text-gray-800'>{user.name}</h1>
              <p className='text-gray-600'>{user.email}</p>
              <div className='flex items-center gap-4 mt-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>Uy tín:</span>
                  <span className='font-semibold text-blue-600'>{reputationPercentage}%</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-green-600 font-semibold'>👍 {user.positiveRatings}</span>
                  <span className='text-gray-400'>|</span>
                  <span className='text-red-600 font-semibold'>👎 {user.negativeRatings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <p className='text-green-800 font-medium'>{successMessage}</p>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden mb-6'>
          <div className='flex overflow-x-auto'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          {activeTab === 'info' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Thông tin cá nhân</h2>
              <ProfileInfoForm
                initialData={{
                  name: user.name,
                  email: user.email,
                  address: user.address || '',
                }}
                onSubmit={handleUpdateProfile}
                loading={loading}
              />

              {/* Upgrade to Seller Button */}
              {user.role === 'bidder' && (
                <div className='mt-8 pt-6 border-t border-gray-200'>
                  <h3 className='text-lg font-semibold mb-3'>Nâng cấp tài khoản</h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    Trở thành seller để đăng bán sản phẩm và tạo đấu giá trên nền tảng của chúng tôi.
                  </p>
                  {upgradeRequest?.status === 'rejected' && upgradeRequest.rejectionReason && (
                    <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                      <p className='text-sm text-red-800'>
                        <span className='font-semibold'>Lý do từ chối:</span> {upgradeRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    disabled={!canRequestUpgrade()}
                    className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition'
                  >
                    {getUpgradeButtonText()}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h2 className='text-xl font-bold mb-4'>Đổi mật khẩu</h2>
              <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-yellow-800 text-sm'>
                  <span className='font-semibold'>⚠️ Lưu ý:</span> Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại với
                  mật khẩu mới.
                </p>
              </div>
              <ProfilePasswordForm onSubmit={handleChangePassword} loading={loading} />
            </div>
          )}

          {activeTab === 'ratings' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Đánh giá nhận được</h2>
              <RatingsReceivedList />
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Danh sách yêu thích</h2>
              <WatchlistTab />
            </div>
          )}

          {activeTab === 'participating' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Đấu giá đang tham gia</h2>
              <ParticipatingAuctionsTab />
            </div>
          )}

          {activeTab === 'won' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Đấu giá đã thắng</h2>
              <WonAuctionsTab />
            </div>
          )}
        </div>

        {/* Seller Upgrade Modal */}
        <SellerUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onSubmit={handleUpgradeRequest}
          loading={upgradeLoading}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
