import { useState, useEffect, useRef } from "react";
import InputField from "./InputField";
import Button from "./Button";
import type { EmailCardProps } from "@interfaces/ui";
import type { RequestOtpDto } from "@interfaces/auth";
import { authApi } from "@services/auth.api";

const EmailCard: React.FC<EmailCardProps> = ({
  label,
  value,
  onChange,
  otpValue,
  onOtpChange,
  disabled = false,
  className = "",
  emailError,
  otpError,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Cleanup timer khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendOtp = async () => {
    setError(null);
    setSuccess(null);

    if (!value || !validateEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (countdown > 0) {
      setError(`Please wait ${countdown}s before requesting again.`);
      return;
    }

    setLoading(true);

    // Email gửi OTP phụ thuộc vào ngữ cảnh sử dụng
    if (!label) {
      setError("Internal error: missing label for email context.");
      setLoading(false);
      return;
    }
    const from = label === "register" ? "register" : "reset-password";

    try {
      const payload: RequestOtpDto = { email: value, from };
      const response = await authApi.requestOtp(payload);
      setSuccess(
        response.message || "OTP sent successfully! Check your email."
      );

      // Clear timer cũ nếu có
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Đếm ngược từ 60 giây
      setCountdown(300);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to send OTP. Please try again.");
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row items-start gap-3 ${className}`}>
      <div className="w-full relative md:flex-7 min-w-0">
        <InputField
          label="Email"
          type="email"
          value={value}
          onChange={onChange}
          disabled={disabled}
          isRequired={true}
          error={emailError}
        />
        <div className="absolute -translate-y-1/2 top-5 right-2">
          <Button
            type="button"
            label={
              loading
                ? "Sending..."
                : countdown > 0
                  ? `Resend (${countdown}s)`
                  : "Send OTP"
            }
            onClick={sendOtp}
            disabled={disabled || loading || countdown > 0}
            className="
              text-blue-400!
              bg-transparent
              p-0
              hover:bg-transparent
              hover:underline 
              hover:text-blue-700!
              focus:ring-transparent
              disabled:opacity-50
              disabled:cursor-not-allowed"
          />
        </div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        {success && (
          <div className="text-sm text-green-600 mt-1">{success}</div>
        )}
      </div>

      <div className="w-full md:flex-3 min-w-0">
        <InputField
          label="OTP"
          type="text"
          value={otpValue}
          onChange={onOtpChange}
          disabled={disabled}
          error={otpError}
        />
      </div>
    </div>
  );
};

export default EmailCard;
