import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Star, Trophy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuthStore } from '@stores/useAuthStore';
import { bidderApi } from '@services/bidder.api';
import type { UpdateProfileDto, ChangePasswordDto, UpgradeRequestStatus } from '@interfaces/bidder';
import ProfileInfoForm from '@components/forms/ProfileInfoForm';
import ProfilePasswordForm from '@components/forms/ProfilePasswordForm';
import RatingsReceivedList from '@components/user/RatingsReceivedList';
import WonAuctionsTab from '@components/user/WonAuctionsTab';
import SellerUpgradeModal from '@components/user/SellerUpgradeModal';

type TabType = 'info' | 'ratings' | 'won';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  // UI State
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'info';
  const validTabs: TabType[] = ['info', 'ratings', 'won'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'info';

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Rating counts from API
  const [positiveCount, setPositiveCount] = useState(0);
  const [negativeCount, setNegativeCount] = useState(0);

  // Upgrade State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequestStatus | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Fetch ratings count
  const fetchRatingsCount = async () => {
    try {
      // Fetch first page with large limit to get all ratings
      const response = await bidderApi.getReceivedRatings(1, 1000);
      const positive = response.data.filter((r) => r.score === 1).length;
      const negative = response.data.filter((r) => r.score === -1).length;
      setPositiveCount(positive);
      setNegativeCount(negative);
    } catch (err: any) {
      console.error('Failed to fetch ratings count:', err);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const { loading: authLoading } = useAuthStore.getState();
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const [profileRes, upgradeRes] = await Promise.all([
          bidderApi.getProfile(),
          bidderApi.getUpgradeRequestStatus(),
        ]);

        setUser({ ...profileRes.profile, id: profileRes.profile._id });
        setUpgradeRequest(upgradeRes.request);
        setProfileLoaded(true);

        // Fetch rating counts
        await fetchRatingsCount();
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, [setUser]);

  // Event Handlers
  const handleUpdateProfile = async (data: UpdateProfileDto) => {
    setLoading(true);
    try {
      const response = await bidderApi.updateProfile(data);
      setUser({ ...response.profile, id: response.profile._id });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordDto) => {
    setLoading(true);
    try {
      await bidderApi.changePassword(data);
      setSuccessMessage('Password changed successfully! Redirecting to login page...');
      setTimeout(() => navigate('/auth/logout?next=/auth/login'), 2000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = async (reason: string) => {
    setUpgradeLoading(true);
    try {
      await bidderApi.requestSellerUpgrade(reason);
      const response = await bidderApi.getUpgradeRequestStatus();
      setUpgradeRequest(response.request);
      setSuccessMessage('Request sent successfully! Admin will review within 7 days.');
      setIsUpgradeModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unable to send request');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && !validTabs.includes(tab as TabType)) {
      setSearchParams({ tab: 'info' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Loading state
  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-gray-500'>Loading...</div>
      </div>
    );
  }

  // Computed values - use actual counts from API
  const totalRatings = positiveCount + negativeCount;
  const reputationPercentage = totalRatings > 0 ? Math.round((positiveCount / totalRatings) * 100) : 0;

  const canUpgrade = !upgradeRequest || (upgradeRequest.status !== 'approved' && upgradeRequest.status !== 'pending');

  const upgradeButtonText = !upgradeRequest
    ? 'Want to be a seller?'
    : upgradeRequest.status === 'pending'
      ? 'Request Pending'
      : upgradeRequest.status === 'approved'
        ? 'Already a Seller'
        : 'Resubmit Request';

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'ratings', label: 'Ratings Received', icon: <Star size={18} /> },
    { id: 'won', label: 'Won Auctions', icon: <Trophy size={18} /> },
  ];

  return (
    <div className='flex gap-6 py-8'>
      {/* Sidebar Navigation */}
      <aside className='w-64 shrink-0'>
        <div className='bg-white rounded-lg shadow-md overflow-hidden sticky top-8'>
          <nav className='flex flex-col'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                  currentTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 min-w-0'>
        {/* Header Section */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6 overflow-hidden'>
          <div className='flex items-start gap-4'>
            <div className='w-20 h-20 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold'>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <h1 className='text-2xl font-bold text-gray-800 truncate'>{user.name}</h1>
              <p className='text-gray-600 truncate'>{user.email}</p>
              <p className='text-sm text-gray-500 truncate'>{user.contactEmail || 'No contact email'}</p>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-2'>
                <div className='flex items-center gap-2 whitespace-nowrap'>
                  <span className='text-sm text-gray-600'>Reputation:</span>
                  <span className='font-semibold text-blue-600'>{reputationPercentage}%</span>
                </div>
                <div className='flex items-center gap-2 text-sm whitespace-nowrap'>
                  <span className='text-green-600 font-semibold flex items-center gap-1'>
                    <ThumbsUp size={16} /> {positiveCount}
                  </span>
                  <span className='text-gray-400'>|</span>
                  <span className='text-red-600 font-semibold flex items-center gap-1'>
                    <ThumbsDown size={16} /> {negativeCount}
                  </span>
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

        {/* Tab Content */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          {currentTab === 'info' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Personal Info</h2>
              {profileLoaded ? (
                <ProfileInfoForm
                  initialData={{
                    name: user.name,
                    email: user.email,
                    address: user.address || '',
                    dateOfBirth: user.dateOfBirth,
                    contactEmail: user.contactEmail,
                  }}
                  onSubmit={handleUpdateProfile}
                  loading={loading}
                />
              ) : (
                <div className='flex justify-center py-8'>
                  <div className='text-gray-500'>Loading profile...</div>
                </div>
              )}

              {/* Change Password Section */}
              <div className='mt-8 pt-6 border-t border-gray-200'>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                  <Lock size={20} />
                  Change Password
                </h3>
                <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-yellow-800 text-sm'>
                    <span className='font-semibold'>⚠️ Note:</span> After changing your password, you will need to log
                    in again with your new password.
                  </p>
                </div>
                <ProfilePasswordForm onSubmit={handleChangePassword} loading={loading} />
              </div>

              {/* Upgrade to Seller Button */}
              {user.role === 'bidder' && (
                <div className='mt-8 pt-6 border-t border-gray-200'>
                  <h3 className='text-lg font-semibold mb-3'>Account Upgrade</h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    Become a seller to post products and create auctions on our platform.
                  </p>
                  {upgradeRequest?.status === 'rejected' && upgradeRequest.rejectionReason && (
                    <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                      <p className='text-sm text-red-800'>
                        <span className='font-semibold'>Rejection reason:</span> {upgradeRequest.rejectionReason}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    disabled={!canUpgrade}
                    className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition'
                  >
                    {upgradeButtonText}
                  </button>
                </div>
              )}
            </div>
          )}

          {currentTab === 'ratings' && (
            <div>
              <RatingsReceivedList />
            </div>
          )}

          {currentTab === 'won' && (
            <div>
              <h2 className='text-xl font-bold mb-6'>Won Auctions</h2>
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
