import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className='flex flex-col sm:flex-row items-center justify-center sm:justify-between bg-[#042443] px-4 sm:px-8 py-3 shadow-md'>
      <div className='flex items-center text-center sm:text-left mb-3 sm:mb-0'>
        <span className='text-white text-base sm:text-lg md:text-xl font-serif font-semibold'>
          BIF-AuctionHouse - Reputable auction - Bid anytime, bid anywhere
        </span>
      </div>

      <nav className='flex items-center space-x-4 sm:space-x-6 text-white text-base sm:text-lg md:text-xl'>
        <Link
          to='/instruction'
          className='hover:text-[#FFD700] hover:font-semibold transition-all duration-200 whitespace-nowrap'
        >
          Instruction
        </Link>
        <div className='h-5 w-px bg-white sm:h-6' />
        <Link
          to='/contact'
          className='hover:text-[#FFD700] hover:font-semibold transition-all duration-200 whitespace-nowrap'
        >
          Contact
        </Link>
      </nav>
    </footer>
  );
}
