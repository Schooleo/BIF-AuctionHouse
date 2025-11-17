import { useState } from "react";
import FormCard from "../components/ui/FormCard";

const ResetPasswordContainer = () => {
  const [email, setEmail]  = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{email?: string, password?: string, confirmPassword?: string, captcha?: string}>({});

  const handleSubmit = () => {
    setError({});

    const newErrors: {email?: string, password?: string, confirmPassword?: string, captcha?: string} = {};
    
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm Password is required";
    
    if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length == 0) {
      console.log({
        email,
        password,
      });
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
