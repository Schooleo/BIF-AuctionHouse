import axios from "axios";
import { env } from "../config/env";

export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  if (!env.RECAPTCHA_SECRET_KEY) {
    throw new Error("Missing reCAPTCHA secret key");
  }

  const googleURL = `https://www.google.com/recaptcha/api/siteverify`;

  const response = await axios.post(googleURL, null, {
    params: {
      secret: env.RECAPTCHA_SECRET_KEY,
      response: token,
    },
  });

  return response.data.success === true;
};
