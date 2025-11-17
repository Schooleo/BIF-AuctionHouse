import { useState } from "react";
import FormCard from "../components/ui/FormCard";
import { authApi } from "@services/auth.api";
import type { ResetPasswordDto } from "@types/auth";

const ResetPasswordContainer = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
    general?: string;
  }>({});

  const handleSubmit = async () => {
    setError({});

    const newErrors: {
      email?: string;
      otp?: string;
      password?: string;
      confirmPassword?: string;
      captcha?: string;
    } = {};

    if (!email) newErrors.email = "Email is required";
    if (!otp) newErrors.otp = "OTP is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length == 0) {
      try {
        const payload: ResetPasswordDto = { email, otp, password };
        const response = await authApi.resetPassword(payload);
        if (response.message) {
          alert(response.message);
          window.location.href = "/auth/login";
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

  return (
    <FormCard
      title="Reset Password"
      className="p-6 shadow-lg flex flex-col gap-2"
      fields={[
        {
          label: "Email",
          type: "email",
          value: email,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value),
          isRequired: true,
          error: error.email,
        },
        {
          label: "OTP",
          type: "text",
          value: otp,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setOtp(e.target.value),
          isRequired: true,
          error: error.otp,
        },
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
          error: error.confirmPassword,
        },
      ]}
      buttonProps={{
        label: "RESET PASSWORD",
        type: "submit",
        variant: "secondary",
      }}
      onSubmit={handleSubmit}
    />
  );
};

export default ResetPasswordContainer;
