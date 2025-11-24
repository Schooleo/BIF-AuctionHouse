interface ProductImageProps {
  images: string[];
  recentlyAdded?: boolean;
}

const ProductImage = ({ images, recentlyAdded }: ProductImageProps) => {
  return (
    <div className="relative w-full h-44 sm:h-48 md:h-52 lg:h-56 bg-gray-100 rounded-t-lg overflow-hidden">
      <img
        src={images[0]}
        alt="Product Image"
        className="w-full h-full bg-primary-blue object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />

      {recentlyAdded && (
        <span className="absolute bottom-2 right-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold italic px-2 py-1 rounded-md shadow-lg">
          Recently Added
        </span>
      )}
    </div>
  );
};

export default ProductImage;
