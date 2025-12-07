import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { orderApi } from "@services/order.api";
import type { Order } from "@interfaces/order";
import { useAlertStore } from "@stores/useAlertStore";

interface Step4Props {
  order: Order;
  isSeller: boolean;
  onUpdate: (order: Order) => void;
}

const Step4Rating: React.FC<Step4Props> = ({ order, isSeller, onUpdate }) => {
  const myRating = isSeller ? order.ratingBySeller : order.ratingByBuyer;
  const partnerRating = isSeller ? order.ratingByBuyer : order.ratingBySeller;

  const [score, setScore] = useState<1 | -1 | null>(
    myRating ? myRating.score : null
  );
  const [comment, setComment] = useState(
    myRating ? myRating.comment || "" : ""
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!myRating);
  const addAlert = useAlertStore((state) => state.addAlert);

  useEffect(() => {
    if (myRating) {
      setScore(myRating.score);
      setComment(myRating.comment || "");
    }
  }, [myRating]);

  const partnerName = isSeller ? "Bidder" : "Seller";

  const handleSubmit = async () => {
    if (!score) return addAlert("error", "Please select a rating");
    setLoading(true);
    try {
      const updated = await orderApi.submitRating(order._id, score, comment);
      onUpdate(updated);
      addAlert("success", myRating ? "Rating updated!" : "Rating submitted!");
      setIsEditing(false); // Switch back to view mode
    } catch (error) {
      console.error(error);
      addAlert("error", "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  if (myRating && !isEditing) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <ThumbsUp size={32} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Rating Submitted</h3>
        <p className="text-gray-600">
          You have rated the {partnerName.toLowerCase()}.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
          <div className="bg-gray-50 p-4 rounded border">
            <span className="text-xs font-bold text-gray-400 uppercase">
              You Rated
            </span>
            <div
              className={`mt-2 font-medium flex items-center gap-2 ${myRating.score === 1 ? "text-green-600" : "text-red-600"}`}
            >
              {myRating.score === 1 ? (
                <ThumbsUp size={16} />
              ) : (
                <ThumbsDown size={16} />
              )}
              {myRating.score === 1 ? "Positive" : "Negative"}
            </div>
            <p className="text-sm text-gray-600 mt-1 italic">
              "{myRating.comment}"
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
            >
              Edit Rating
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <span className="text-xs font-bold text-gray-400 uppercase">
              {partnerName} Rated
            </span>
            {partnerRating ? (
              <>
                <div
                  className={`mt-2 font-medium flex items-center gap-2 ${partnerRating.score === 1 ? "text-green-600" : "text-red-600"}`}
                >
                  {partnerRating.score === 1 ? (
                    <ThumbsUp size={16} />
                  ) : (
                    <ThumbsDown size={16} />
                  )}
                  {partnerRating.score === 1 ? "Positive" : "Negative"}
                </div>
                <p className="text-sm text-gray-600 mt-1 italic">
                  "{partnerRating.comment}"
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                Waiting for rating...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">
          {myRating ? "Update Rating" : "Rate Experience"}
        </h3>
        <p className="text-sm text-gray-500">
          {myRating
            ? "Update your rating for this transaction."
            : `Finalize the transaction by rating the ${partnerName.toLowerCase()}.`}
        </p>
      </div>

      <div className="flex justify-center gap-6 py-4">
        <button
          onClick={() => setScore(1)}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition w-32 ${
            score === 1
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 hover:border-green-300"
          }`}
        >
          <ThumbsUp size={32} />
          <span className="font-bold">Positive</span>
        </button>
        <button
          onClick={() => setScore(-1)}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition w-32 ${
            score === -1
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-gray-200 hover:border-red-300"
          }`}
        >
          <ThumbsDown size={32} />
          <span className="font-bold">Negative</span>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comment (Optional)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`How was your experience with the ${partnerName.toLowerCase()}?`}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !score}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : myRating
            ? "Update Rating"
            : "Submit Rating & Complete"}
      </button>
      {myRating && (
        <button
          onClick={() => setIsEditing(false)}
          disabled={loading}
          className="w-full text-gray-500 py-2 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default Step4Rating;
