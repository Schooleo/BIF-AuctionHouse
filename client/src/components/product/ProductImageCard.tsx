import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ImageModal from "@components/ui/ImageModal";

interface ProductImageCardProps {
  images: string[] | undefined | null; // Allow undefined/null input
  recentlyAdded?: boolean;
}

// Placeholder image if no images are provided
const DEFAULT_IMAGE = "/no-image.jpg";

const ProductImageCard: React.FC<ProductImageCardProps> = ({
  images,
  recentlyAdded,
}) => {
  const validImages = useMemo(() => {
    return (images || []).filter(
      (img) => typeof img === "string" && img.length > 0
    );
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [validImages]);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 120;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const shouldShowScrollArrows = validImages.length > 4;

  const currentImage =
    validImages.length > 0 ? validImages[selectedIndex] : DEFAULT_IMAGE;

  return (
    <div className="product-image-card w-full md:w-[500px] sticky top-20">
      {/* Main Image */}
      <div className="w-full mb-4 flex justify-center relative group overflow-hidden rounded-lg shadow-lg border-t border-gray-200 cursor-pointer">
        <img
          src={currentImage}
          alt="Main product"
          className="w-full h-[400px] md:h-[500px] object-contain bg-white transition-transform duration-300 group-hover:scale-105"
          onClick={() => setIsModalOpen(true)}
        />
        {recentlyAdded && (
          <span className="absolute bottom-4 right-4 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold italic px-3 py-1.5 rounded-md shadow-lg z-10">
            Recently Added
          </span>
        )}
      </div>

      {/* Sub Images Section */}
      {validImages.length > 0 && (
        <div className="relative flex items-center justify-center">
          {/* Left arrow - only show if scrolling is needed */}
          {shouldShowScrollArrows && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-1 z-10 bg-primary-blue/80 text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform duration-200"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          {/* Sub images container */}
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-none w-full md:px-6 py-2"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex gap-6 w-max mx-auto">
              {validImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Sub ${idx + 1}`}
                  className={`w-20 h-20 md:w-24 md:h-24 object-cover rounded-md cursor-pointer border-2 bg-gray-200 transition-all duration-300 ${
                    selectedIndex === idx
                      ? "scale-105 border-2 border-primary-blue ring-4 ring-primary-blue/30"
                      : "border-gray-300 opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          </div>

          {/* Right arrow - only show if scrolling is needed */}
          {shouldShowScrollArrows && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-1 z-10 bg-primary-blue/80 text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform duration-200"
            >
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={currentImage}
        altText="Product Full View"
      />
    </div>
  );
};

export default ProductImageCard;
