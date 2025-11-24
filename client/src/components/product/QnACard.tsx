import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDateTime } from "@utils/time";

export interface IQuestionAnswer {
  _id: string;
  question: string;
  questionerName: string; // For frontend display
  askedAt: Date | string;
  answer?: string;
  answeredAt?: Date | string;
}

interface QnACardProps {
  qnas: IQuestionAnswer[];
}

export const QnACard: React.FC<QnACardProps> = ({ qnas }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!qnas || qnas.length === 0) {
    return (
      <div className="text-gray-500 py-4 text-center">No Q&A available.</div>
    );
  }

  // Sort most recent first (leftmost)
  const sortedQnAs = [...qnas].sort(
    (a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime()
  );

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      // Calculate scroll amount based on card width (approx 350px + gap)
      const scrollAmount = 370;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative py-4">
      {/* Left arrow - Styled to match the subtle slider controls */}
      <button
        onClick={() => scroll("left")}
        // Use -left-4 to hide the button slightly, giving the scrolling effect space
        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-md rounded-full p-2 z-10 hover:shadow-lg transition-shadow duration-200"
      >
        <ArrowLeft size={18} className="text-gray-600" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        // Use -right-4 to hide the button slightly
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-md rounded-full p-2 z-10 hover:shadow-lg transition-shadow duration-200"
      >
        <ArrowRight size={18} className="text-gray-600" />
      </button>

      <div
        ref={containerRef}
        // Increased spacing and padding to accommodate arrows
        className="flex space-x-6 overflow-x-auto scrollbar-none scroll-smooth px-2"
      >
        {sortedQnAs.map((qna) => {
          // Use custom formatting function
          const askedAt = formatDateTime(qna.askedAt);
          const answeredAt = qna.answeredAt
            ? formatDateTime(qna.answeredAt)
            : null;

          return (
            <div
              key={qna._id}
              // Increased min-width and added height to match screenshot's vertical space
              className="min-w-[350px] h-[200px] bg-white rounded-lg shadow-sm border border-gray-100 p-4 shrink-0 transition-shadow duration-300 hover:shadow-md"
            >
              {/* Question Header */}
              <div className="font-semibold text-gray-800 mb-2">
                Q: {qna.question}
              </div>

              {/* Asked Details */}
              <div className="text-gray-500 text-sm mb-4">
                Asked by{" "}
                <span className="font-medium text-gray-700">
                  {qna.questionerName}
                </span>{" "}
                • {askedAt}
              </div>

              {/* Answer Content */}
              <div className="text-gray-800 font-medium mb-1">
                A: {qna.answer || "No answer yet."}
              </div>

              {/* Answered Details */}
              {answeredAt && (
                <div className="text-gray-500 text-sm">
                  Answered at {answeredAt}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
