export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-center sm:justify-between bg-primary-blue px-4 sm:px-8 py-6 shadow-md">
      {/* Slogan - Left side */}
      <div className="flex items-center text-center sm:text-left mb-3 sm:mb-0">
        <span className="text-white text-base sm:text-lg md:text-xl">
          BIF-AuctionHouse - Reputable auction - Bid anytime, bid anywhere
        </span>
      </div>

      {/* Contact Email - Right side */}
      <div className="flex items-center text-white text-base sm:text-lg">
        <span>
          Contact us: bifauctionhouse@gmail.com
        </span>
      </div>
    </footer>
  );
}
