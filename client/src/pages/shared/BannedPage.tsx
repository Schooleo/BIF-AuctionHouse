import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import { useAuthStore } from "@stores/useAuthStore";
import { bidderApi } from "@services/bidder.api";

const BannedPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [hasUnbanRequest, setHasUnbanRequest] = useState(false);
  const [unbanRequestStatus, setUnbanRequestStatus] = useState<"PENDING" | "APPROVED" | "DENIED" | null>(null);

  useEffect(() => {
    // Fetch unban request status
    const checkUnbanRequest = async () => {
      try {
        const data = await bidderApi.getUnbanRequestStatus();
        if (data.request) {
          setHasUnbanRequest(true);
          setUnbanRequestStatus(data.request.status);
        }
      } catch (error) {
        console.error("Failed to fetch unban request status:", error);
      }
    };

    if (user?.status === "BLOCKED") {
      checkUnbanRequest();
    }
  }, [user]);

  if (!user || user.status !== "BLOCKED") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">Account Banned</h1>

        {/* Ban Reasons */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">This account has been banned for these reasons:</h2>
          <p className="text-red-700 whitespace-pre-wrap">{user.blockReason || "No reason provided"}</p>
        </div>

        {/* Unban Request Status */}
        <div className="mb-6">
          {!hasUnbanRequest ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">If this ban was unreasonable, please submit an Unban Request.</p>
              <button
                onClick={() => navigate("/unban-request")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Unban Request
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Unban Request Status</h3>
              </div>
              <p className="text-amber-700">
                {unbanRequestStatus === "PENDING" && "Awaiting admin review…"}
                {unbanRequestStatus === "APPROVED" && "Your request has been approved. You will be unbanned shortly."}
                {unbanRequestStatus === "DENIED" && "Your request has been denied."}
              </p>
            </div>
          )}
        </div>

        {/* Account Deletion Notice (Optional - commented out for now) */}
        {/* <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
          <p className="text-gray-700">
            <span className="font-semibold">Notice:</span> This account will be deleted after{" "}
            <span className="font-bold text-red-600">30 days</span>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default BannedPage;
