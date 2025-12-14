import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormCard from "@components/forms/FormCard";
import { authApi } from "@services/auth.api";
import type { ResetPasswordDto } from "@interfaces/auth";
import EmailCard from "@components/forms/EmailCard";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import { validateEmail, validateOtp, validatePassword } from "@utils/validation";

const ResetPasswordContainer = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
    general?: string;
  }>({});

  // Dùng để điều hướng sau khi đặt lại mật khẩu thành công
  const Navigate = useNavigate();

  const handleSubmit = async () => {
    setError({});

    const newErrors: {
      email?: string;
      otp?: string;
      password?: string;
      confirmPassword?: string;
      captcha?: string;
    } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const otpError = validateOtp(otp);
    if (otpError) newErrors.otp = otpError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const payload: ResetPasswordDto = { email, otp, password };
        const response = await authApi.resetPassword(payload);
        if (response.message) {
          setShowSuccessModal(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError({ general: err.message });
        } else {
          setError({ general: "An unknown error occurred" });
        }
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    Navigate("/auth/login");
  };

  return (
    <>
      <FormCard
        title="Reset Password"
        className="p-6 shadow-lg flex flex-col gap-2"
        fields={[
          <EmailCard
            label="reset-password"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            otpValue={otp}
            onOtpChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setOtp(e.target.value)
            }
            emailError={error.email}
            otpError={error.otp}
          />,
          {
            label: "Password",
            type: "password",
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value),
            isRequired: true,
            error: error.password,
          },
          {
            label: "Confirm Password",
            type: "password",
            value: confirmPassword,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value),
            isRequired: true,
            error: error.confirmPassword
              ? error.confirmPassword
              : error.general,
          },
        ]}
        buttonProps={{
          label: "RESET PASSWORD",
          type: "submit",
          variant: "primary",
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title="Success"
        message="Your password has been changed successfully!"
        confirmText="Login Now"
        cancelText="Close"
        type="success"
      />
    </>
  );
};

export default ResetPasswordContainer;
