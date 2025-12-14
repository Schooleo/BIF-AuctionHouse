import { useState, useEffect } from "react";
import FormCard from "@components/forms/FormCard";
import { authApi } from "@services/auth.api";
import type { LoginDto } from "@interfaces/auth";
import { useSearchParams } from "react-router-dom";

const LoginContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError({ general: decodeURIComponent(errorParam) });
      // Clean URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    const newErrors: {
      email?: string;
      password?: string;
      general?: string;
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

        <button
          type="button"
          onClick={() => {
            window.location.href = `${
              import.meta.env.VITE_APP_API_URL || "http://localhost:4000"
            }/api/auth/google`;
          }}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="h-5 w-5 mr-2"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.48 10.92v2.16h5.88c-.6 3.12-3.48 5.4-6.48 5.4-3.72 0-6.72-3-6.72-6.72 0-3.72 3-6.72 6.72-6.72 1.68 0 3.24.6 4.44 1.56l1.56-1.56C16.44 3.72 14.52 3 12.48 3 7.56 3 3.6 6.96 3.6 11.88s3.96 8.88 8.88 8.88c4.2 0 7.8-3 8.76-6.96V10.92h-8.76z" />
          </svg>
          Google
        </button>
      </div>
    </FormCard>
  );
};

export default LoginContainer;
