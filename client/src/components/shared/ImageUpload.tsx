import React, { useRef, useState } from "react";
import { Upload, X, Loader2, Check } from "lucide-react";
import { uploadApi } from "@services/upload.api";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  placeholder?: string;
  height?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  className = "",
  placeholder = "Click or drag to upload",
  height = "h-48",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { url } = await uploadApi.uploadImage(file);
      onChange(url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload image";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {value ? (
        <div
          className={`relative w-full ${height} rounded-lg overflow-hidden border border-green-200 bg-green-50 flex flex-col items-center justify-center p-4 group`}
        >
          <div className="flex flex-col items-center text-green-600">
            <div className="p-2 bg-green-100 rounded-full mb-2">
              <Check className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-center">
              Image Uploaded Successfully
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-200 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full ${height} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : error
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          {isUploading ? (
            <div className="flex flex-col items-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 p-4 text-center">
              {error ? (
                <>
                  <X className="w-8 h-8 text-red-400 mb-2" />
                  <span className="text-sm text-red-500">{error}</span>
                  <span className="text-xs text-red-400 mt-1">
                    Click to try again
                  </span>
                </>
              ) : (
                <>
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {placeholder}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
