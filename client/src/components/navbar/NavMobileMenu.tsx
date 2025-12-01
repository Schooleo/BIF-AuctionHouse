import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/useAuthStore';
import ConfirmationModal from '@components/ui/ConfirmationModal';

interface Props {
  closeMenu: () => void;
}

export default function NavbarMobileMenu({ closeMenu }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <div className='md:hidden absolute top-full left-0 w-full bg-primary-blue shadow-lg py-4 z-50 animate-slide-down'>
      <nav className='flex flex-col items-center space-y-4 text-white text-lg'>
        <Link
          to='/'
          onClick={closeMenu}
          className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
        >
          Home
        </Link>
        <Link
          to='/watchlist'
          onClick={closeMenu}
          className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
        >
          Watch list
        </Link>
        <Link
          to='/bidding'
          onClick={closeMenu}
          className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
        >
          Bidding
        </Link>

        <div className='w-full px-6 py-2'>
          <input
            type='text'
            placeholder='Search'
            className='w-full px-4 py-2 rounded-full border border-white text-white placeholder-gray-300 focus:outline-none focus:ring-white bg-secondary-blue'
          />
        </div>

        {user ? (
          <>
            <Link
              to='/notifications'
              onClick={closeMenu}
              className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
            >
              Notifications
            </Link>
            <Link
              to={user.role === 'bidder' ? '/profile' : user.role === 'seller' ? '/seller/products' : '/profile'}
              onClick={closeMenu}
              className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
            >
              {user.name}
            </Link>
            <button
              onClick={() => setShowLogoutModal(true)}
              className='hover:text-red-500 hover:font-semibold transition-all duration-200'
            >
              Logout
            </button>
            <ConfirmationModal
              isOpen={showLogoutModal}
              onClose={() => setShowLogoutModal(false)}
              onConfirm={handleLogout}
              title='Confirm Logout'
              message='Are you sure you want to log out?'
              confirmText='Logout'
              type='danger'
            />
          </>
        ) : (
          <>
            <Link
              to='/notifications'
              onClick={closeMenu}
              className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
            >
              Notifications
            </Link>
            <Link
              to='/auth/register'
              onClick={closeMenu}
              className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
            >
              Sign Up
            </Link>
            <div className='w-24 h-px bg-white my-2' />
            <Link
              to='/auth/login'
              onClick={closeMenu}
              className='hover:text-primary-yellow hover:font-semibold transition-all duration-200'
            >
              Login
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
