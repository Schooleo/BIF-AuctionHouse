import React from "react";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import type { OrderUserInfo } from "@interfaces/admin";

interface UserProfileSectionProps {
  user: OrderUserInfo | null | undefined;
  role: "Seller" | "Bidder";
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  user,
  role,
}) => {
  // If user is null, show deleted state
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {role} Profile
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center overflow-hidden shrink-0 border border-red-100">
            <User size={32} className="text-red-300" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-red-500 truncate">Deleted User</p>
            <p className="text-sm text-gray-400 italic">
              User has been removed
            </p>
          </div>
        </div>
      </div>
    );
  }

  let repValue = 0;
  if (user.reputation !== undefined) repValue = user.reputation as number;
  else if (user.reputationScore !== undefined)
    repValue = user.reputationScore as number;
  else if (user.rating !== undefined) repValue = user.rating as number;

  const displayRep =
    repValue <= 1 && repValue > 0
      ? `${(repValue * 100).toFixed(0)}%`
      : repValue;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {role} Profile
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={32} className="text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          {user._id ? (
            <Link
              to={`/admin/users/${user._id}`}
              className="font-medium text-blue-600 hover:underline truncate block"
              title={user.name}
            >
              {user.name || "Unknown Name"}
            </Link>
          ) : (
            <p className="font-medium text-gray-900 truncate" title={user.name}>
              {user.name || "Unknown Name"}
            </p>
          )}

          <p className="text-sm text-gray-500 truncate" title={user.email}>
            {user.email || "No Email"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              Reputation: {" " + displayRep}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSection;
