import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FileText } from "lucide-react";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import { bidderApi } from "@services/bidder.api";

const UnbanRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (title.length < 10 || title.length > 100) {
      setError("Title must be between 10 and 100 characters");
      return;
    }
    if (details.length < 50 || details.length > 500) {
      setError("Details must be between 50 and 500 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await bidderApi.submitUnbanRequest(title, details);
      // Success - show success modal
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    // Redirect to login page
    navigate("/auth/login");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation before showing modal
    if (title.length < 10 || title.length > 100) {
      setError("Title must be between 10 and 100 characters");
      return;
    }
    if (details.length < 50 || details.length > 500) {
      setError("Details must be between 50 and 500 characters");
      return;
    }

    setShowConfirmModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Submit Unban Request</h1>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Important Notice</p>
              <p className="text-amber-700 text-sm">
                You can only submit <span className="font-bold">ONE</span> unban request. Please ensure all information
                is accurate and truthful before submitting.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your request (10-100 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
              required
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Minimum 10 characters</p>
              <p className={`text-xs ${title.length < 10 || title.length > 100 ? "text-red-500" : "text-gray-500"}`}>
                {title.length}/100
              </p>
            </div>
          </div>

          {/* Details Textarea */}
          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide detailed reasons why you believe this ban should be lifted (50-500 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] resize-y"
              maxLength={500}
              required
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Minimum 50 characters</p>
              <p
                className={`text-xs ${details.length < 50 || details.length > 500 ? "text-red-500" : "text-gray-500"}`}
              >
                {details.length}/500
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/banned")}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || title.length < 10 || title.length > 100 || details.length < 50 || details.length > 500
              }
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSubmit}
          title="Confirm Submission"
          message="You can only submit ONE unban request. Are you sure everything is truthful and accurate?"
          confirmText="Yes, Submit"
          cancelText="Review Again"
        />

        {/* Success Modal */}
        <ConfirmationModal
          isOpen={showSuccessModal}
          onClose={handleSuccessConfirm}
          onConfirm={handleSuccessConfirm}
          title="Request Submitted"
          message="Your unban request has been submitted successfully. Please wait for admin review."
          confirmText="OK"
          cancelText=""
          type="success"
        />
      </div>
    </div>
  );
};

export default UnbanRequestPage;
