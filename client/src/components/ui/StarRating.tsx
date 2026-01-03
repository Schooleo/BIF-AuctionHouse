import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0-5
  showNumber?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  showNumber = false,
  size = "md",
}) => {
  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const iconSize = sizeMap[size];

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={iconSize}
          fill="#FFC107"
          className="text-yellow-500"
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative" key="half-star">
          <Star size={iconSize} className="text-gray-300" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: "50%" }}
          >
            <Star size={iconSize} fill="#FFC107" className="text-yellow-500" />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={iconSize} className="text-gray-300" />
      ))}

      {showNumber && (
        <span className="ml-1 text-sm text-gray-600">
          {rating.toFixed(1)}/5
        </span>
      )}
    </div>
  );
};
