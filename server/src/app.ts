import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.routes";
import uploadRoutes from "./routes/upload.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Cài đặt routes
app.use("/api", routes);
app.use("/api/upload", uploadRoutes);

// Global: xử lý route không tìm thấy
app.use(notFound);

// Global: xử lý lỗi
app.use(errorHandler);

export default app;
