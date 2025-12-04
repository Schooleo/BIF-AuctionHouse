import React, { useMemo } from "react";
import type { QuestionAnswer } from "@interfaces/product";
import EmptyMessage from "@components/message/EmptyMessage";
import { formatBidTime } from "@utils/time";

interface SellerQnaManagerProps {
  questions: QuestionAnswer[];
  onAnswerClick: (question: QuestionAnswer) => void;
}

const SellerQnaManager: React.FC<SellerQnaManagerProps> = ({
  questions,
  onAnswerClick,
}) => {
  const orderedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      const aAnswered = a.answer ? 1 : 0;
      const bAnswered = b.answer ? 1 : 0;

      if (aAnswered !== bAnswered) {
        return aAnswered - bAnswered;
      }

      return (
        new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime()
      );
    });
  }, [questions]);

  if (orderedQuestions.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10">
        <EmptyMessage text="No questions have been asked for this product yet." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Questions &amp; Answers
        </h2>
        <p className="text-sm text-gray-500">
          Respond promptly to keep bidders engaged. Unanswered questions are
          shown first.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {orderedQuestions.map((question) => {
          const isAnswered = Boolean(question.answer);

          return (
            <div key={question._id} className="px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Asked by{" "}
                    <span className="font-medium text-gray-700">
                      {question.questioner?.name ?? "Anonymous"}
                    </span>{" "}
                    on {formatBidTime(question.askedAt)}
                  </p>
                  <p className="text-base text-gray-900 font-medium mt-2">
                    Q: {question.question}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAnswerClick(question)}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-primary-blue text-primary-blue hover:bg-primary-blue/10 transition"
                >
                  {isAnswered ? "Edit Answer" : "Answer"}
                </button>
              </div>

              {isAnswered ? (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">
                    Answered{" "}
                    {question.answeredAt ? formatBidTime(question.answeredAt) : ""}
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    A: {question.answer}
                  </p>
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-500 italic">
                  No answer yet. Respond to help bidders make a decision.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerQnaManager;