import ResetPasswordContainer from "@containers/auth/ResetPasswordContainer";
import { Link } from "react-router-dom";
import ResetPasswordImage from "@img/LoginPage.png";
import BIFLogo from "@img/BIF-logo.png";

const ResetPasswordPage = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div
        className="md:flex-6 bg-cover bg-center bg-no-repeat flex p-1"
        style={{ backgroundImage: `url(${ResetPasswordImage})` }}
      >
        <Link to="/" className="h-30 w-30">
          <img src={BIFLogo} alt="Logo" />
        </Link>
        <div className="flex flex-col p-5">
          <h2 className="font-semibold text-4xl text-black drop-shadow-lg">
            Welcome!
          </h2>
          <p className="text-black mt-2 drop-shadow-lg">
            BIF Auction - Reputable Auction - Bid anytime, bid anywhere
          </p>
        </div>
      </div>

      <div className="md:flex-4 flex flex-col justify-center px-10">
        <ResetPasswordContainer />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
