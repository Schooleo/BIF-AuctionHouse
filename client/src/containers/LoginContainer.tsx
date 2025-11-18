import { useState } from "react";
import FormCard from "@components/ui/FormCard";
import { authApi } from "@services/auth.api";
import type { LoginDto } from "@types/auth";

const LoginContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleSubmit = async () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {

      try {
        const payload: LoginDto = { email, password };
        const response = await authApi.login(payload);
        if (response.token) {
          localStorage.setItem("token", response.token);
          window.location.href = "/";
        } else {
          setErrors({ general: response.message });
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrors({ general: err.message });
        } else {
          setErrors({ general: "An unknown error occurred" });
        }
      }
    }
  };

  return (
    <FormCard
      title="Login"
      fields={[
        {
          label: "Email",
          type: "email",
          value: email,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value),
          isRequired: true,
          error: errors.email,
        },
        {
          label: "Password",
          type: "password",
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value),
          isRequired: true,
          error: errors.password,
        },
      ]}
      buttonProps={{ label: "LOGIN", variant: "primary", type: "submit" }}
      className="p-6 shadow-lg"
      onSubmit={handleSubmit}
    />
  );
};

export default LoginContainer;
