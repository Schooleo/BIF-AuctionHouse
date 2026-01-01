import React, { useState } from "react";
import {
  ShieldX,
  ShieldCheck,
  Trash2,
  Clock,
  X,
  Mail,
  Calendar,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import PopUpWindow from "../../ui/PopUpWindow";
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleDeny = async () => {
    setActiveAction("deny");
    try {
      await onDenyRequest(denyNote || undefined);
      setDenyNote("");
      onClose();
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setActiveAction("delete");
    try {
      await onDeleteAccount();
      onClose();
    } finally {
      setActiveAction(null);
      setConfirmDelete(false);
    }
  };

  return (
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
            <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
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
              <p className="text-sm text-gray-700">{unbanRequest.reason}</p>

              {/* Deny note input */}
              <div className="mt-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Admin note (optional for deny):
                </label>
                <textarea
                  value={denyNote}
                  onChange={(e) => setDenyNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                  rows={2}
                  placeholder="Add a note explaining the denial..."
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                No unban request submitted
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <strong>Warning:</strong> This will permanently delete the account
              and all associated data. This action cannot be undone.
            </p>
          </div>
        )}

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

          {unbanRequest && unbanRequest.status === "PENDING" && (
            <button
              onClick={handleDeny}
              disabled={isLoading || activeAction !== null}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
              {activeAction === "deny" ? "Processing..." : "Deny Request"}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isLoading || activeAction !== null}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
            {confirmDelete
              ? activeAction === "delete"
                ? "Deleting..."
                : "Confirm Delete"
              : "Delete Account"}
          </button>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default BanInfoModal;
