import { useState } from "react";
import FormCard from "@components/forms/FormCard";
import { authApi } from "@services/auth.api";
import type { LoginDto } from "@interfaces/auth";

const LoginContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleSubmit = async () => {
    const newErrors: {
      email?: string;
      password?: string;
      general?: string;
    } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setError(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const payload: LoginDto = { email, password };
        const response = await authApi.login(payload);
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
      title="Login"
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
          error: error.password ? error.password : error.general,
        },
      ]}
      buttonProps={{ label: "LOGIN", variant: "primary", type: "submit" }}
      className="p-6 shadow-lg"
      onSubmit={handleSubmit}
    />
  );
};

export default LoginContainer;
