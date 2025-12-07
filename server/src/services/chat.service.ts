import { Chat } from "../models/chat.model";

export const ChatService = {
  async getChatByOrder(orderId: string, userId: string) {
    const chat = await Chat.findOne({ order: orderId })
      .populate("participants", "name email")
      .populate("messages.sender", "name");

    if (!chat) return null;

    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === userId
    );

    if (!isParticipant) throw new Error("Unauthorized");

    return chat;
  },

  async sendMessage(
    orderId: string,
    userId: string,
    content: string,
    isImage: boolean = false
  ) {
    let chat = await Chat.findOne({ order: orderId });
    if (!chat) throw new Error("Chat not found");

    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId
    );

    if (!isParticipant) throw new Error("Unauthorized to send message");

    const message = {
      sender: userId as any,
      content,
      timestamp: new Date(),
      isImage,
    };

    chat.messages.push(message);
    await chat.save();

    return message;
  },
};
