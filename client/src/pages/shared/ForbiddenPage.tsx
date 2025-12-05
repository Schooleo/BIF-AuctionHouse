import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@img/forbidden-icon.png";

const ForbiddenIllustration = () => (
  <img src={Icon} alt="Forbidden" className="w-60 h-60 mb-8" />
);

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 min-h-screen bg-white">
      <ForbiddenIllustration />

      <h1 className="text-5xl font-bold text-gray-700 mb-3">
        Access Forbidden
      </h1>

      <p className="text-xl text-gray-500 mb-8">
        You are forbidden from access
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-block bg-primary-blue/80 text-white font-semibold text-lg py-3 px-8 rounded-md hover:bg-primary-blue transition-colors duration-300 shadow hover:shadow-md"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
