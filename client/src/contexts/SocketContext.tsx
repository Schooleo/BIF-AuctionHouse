/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  joinProductRoom: (productId: string) => void;
  leaveProductRoom: (productId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: true,
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinProductRoom = (productId: string) => {
    if (socket) {
      socket.emit("join_product", productId);
    }
  };

  const leaveProductRoom = (productId: string) => {
    if (socket) {
      socket.emit("leave_product", productId);
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, joinProductRoom, leaveProductRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
