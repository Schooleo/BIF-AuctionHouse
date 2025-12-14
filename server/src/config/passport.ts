import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { User } from "../models/user.model";
import * as crypto from "crypto";

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.id).select("-password");
      if (!user) return done(null, false);
      return done(null, user);
    } catch (error) {
      done(error, false);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found from Google profile"));
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // Nếu user đã tồn tại nhưng không có googleId -> Đã đăng ký bằng password -> Chặn
          if (!existingUser.googleId) {
            return done(
              null,
              false,
              { message: "Email already registered with password" } as any
            );
          }
          // Nếu đã có googleId -> Login thành công
          return done(null, existingUser);
        }

        // Tạo user mới
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 số
        let baseName = profile.displayName.replace(/[^a-zA-Z0-9]/g, ""); // Bỏ ký tự đặc biệt
        if (baseName.length > 10) baseName = baseName.substring(0, 10); // Cắt còn 10 ký tự
        const username = `${baseName}${randomDigits}`; // Tổng tối đa 14-15 ký tự

        // Random password phức tạp
        const randomPassword = crypto.randomBytes(16).toString("hex");

        const newUser = await User.create({
          name: username,
          email: email,
          password: randomPassword,
          googleId: profile.id,
          role: "bidder",
          address: "", // Optional
        });

        return done(null, newUser);
      } catch (error) {
        return done(error as any, false);
      }
    }
  )
);

export default passport;
