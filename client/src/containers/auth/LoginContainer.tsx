import { useState, useEffect, useRef } from "react";
import FormCard from "@components/forms/FormCard";
import { authApi } from "@services/auth.api";
import type { LoginDto } from "@interfaces/auth";
import { useSearchParams } from "react-router-dom";
import { useAlertStore } from "@stores/useAlertStore";
import GoogleAuthButton from "@components/ui/GoogleAuthButton";

const LoginContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { addAlert } = useAlertStore();
  const [error, setError] = useState<{
    email?: string;
    password?: string;
  }>({});
  
  // Ref để chặn việc hiển thị alert 2 lần do React Strict Mode
  const errorHandled = useRef(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam && !errorHandled.current) {
      addAlert("error", decodeURIComponent(errorParam));
      // Đánh dấu đã xử lý để lần render thứ 2 (của StrictMode) không chạy lại
      errorHandled.current = true; 
      
      // Clean URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, addAlert]);

  const handleSubmit = async () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    setError(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const payload: LoginDto = { email, password };
        const response = await authApi.login(payload);
        if (response.token) {
          localStorage.setItem("token", response.token);
          window.location.href = "/";
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
          error: error.password,
        },
      ]}
      buttonProps={{ label: "LOGIN", variant: "primary", type: "submit" }}
      className="p-6 shadow-lg"
      onSubmit={handleSubmit}
    >
      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-4">
          <GoogleAuthButton text="Login with Google" />
        </div>
      </div>
    </FormCard>
  );
};

export default LoginContainer;
