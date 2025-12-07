import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import PopUpWindow from "@components/ui/PopUpWindow";

interface RateBidderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: 1 | -1, comment: string) => void;
  loading: boolean;
  bidderName: string;
  initialScore?: 1 | -1;
  initialComment?: string;
}

const RateBidderModal: React.FC<RateBidderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  bidderName,
  initialScore,
  initialComment,
}) => {
  const [score, setScore] = useState<1 | -1 | null>(initialScore || null);
  const [comment, setComment] = useState(initialComment || "");

  // Update state if initial props change (e.g. when reopening with new data)
  React.useEffect(() => {
    if (isOpen) {
      setScore(initialScore || null);
      setComment(initialComment || "");
    }
  }, [isOpen, initialScore, initialComment]);

  const handleSubmit = async () => {
    if (score) {
      onSubmit(score, comment);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        initialScore ? `Update Rating for ${bidderName}` : `Rate ${bidderName}`
      }
      submitText={initialScore ? "Update Rating" : "Submit Rating"}
      isLoading={loading}
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          How was your experience with this bidder? This rating will affect
          their reputation score.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setScore(1)}
            className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
              score === 1
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-green-200 text-gray-600"
            }`}
          >
            <ThumbsUp size={24} className={score === 1 ? "fill-current" : ""} />
            <span className="font-semibold">Positive</span>
          </button>

          <button
            type="button"
            onClick={() => setScore(-1)}
            className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
              score === -1
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 hover:border-red-200 text-gray-600"
            }`}
          >
            <ThumbsDown
              size={24}
              className={score === -1 ? "fill-current" : ""}
            />
            <span className="font-semibold">Negative</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          />
        </div>
      </div>
    </PopUpWindow>
  );
};

export default RateBidderModal;
