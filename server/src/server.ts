import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

connectDB();

const PORT = process.env.PORT || 3001;

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
