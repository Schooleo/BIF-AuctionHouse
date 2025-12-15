import React from "react";
import PopUpWindow from "./PopUpWindow";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = "Full size view",
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  // Reset zoom when image changes or modal closes
  React.useEffect(() => {
    if (!isOpen) setIsZoomed(false);
  }, [isOpen, imageUrl]);

  if (!imageUrl) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Image View"
      size="auto"
      hideFooter={true}
      noPadding={true}
      contentClassName="max-h-[85vh] flex items-center justify-center bg-black/5"
      closeOnOverlayClick={true}
    >
      <div
        className={`relative overflow-hidden ${
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        }`}
        onMouseMove={handleMouseMove}
        onClick={toggleZoom}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[90vh] min-w-[40vw] min-h-[40vh] object-contain transition-transform duration-200 ease-out"
          style={{
            transformOrigin: `${position.x}% ${position.y}%`,
            transform: isZoomed ? "scale(2.5)" : "scale(1)",
          }}
        />
      </div>
    </PopUpWindow>
  );
};

export default ImageModal;
