import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";
import Icon from "@img/unauthorized-icon.png";

const UnauthorizedIllustration = () => (
  <img src={Icon} alt="Unauthorized" className="w-48 h-48 mb-8" />
);

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 min-h-[70vh] bg-white">
      <UnauthorizedIllustration />

      <h1 className="text-5xl font-bold text-gray-700 mb-3">Access Denied</h1>

      <p className="text-xl text-gray-500 mb-8">
        {user
          ? "You do not have permission to view this page."
          : "You must be logged in to view this page."}
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-block bg-gray-500 text-white font-semibold text-lg py-3 px-8 rounded-md hover:bg-gray-600 transition-colors duration-300 shadow hover:shadow-md"
        >
          Go Back
        </button>
        {!user && (
          <button
            onClick={() => navigate("/auth/login")}
            className="inline-block bg-primary-blue text-white font-semibold text-lg py-3 px-8 rounded-md hover:bg-blue-900 transition-colors duration-300 shadow hover:shadow-md"
          >
            Log In
          </button>
        )}
      </div>
    </div>
  );
};

export default UnauthorizedPage;
