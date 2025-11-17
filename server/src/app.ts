import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Cài đặt routes
app.use("/api", routes);

// Global: xử lý route không tìm thấy
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global: xử lý lỗi
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  }
);

export default app;
