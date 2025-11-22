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
        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />

      {recentlyAdded && (
        <span className="absolute bottom-2 right-2 bg-primary-blue text-white text-xs font-semibold px-2 py-1 rounded shadow-md">
          Recently Added
        </span>
      )}
    </div>
  );
};

export default ProductImage;
