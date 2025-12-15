import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { User } from "../models/user.model";
import { authService } from "../services/auth.service";

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
        const user = await authService.handleGoogleAuth(profile);
        return done(null, user);
      } catch (error) {
        return done(error as any, false);
      }
    }
  )
);

export default passport;
