import React from "react";

const EmptyMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-16 text-2xl italic text-primary-blue">
    {text}
  </div>
);

export default EmptyMessage;
