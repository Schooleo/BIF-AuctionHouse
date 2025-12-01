import { useState } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import { useAlertStore } from "@stores/useAlertStore";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onQuestionAdded?: (question: any) => void;
}

const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onQuestionAdded,
}) => {
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleSubmit = async () => {
    // Client-side validation
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (question.trim().length < 10) {
      setError("Question must be at least 10 characters long.");
      return;
    }

    if (question.trim().length > 500) {
      setError("Question cannot exceed 500 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await bidderApi.askQuestion(
        productId,
        question.trim(),
        useAuthStore.getState().token || ""
      );

      addAlert("success", "Your question has been submitted successfully!");

      if (onQuestionAdded) {
        const newQuestion = {
          _id: response.question._id,
          question: response.question.question,
          questioner: {
            name: useAuthStore.getState().user?.name || "You",
          },
          askedAt: response.question.askedAt,
          answer: undefined, // chưa có câu trả lời
          answeredAt: undefined,
        };
        onQuestionAdded(newQuestion);
      }

      setQuestion("");
      onClose();
    } catch (err: any) {
      console.error("Error submitting question:", err);
      setError(err?.message || "Failed to submit question. Please try again.");
      addAlert(
        "error",
        err?.message || "Failed to submit question. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    if (error) {
      setError("");
    }
  };

  // Reset khi đóng modal
  const handleClose = () => {
    if (!isSubmitting) {
      setQuestion("");
      setError("");
      onClose();
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={`Ask a Question about "${productName}"`}
      submitText="Send Question"
      isLoading={isSubmitting}
      size="md"
    >
      <div className="space-y-4">
        {/* Info text */}
        <p className="text-sm text-gray-600">
          Have a question about this product? Ask the seller and they'll respond
          as soon as possible.
        </p>

        {/* Textarea */}
        <div>
          <label
            htmlFor="question"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Your Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={handleChange}
            placeholder="Type your question here... (e.g., Is this item authentic? What's the condition?)"
            rows={5}
            maxLength={500}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
          />

          {/* Character count */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Minimum 10 characters</span>
            <span
              className={`text-xs ${question.length > 450 ? "text-orange-500" : "text-gray-500"}`}
            >
              {question.length}/500
            </span>
          </div>
        </div>

        {error && (
            <div className="text-sm text-red-500">{error}</div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 The seller will receive an email notification and can answer your
            question. You'll see the answer appear here once they respond.
          </p>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default AskQuestionModal;
