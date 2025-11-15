import express from "express";
import cors from "cors";
import morgan from "morgan";
import passport from "./config/passport";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

export default app;
