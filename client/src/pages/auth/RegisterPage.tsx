import RegisterContainer from "@containers/auth/RegisterContainer";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  return (
    <>
      <RegisterContainer />

      <p className="mt-4 text-center">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-blue-500 hover:underline">
          Sign In
        </Link>
      </p>
    </>
  );
};

export default RegisterPage;
