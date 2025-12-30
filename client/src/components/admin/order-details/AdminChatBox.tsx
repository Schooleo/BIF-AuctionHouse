import React, { useState, useEffect, useRef } from "react";
import { adminApi, type ChatMessage } from "../../../services/admin.api";
import { useAlertStore } from "../../../stores/useAlertStore";
import { Send, Trash2, User } from "lucide-react";
import ConfirmationModal from "../../ui/ConfirmationModal";

interface AdminChatBoxProps {
  orderId: string;
  initialChat: { messages: ChatMessage[] } | undefined | null;
  onChatUpdate?: (newChat: { messages: ChatMessage[] }) => void;
}

const AdminChatBox: React.FC<AdminChatBoxProps> = ({
  orderId,
  initialChat,
  onChatUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChat?.messages || []
  );
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addAlert } = useAlertStore();

  // Confirmation Modal
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (initialChat?.messages) {
      setMessages(initialChat.messages);
    }
  }, [initialChat]);

  // Polling for new messages
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const order = await adminApi.getOrderDetails(orderId);
        if (order.chat?.messages) {
          setMessages(() => {
            return order.chat?.messages || [];
          });
        }
      } catch (error) {
        console.error("Failed to poll chat updates", error);
      }
    };

    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    // Scroll to bottom on messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const updatedChat = await adminApi.sendAdminMessage(orderId, newMessage);
      setMessages(updatedChat.messages);
      setNewMessage("");
      if (onChatUpdate) onChatUpdate(updatedChat);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to send message";
      addAlert("error", msg);
    } finally {
      setIsSending(false);
    }
  };

  const RequestDeleteMessage = (messageId: string) => {
    setMsgToDelete(messageId);
  };

  const confirmDeleteMessage = async () => {
    if (!msgToDelete) return;

    try {
      await adminApi.deleteAdminMessage(orderId, msgToDelete);
      // Remove locally
      setMessages((prev) => prev.filter((m) => m._id !== msgToDelete));
      addAlert("success", "Message deleted");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to delete message";
      addAlert("error", msg);
    } finally {
      setMsgToDelete(null);
    }
  };

  if (!initialChat) {
    return (
      <div className="p-4 text-center text-gray-400 italic">
        Chat not initialized
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Order Chat</h3>
        <span className="text-xs text-gray-500">
          {messages.length} messages
        </span>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender?.role === "admin" || msg.isAdmin;

            // Alignment
            const alignRight = isAdmin;

            return (
              <div
                key={msg._id}
                className={`flex ${
                  alignRight ? "justify-end" : "justify-start"
                } group`}
              >
                <div
                  className={`max-w-[80%] flex ${
                    alignRight ? "flex-row-reverse" : "flex-row"
                  } gap-2`}
                >
                  {/* Avatar / Icon */}
                  <div className="shrink-0 mt-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAdmin
                          ? "bg-primary-blue text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isAdmin ? (
                        <span className="text-xs font-bold">AD</span>
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`flex flex-col ${
                      alignRight ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {msg.sender?.name ||
                          (isAdmin ? "Administrator" : "User")}
                        {isAdmin && (
                          <span className="ml-1 text-[10px] bg-blue-100 text-blue-800 px-1 rounded">
                            ADMIN
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div
                      className={`relative px-4 py-2 rounded-lg text-sm ${
                        isAdmin
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {msg.content}

                      {/* Delete Button (Visible on hover) */}
                      <button
                        onClick={() => RequestDeleteMessage(msg._id)}
                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message as Admin..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-blue"
        />
        <button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="bg-primary-blue text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={20} />
        </button>
      </form>

      <ConfirmationModal
        isOpen={!!msgToDelete}
        onClose={() => setMsgToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AdminChatBox;
