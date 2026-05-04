import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { Conversation } from "./models/Conversation";
import { Message } from "./models/Message";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on(
      "message:send",
      async (payload: { conversationId: string; senderId: string; body: string }) => {
        if (!payload.conversationId || !payload.senderId || !payload.body?.trim()) {
          return;
        }

        const message = await Message.create({
          conversation: payload.conversationId,
          sender: payload.senderId,
          body: payload.body,
        });

        const populatedMessage = await Message.findById(message.id).populate({
          path: "sender",
          select: "name role team email status",
        });

        await Conversation.findByIdAndUpdate(payload.conversationId, {
          lastMessage: payload.body,
          lastMessageAt: new Date(),
        });

        io.to(payload.conversationId).emit("message:new", populatedMessage);
        io.emit("conversation:updated", { conversationId: payload.conversationId });
      }
    );
  });

  return io;
}
