import React from "react";

const ErrorMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-16 text-xl text-red-600">{text}</div>
);

export default ErrorMessage;
