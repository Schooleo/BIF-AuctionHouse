import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import User from "../models/User";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username });
    if (!user) return done(null, false);
    const match = await bcrypt.compare(password, user.password || "");
    return match ? done(null, user) : done(null, false);
  })
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err: any, user: any) => done(err, user));
});

export default passport;
