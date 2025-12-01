import { Outlet } from 'react-router-dom';
import Navbar from '@components/ui/Navbar';
import Footer from '@components/ui/Footer';

const UserLayout = () => {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 w-full px-4 md:px-8'>
        <main className='flex-1 min-w-0'>
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default UserLayout;
