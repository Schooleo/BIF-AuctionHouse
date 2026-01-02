import { useState } from "react";
import FormCard from "@components/forms/FormCard";
import ReCAPTCHA from "react-google-recaptcha";
import { authApi } from "@services/auth.api";
import type { RegisterDto } from "@interfaces/auth";
import EmailCard from "@components/forms/EmailCard";
import { useAlertStore } from "@stores/useAlertStore";
import GoogleAuthButton from "@components/ui/GoogleAuthButton";
import { validateUsername, validateEmail, validatePassword, validateAddress, validateOtp } from "@utils/validation";

const RegisterContainer = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [recaptchaToken, setReCaptchaToken] = useState<string | null>(null);
  const { addAlert } = useAlertStore();
  const [error, setError] = useState<{
    name?: string;
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    address?: string;
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
    } = {};

    // Use validation functions from @utils/validation
    const nameError = validateUsername(name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const otpError = validateOtp(otp);
    if (otpError) newErrors.otp = otpError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const addressError = validateAddress(address, true);
    if (addressError) newErrors.address = addressError;

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // reCAPTCHA validation
    if (!recaptchaToken) {
      addAlert("error", "Please complete the reCAPTCHA");
      return;
    }

    setError(newErrors);

    if (Object.keys(newErrors).length === 0) {
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
          // Check if user is banned and redirect to banned page
          if (response.user && response.user.status === "BLOCKED") {
            window.location.href = "/banned";
          } else {
            window.location.href = "/";
          }
        } else {
          addAlert("error", response.message!);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          addAlert("error", err.message);
        } else {
          addAlert("error", "An unknown error occurred");
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
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
          isRequired: true,
          error: error.name,
        },
        <EmailCard
          label="register"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={false}
          emailError={error.email}
          otpError={error.otp}
          otpValue={otp}
          onOtpChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
        />,
        {
          label: "Address",
          type: "text",
          value: address,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value),
          isRequired: true,
          error: error.address,
        },
        {
          label: "Password",
          type: "password",
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
          isRequired: true,
          error: error.password,
        },
        {
          label: "Confirm Password",
          type: "password",
          value: confirmPassword,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value),
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
      {/* PopUpAlert is handled globally, no local errors displayed here unless specialized */}

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <div className="mt-4">
          <GoogleAuthButton text="Sign up with Google" />
        </div>
      </div>
    </FormCard>
  );
};

export default RegisterContainer;
