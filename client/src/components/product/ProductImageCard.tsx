import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import ImageModal from "@components/ui/ImageModal";

interface ProductImageCardProps {
  images: string[] | undefined | null;
  recentlyAdded?: boolean;
  autoPlayInterval?: number; // in milliseconds, default 5000ms
}

const DEFAULT_IMAGE = "/no-image.jpg";
const DEFAULT_AUTOPLAY_INTERVAL = 5000; // 5 seconds

const ProductImageCard: React.FC<ProductImageCardProps> = ({
  images,
  recentlyAdded,
  autoPlayInterval = DEFAULT_AUTOPLAY_INTERVAL,
}) => {
  const validImages = useMemo(() => {
    return (images || []).filter(
      (img) => typeof img === "string" && img.length > 0
    );
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAutoPlaying || validImages.length <= 1) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setDirection("right");
      setSelectedIndex((prev) => (prev + 1) % validImages.length);
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, validImages.length, autoPlayInterval]);

  // Reset when images change
  useEffect(() => {
    setSelectedIndex(0);
    setIsAutoPlaying(true);
  }, [validImages]);

  const handlePrevious = () => {
    setDirection("left");
    setSelectedIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setDirection("right");
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
    setIsAutoPlaying(false);
  };

  const handleThumbnailClick = (index: number) => {
    setDirection(index > selectedIndex ? "right" : "left");
    setSelectedIndex(index);
    setIsAutoPlaying(false);
  };

  const scroll = (scrollDirection: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 120;
      containerRef.current.scrollBy({
        left: scrollDirection === "left" ? -scrollAmount : scrollAmount,
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
      <div className="w-full mb-4 relative group overflow-hidden rounded-lg shadow-lg border-t border-gray-200">
        <div className="relative h-[400px] md:h-[500px] bg-white cursor-pointer">
          {validImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Product ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ease-in-out ${
                idx === selectedIndex
                  ? "opacity-100 translate-x-0"
                  : idx < selectedIndex
                  ? direction === "right"
                    ? "opacity-0 -translate-x-full"
                    : "opacity-0 translate-x-full"
                  : direction === "right"
                  ? "opacity-0 translate-x-full"
                  : "opacity-0 -translate-x-full"
              }`}
              onClick={() => setIsModalOpen(true)}
            />
          ))}
        </div>

        {/* Navigation Arrows - Show on hover */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
              aria-label="Next image"
            >
              <ArrowRight size={20} />
            </button>
          </>
        )}

        {/* Auto-play Control */}
        {validImages.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 left-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            title={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}

        {/* Image Counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {selectedIndex + 1} / {validImages.length}
          </div>
        )}

        {recentlyAdded && (
          <span className="absolute top-4 right-4 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold italic px-3 py-1.5 rounded-md shadow-lg z-10">
            Recently Added
          </span>
        )}
      </div>

      {/* Thumbnails Section */}
      {validImages.length > 0 && (
        <div className="relative flex items-center justify-center">
          {shouldShowScrollArrows && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-1 z-10 bg-primary-blue/80 hover:bg-primary-blue text-white p-2 rounded-full shadow-md hover:scale-110 transition-all duration-200"
              aria-label="Scroll thumbnails left"
            >
              <ArrowLeft size={16} />
            </button>
          )}

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
                  alt={`Thumbnail ${idx + 1}`}
                  className={`w-20 h-20 md:w-24 md:h-24 object-cover rounded-md cursor-pointer border-2 bg-gray-200 transition-all duration-300 ${
                    selectedIndex === idx
                      ? "scale-105 border-2 border-primary-blue ring-4 ring-primary-blue/30"
                      : "border-gray-300 opacity-70 hover:opacity-100 hover:border-primary-blue/50"
                  }`}
                  onClick={() => handleThumbnailClick(idx)}
                />
              ))}
            </div>
          </div>

          {shouldShowScrollArrows && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-1 z-10 bg-primary-blue/80 hover:bg-primary-blue text-white p-2 rounded-full shadow-md hover:scale-110 transition-all duration-200"
              aria-label="Scroll thumbnails right"
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
