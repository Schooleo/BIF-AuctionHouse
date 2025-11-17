import React from 'react';
import type { Product } from '../../types/product';
import { Link } from 'react-router-dom';

interface ProductCard {
  product: Product;
}

const ProductCard: React.FC<ProductCard> = ({ product }) => {
  const { _id, name, images, currentPrice, buyNowPrice, bidders, startTime, endTime } = product;

  const topBidder = bidders.length > 0 ? bidders[bidders.length - 1] : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const getRemainingTime = (endStr: string) => {
    const end = new Date(endStr).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `; 
    if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `; 
    timeString += `${seconds}s`;

    return timeString.trim(); 
  };

  return (
    <Link
      to={`/product/${_id}`}

      className='group block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1'
    >
      <div className='w-full h-44 sm:h-48 md:h-52 lg:h-56 bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center'>
        <img
          src={images[0]}
          alt={name}
          className='w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105'
        />
      </div>

      <div className='p-3 sm:p-4 space-y-2'>
        {' '}
        <h3 className='text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-tight'>{name}</h3>
        <p className='text-sm sm:text-base text-gray-700'>
          <span className='font-semibold text-gray-800'>Current Price: </span>
          <span className='text-blue-600 font-bold'>{currentPrice.toLocaleString()}₫</span>
        </p>
        <p className='text-xs sm:text-sm text-gray-600'>
          <span className='font-semibold'>Top Bidder: </span>
          {topBidder ? (
            <>
              {topBidder.bidder.name} –{' '}
              <span className='text-green-600 font-medium'>{topBidder.price.toLocaleString()}₫</span>
            </>
          ) : (
            'No bids yet'
          )}
        </p>

        {buyNowPrice && (
          <p className='text-sm sm:text-base text-orange-600 font-bold'>
            Buy Now: <span className='text-orange-700'>{buyNowPrice.toLocaleString()}₫</span>
          </p>
        )}

        <p className='text-xs sm:text-sm text-gray-500'>
          <span className='font-semibold'>Posted Time: </span>
          {formatDate(startTime)}
        </p>

        <p className='text-sm sm:text-base text-red-600 font-bold'>
          Time Remaining: <span className='text-red-700'>{getRemainingTime(endTime)}</span>
        </p>

        <p className='text-xs sm:text-sm text-gray-700'>
          <span className='font-semibold'>Number of Bids: </span>
          <span className='font-medium'>{bidders.length}</span>
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
