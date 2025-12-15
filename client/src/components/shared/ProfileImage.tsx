import React, { useState, useRef } from "react";
import { Camera, Trash2, Eye, Upload, Loader2 } from "lucide-react";
import ImageModal from "@components/ui/ImageModal";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import { uploadApi } from "@services/upload.api";
import { useAuthStore } from "@stores/useAuthStore";
import { useAlertStore } from "@stores/useAlertStore";
import { bidderApi } from "@services/bidder.api";
import { sellerApi } from "@services/seller.api";

interface ProfileImageProps {
  src?: string;
  alt: string;
  size?: string;
  className?: string;
  onImageUpdate: (newUrl: string | undefined) => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  size = "w-20 h-20",
  className = "",
  onImageUpdate,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const { addAlert } = useAlertStore();
  const isSeller = user?.role === "seller";

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    try {
      setIsLoading(true);
      setIsDropdownOpen(false);

      // 1. Upload new image
      const { url } = await uploadApi.uploadImage(file);

      if (isSeller) {
        await sellerApi.updateProfile({ avatar: url });
      } else {
        await bidderApi.updateProfile({ avatar: url });
      }

      // 3. Delete old image if it exists
      if (src) {
        const publicId = uploadApi.getPublicIdFromUrl(src);
        if (publicId) {
          try {
            await uploadApi.deleteImage(publicId);
          } catch (e) {
            console.error("Cleanup failed", e);
          }
        }
      }

      onImageUpdate(url);
      addAlert("success", "Profile image updated successfully");
    } catch (error) {
      console.error("Failed to update profile image:", error);
      addAlert("error", "Failed to update profile image");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (!src) return;
    setIsDropdownOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      // 1. Update profile to clear avatar
      if (isSeller) {
        await sellerApi.updateProfile({ avatar: "" });
      } else {
        await bidderApi.updateProfile({ avatar: "" });
      }

      // 2. Delete image from cloud
      const publicId = uploadApi.getPublicIdFromUrl(src!);
      if (publicId) {
        await uploadApi.deleteImage(publicId);
      }

      onImageUpdate(undefined); // or ""
      addAlert("success", "Profile image removed successfully");
    } catch (error) {
      console.error("Failed to delete profile image:", error);
      addAlert("error", "Failed to delete profile image");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        className={`relative group cursor-pointer ${className} ${size}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
      >
        {/* Avatar Display */}
        <div
          className={`w-full h-full rounded-full overflow-hidden border-2 ${isHovering ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200"} shadow-sm bg-gray-100 flex items-center justify-center relative`}
        >
          {src ? (
            <img src={src} alt={alt} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
              {alt.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          {/* Drag Overlay indicating drop */}
          {isHovering && !isLoading && (
            <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center z-10 transition-opacity">
              <Upload className="text-white w-8 h-8 drop-shadow-md" />
            </div>
          )}
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && !isLoading && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100 animation-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {src && (
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={16} /> View Avatar
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Camera size={16} /> Update Avatar
            </button>

            {src && (
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete Avatar
              </button>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handleUpload(e.target.files[0]);
          }}
        />
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={src || ""}
        altText={alt}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Profile Image"
        message="Are you sure you want to remove your profile picture? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default ProfileImage;
