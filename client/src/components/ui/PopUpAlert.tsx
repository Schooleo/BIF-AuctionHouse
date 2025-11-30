import { useEffect } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertProps {
  id: string;
  type: AlertType;
  message: string;
  onClose: (id: string) => void;
}

const PopUpAlert: React.FC<AlertProps> = ({ id, type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  // Cấu hình cho từng type
  const alertConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-500",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-500",
    },
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${config.bgColor} ${config.borderColor}
        animate-in slide-in-from-right duration-300
        max-w-md w-full
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />

      <p className={`flex-1 text-sm font-medium ${config.textColor}`}>
        {message}
      </p>

      <button
        onClick={() => onClose(id)}
        className={`${config.textColor} hover:opacity-70 transition-opacity shrink-0`}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PopUpAlert;
