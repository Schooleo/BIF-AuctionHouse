import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@img/notfound-icon.png';

const MissingIllustration = () => <img src={Icon} alt='Icon' className='w-48 h-48 mb-8' />;

const NotFoundPage: React.FC = () => {
  return (
    <div className='flex flex-col items-center justify-center text-center py-20 px-4 min-h-[70vh] bg-white'>
      <MissingIllustration />

      <h1 className='text-5xl font-bold text-gray-700 mb-3'>Oops!!!</h1>

      <p className='text-xl text-gray-500 mb-8'>It looks like the product or path does not exist!</p>

      <Link
        to='/'
        className='inline-block bg-[#042443] text-white font-semibold text-lg py-3 px-8 rounded-md hover:bg-red-600 transition-colors duration-300 shadow hover:shadow-md'
      >
        Back to home page
      </Link>
    </div>
  );
};

export default NotFoundPage;
