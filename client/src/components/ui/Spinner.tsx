import { LoaderCircle } from "lucide-react";

interface SpinnerProps {
  color?: string;
  size?: number;
}

const Spinner = ({ color, size }: SpinnerProps) => {
  color = color || "primary-blue";
  size = size || 30;

  return (
    <div className="flex justify-center items-center">
      <LoaderCircle className={`animate-spin text-${color}`} size={size} />
    </div>
  );
};

export default Spinner;
