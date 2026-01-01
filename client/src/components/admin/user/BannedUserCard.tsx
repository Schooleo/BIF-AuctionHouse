import React from "react";
import { ShieldX, Clock, Mail } from "lucide-react";
import type { BannedUser } from "../../../services/admin.api";

interface BannedUserCardProps {
  user: BannedUser;
  onClick: () => void;
}

const BannedUserCard: React.FC<BannedUserCardProps> = ({ user, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-red-500 font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
              {user.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
              {user.role}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <Mail size={12} />
            <span className="truncate">{user.email}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={10} />
            <span>
              Banned:{" "}
              {user.blockedAt
                ? new Date(user.blockedAt).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>

        {/* Request Status Badge */}
        <div className="flex-shrink-0">
          {user.hasUnbanRequest ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200">
              <Clock size={12} />
              Pending Request
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-medium border border-gray-200">
              <ShieldX size={12} />
              No Request
            </span>
          )}
        </div>
      </div>

      {/* Ban Reason Preview */}
      {user.blockReason && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Reason:</span>{" "}
            <span className="line-clamp-1">{user.blockReason}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BannedUserCard;
