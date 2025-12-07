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
  if (!imageUrl) return null;

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
      <img
        src={imageUrl}
        alt={altText}
        className="max-w-full max-h-[90vh] min-w-[40vw] min-h-[40vh] object-contain"
      />
    </PopUpWindow>
  );
};

export default ImageModal;
