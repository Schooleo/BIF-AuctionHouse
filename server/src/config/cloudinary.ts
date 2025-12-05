import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

console.log("Initializing Cloudinary Config...");

if (env.CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = env.CLOUDINARY_URL;
}

cloudinary.config({
  secure: true,
});

export default cloudinary;
