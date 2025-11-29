import LoginContainer from "@containers/auth/LoginContainer";
import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <>
      <LoginContainer />

      <Link
        to="/auth/reset-password"
        className="mt-4 text-sm text-gray-600 cursor-pointer hover:underline"
      >
        Forgot Password?
      </Link>

      <p className="mt-4 text-center">
        New to BIF?{" "}
        <Link to="/auth/register" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
