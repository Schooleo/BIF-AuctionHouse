import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Review {
  _id: string;
  rater: { _id?: string; name: string; avatar?: string };
  ratee?: { _id?: string; name: string; avatar?: string };
  product?: { _id?: string; name: string; mainImage?: string };
  score: number;
  comment: string;
  createdAt: string;
}

interface AdminReviewCardProps {
  review: Review;
  onEdit: (reviewId: string, newComment: string) => Promise<void>;
  onDelete: (reviewId: string) => Promise<void>;
}

const AdminReviewCard: React.FC<AdminReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(review.comment);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isPositive = review.score > 0;

  const handleSave = async () => {
    if (editedComment.trim() === review.comment) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onEdit(review._id, editedComment.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(review._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`flex gap-4 p-4 border rounded-lg transition-shadow hover:shadow-sm ${
        isPositive ? "border-gray-100 bg-white" : "bg-red-50 border-red-200"
      }`}
    >
      {/* Review Type Icon */}
      <div className="shrink-0 pt-1">
        {isPositive ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <ThumbsUp size={16} className="text-green-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <ThumbsDown size={16} className="text-red-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Rater Avatar */}
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {review.rater?.avatar ? (
                <img
                  src={review.rater.avatar}
                  alt={review.rater.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-bold text-xs">
                  {review.rater?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              {review.rater?.name || "Deleted User"}
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comment */}
        {isEditing ? (
          <div className="flex gap-2 items-start">
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedComment(review.comment);
                }}
                className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            "{review.comment}"
          </p>
        )}

        {/* Meta Info: Ratee & Product */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          {review.ratee && (
            <button
              onClick={() =>
                review.ratee?._id &&
                navigate(`/admin/users/${review.ratee._id}`)
              }
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <span>Review for:</span>
              <span className="font-medium text-gray-700">
                {review.ratee.name}
              </span>
              <ExternalLink size={10} />
            </button>
          )}
          {review.product && (
            <button
              onClick={() =>
                review.product?._id &&
                navigate(`/admin/products/details/${review.product._id}`)
              }
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <span>On product:</span>
              <span className="font-medium text-gray-700">
                {review.product.name}
              </span>
              <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewCard;
