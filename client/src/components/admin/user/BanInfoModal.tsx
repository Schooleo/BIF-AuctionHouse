import React, { useState } from "react";
import {
  ShieldX,
  ShieldCheck,
  Trash2,
  Clock,
  Mail,
  Calendar,
  MessageSquare,
} from "lucide-react";
import PopUpWindow from "../../ui/PopUpWindow";
import ConfirmationModal from "../../ui/ConfirmationModal";
import type { BannedUser, UnbanRequestData } from "../../../services/admin.api";

interface BanInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: BannedUser | null;
  unbanRequest: UnbanRequestData | null;
  onUnban: () => Promise<void>;
  onDenyRequest: (adminNote?: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isLoading?: boolean;
}

const BanInfoModal: React.FC<BanInfoModalProps> = ({
  isOpen,
  onClose,
  user,
  unbanRequest,
  onUnban,
  onDenyRequest,
  onDeleteAccount,
  isLoading = false,
}) => {
  const [activeAction, setActiveAction] = useState<
    "unban" | "deny" | "delete" | null
  >(null);
  const [denyNote, setDenyNote] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!user) return null;

  const handleUnban = async () => {
    setActiveAction("unban");
    try {
      await onUnban();
      onClose();
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setActiveAction("deny");
    try {
      // If there's a pending unban request, call deny (which force deletes)
      if (unbanRequest && unbanRequest.status === "PENDING") {
        await onDenyRequest(denyNote || undefined);
      } else {
        // Otherwise just delete account directly
        await onDeleteAccount();
      }
      setDenyNote("");
      setIsDeleteConfirmOpen(false);
      onClose();
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <>
      <PopUpWindow
        isOpen={isOpen}
        onClose={onClose}
        title="Ban Details"
        hideFooter
        size="lg"
      >
        <div className="space-y-6">
          {/* User Info Header */}
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-red-200">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-red-500 font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-lg">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail size={12} /> {user.email}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="capitalize px-2 py-0.5 bg-white rounded">
                  {user.role}
                </span>
                {user.blockedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    Banned: {new Date(user.blockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ban Reason Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShieldX size={16} className="text-red-500" />
              Ban Reason
            </h4>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-700">
                {user.blockReason || "No reason provided"}
              </p>
            </div>
          </div>

          {/* Unban Request Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-blue" />
              Unban Request
            </h4>
            {unbanRequest && unbanRequest.status === "PENDING" ? (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    Submitted:{" "}
                    {new Date(unbanRequest.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                    PENDING
                  </span>
                </div>

                {/* Request Title */}
                <h5 className="font-semibold text-gray-800 mb-2">
                  {unbanRequest.title}
                </h5>

                {/* Request Details */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {unbanRequest.details}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  No unban request submitted
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleUnban}
              disabled={isLoading || activeAction !== null}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck size={18} />
              {activeAction === "unban" ? "Processing..." : "Unban User"}
            </button>

            {unbanRequest && unbanRequest.status === "PENDING" ? (
              <button
                onClick={handleDeleteClick}
                disabled={isLoading || activeAction !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                {activeAction === "deny"
                  ? "Processing..."
                  : "Deny & Delete Account"}
              </button>
            ) : (
              <button
                onClick={handleDeleteClick}
                disabled={isLoading || activeAction !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </PopUpWindow>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove all their data.`}
        confirmText={activeAction === "delete" ? "Deleting..." : "Delete User"}
        type="danger"
      />
    </>
  );
};

export default BanInfoModal;
