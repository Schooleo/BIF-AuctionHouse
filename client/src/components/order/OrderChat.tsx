import React, { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";
import { useAlertStore } from "@stores/useAlertStore";
import { useAuthStore } from "@stores/useAuthStore";
import { orderApi } from "@services/order.api";
import type { Chat } from "@interfaces/order";

interface OrderChatProps {
  orderId: string;
}

const OrderChat: React.FC<OrderChatProps> = ({ orderId }) => {
  const { user } = useAuthStore();
  const addAlert = useAlertStore((state) => state.addAlert);
  const [chat, setChat] = useState<Chat | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const data = await orderApi.getChat(orderId);
        setChat(data);
      } catch (error) {
        console.error("Failed to load chat", error);
      }
    };
    loadChat();
    const interval = setInterval(loadChat, 5000); // Polling every 5s for simplicity
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setSending(true);
    try {
      const newMsg = await orderApi.sendMessage(orderId, inputText);
      // Optimistic update or just reload
      setChat((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      setInputText("");
    } catch (error) {
      console.error("Failed to send message", error);
      addAlert("error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat)
    return <div className="p-4 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
        <h3 className="font-bold text-gray-800">Messages</h3>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white space-y-3">
        {chat.messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 mt-10">
            Start a conversation...
          </div>
        ) : (
          chat.messages.map((msg) => {
            const senderId =
              typeof msg.sender === "object" && msg.sender?._id
                ? msg.sender._id.toString()
                : typeof msg.sender === "string"
                  ? msg.sender
                  : null;

            const isMe = user && senderId && senderId === user.id;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap ${
                    isMe
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span
                    className={`text-[10px] block mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderChat;
