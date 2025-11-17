import { useState } from "react";
import FormCard from "@components/ui/FormCard";
import ReCAPTCHA from "react-google-recaptcha";
import { authApi } from "@services/auth.api";
import type { RegisterDto } from "@types/auth";

const RegisterContainer = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [recaptchaToken, setReCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    address?: string;
    captcha?: string;
    general?: string;
  }>({});

  const handleSubmit = async () => {
    setError({});

    const newErrors: {
      name?: string;
      email?: string;
      otp?: string;
      password?: string;
      confirmPassword?: string;
      captcha?: string;
      general?: string;
    } = {};

    if (!name) newErrors.name = "Username is required";
    if (!email) newErrors.email = "Email is required";
    if (!otp) newErrors.otp = "OTP is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";
    if (!recaptchaToken) newErrors.captcha = "Please complete the reCAPTCHA";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length === 0 && recaptchaToken) {
      try {
        const payload: RegisterDto = {
          name,
          email,
          password,
          address: address || undefined,
          otp,
          recaptchaToken,
        };
        const response = await authApi.register(payload);
        if (response.token) {
          localStorage.setItem("token", response.token);
          window.location.href = "/";
        } else {
          setError({ general: response.message });
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
      title="Sign Up"
      className="p-6 shadow-lg flex flex-col gap-2"
      fields={[
        {
          label: "Username",
          type: "text",
          value: name,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value),
          isRequired: true,
          error: error.name,
        },
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
          error: error.general,
        },
        {
          label: "Address",
          type: "text",
          value: address,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setAddress(e.target.value),
          isRequired: false,
          error: error.address,
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
        label: "REGISTER",
        type: "submit",
        variant: "secondary",
      }}
      onSubmit={handleSubmit}
    >
      {/* reCAPTCHA */}
      <div className="mt-5">
        <ReCAPTCHA
          sitekey={String(import.meta.env.VITE_RECAPTCHA_SITE_KEY)}
          onChange={(token) => setReCaptchaToken(token)}
        />
      </div>

      {/* Error message */}
      {error.captcha && <p className="text-red-500 mt-3">{error.captcha}</p>}
    </FormCard>
  );
};

export default RegisterContainer;
