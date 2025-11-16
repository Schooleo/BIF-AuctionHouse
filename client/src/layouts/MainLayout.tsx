import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBarCategory from '../components/ui/LeftSideBar'
import type { Category } from '../types/product';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';

const mockCategories: Category[] = [
  { _id: '1', name: 'Phones' },
  { _id: '2', name: 'Laptops' },
  { _id: '3', name: 'Gaming Gears' },
  { _id: '4', name: 'Fashion' },
];

const MainLayout: React.FC = () => {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 w-full px-8 mt-4'>
        <div className='hidden md:block w-64 mr-6'>
          <SideBarCategory categories={mockCategories} />
        </div>

        <main className='flex-1'>
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
