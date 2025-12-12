import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "./config/env";

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow all for now, or match client URL
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join product room
    socket.on("join_product", (productId: string) => {
      socket.join(`product_${productId}`);
      console.log(`Socket ${socket.id} joined product_${productId}`);
    });

    socket.on("leave_product", (productId: string) => {
      socket.leave(`product_${productId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
