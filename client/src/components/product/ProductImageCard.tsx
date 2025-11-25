import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ProductImageCardProps {
  images: string[] | undefined | null; // Allow undefined/null input
}

// Placeholder image if no images are provided
const DEFAULT_IMAGE = "/no-image.jpg";

const ProductImageCard: React.FC<ProductImageCardProps> = ({ images }) => {
  console.log(images);

  const validImages = useMemo(() => {
    return (images || []).filter(
      (img) => typeof img === "string" && img.length > 0
    );
  }, [images]);

  const [selectedImage, setSelectedImage] = useState<string>(
    validImages.length > 0 ? validImages[0] : DEFAULT_IMAGE
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedImage(validImages.length > 0 ? validImages[0] : DEFAULT_IMAGE);
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

  return (
    <div className="product-image-card w-full md:w-[500px] sticky top-20">
      {/* Main Image */}
      <div className="w-full mb-4 flex justify-center">
        <img
          src={selectedImage}
          alt="Main product"
          className="w-full h-[400px] md:h-[500px] object-contain rounded-lg shadow-md bg-primary-blue"
        />
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
                    selectedImage === img
                      ? "scale-105 border-2 border-primary-blue ring-4 ring-primary-blue/30"
                      : "border-gray-300 opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setSelectedImage(img)}
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
    </div>
  );
};

export default ProductImageCard;
