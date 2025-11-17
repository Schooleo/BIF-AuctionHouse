import { useState } from "react";
import FormCard from "../components/ui/FormCard";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterContainer = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail]  = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<{username?: string, email?: string, password?: string, confirmPassword?: string, captcha?: string}>({});

  const handleSubmit = () => {
    setError({});

    const newErrors: {username?: string, email?: string, password?: string, confirmPassword?: string, captcha?: string} = {};
    
    if (!username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm Password is required";
    if (!captchaToken) newErrors.captcha = "Please complete the reCAPTCHA";
    
    if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length == 0) {
      console.log({
        username,
        email,
        password,
        captchaToken,
      });
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
            value: username,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value),
            isRequired: true,
            error: error.username,
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
            onChange={(token) => setCaptchaToken(token)}
          />
        </div>

        {/* Error message */}
        {error.captcha && <p className="text-red-500 mt-3">{error.captcha}</p>}
      
    </FormCard>
  );
};

export default RegisterContainer;
