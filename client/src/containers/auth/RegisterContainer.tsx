import { useState } from "react";
import FormCard from "@components/forms/FormCard";
import ReCAPTCHA from "react-google-recaptcha";
import { authApi } from "@services/auth.api";
import type { RegisterDto } from "@interfaces/auth";
import EmailCard from "@components/forms/EmailCard";

const NAME_REGEX = /^[a-zA-Z\s,.\-]+$/;
const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+=\[\]{};':"\\|<>?0-9]/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

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
    otp?: string;
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
      address?: string;
      captcha?: string;
      general?: string;
    } = {};

    // Name validation
    if (!name) {
      newErrors.name = "Username is required";
    } else if (name.length < 2) {
      newErrors.name = "Username must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name = "Username must be less than 100 characters";
    } else if (!NAME_REGEX.test(name)) {
      newErrors.name = "Username can only contain letters, spaces, and basic punctuation";
    } else if (SPECIAL_CHARS_REGEX.test(name)) {
      newErrors.name = "Username cannot contain numbers or special characters";
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    // OTP validation
    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP must be 6 digits";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 128) {
      newErrors.password = "Password must be less than 128 characters";
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Address validation
    if (!address) {
      newErrors.address = "Address is required";
    } else if (address.length < 10) {
      newErrors.address = "Address must be at least 10 characters";
    } else if (address.length > 200) {
      newErrors.address = "Address must be less than 200 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // reCAPTCHA validation
    if (!recaptchaToken) {
      newErrors.captcha = "Please complete the reCAPTCHA";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length === 0 && recaptchaToken) {
      try {
        const payload: RegisterDto = {
          name,
          email,
          password,
          address: address,
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
      className="p-6 shadow-lg"
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
        <EmailCard
          label="register"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          disabled={false}
          emailError={error.email}
          otpError={error.otp}
          otpValue={otp}
          onOtpChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOtp(e.target.value)
          }
        />,
        {
          label: "Address",
          type: "text",
          value: address,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setAddress(e.target.value),
          isRequired: true,
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
        <ReCAPTCHA
          sitekey={String(import.meta.env.VITE_RECAPTCHA_SITE_KEY)}
          onChange={(token) => setReCaptchaToken(token)}
        />,
      ]}
      buttonProps={{
        label: "REGISTER",
        type: "submit",
        variant: "primary",
      }}
      onSubmit={handleSubmit}
    >
      {/* Error message */}
      {error.captcha && <p className="text-xs text-red-500">{error.captcha}</p>}
      {error.general && <p className="text-xs text-red-500">{error.general}</p>}
    </FormCard>
  );
};

export default RegisterContainer;
