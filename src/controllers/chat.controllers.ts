import type { Context } from "hono";
import { ChatService } from "../services/chat.service.js";

export class ChatController {
  static async sendMessage(c: Context) {
    try {
      const userId = c.get("userId");
      const { receiverId, message, messageType = "text" } = await c.req.json();

      if (!receiverId || !message) {
        return c.json({ error: "Receiver ID and message are required" }, 400);
      }

      // No need to convert message to Buffer here, pass as string
      const sentMessage = await ChatService.sendMessage(
        userId,
        receiverId,
        messageType,
        message
      );

      return c.json({ message: sentMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      return c.json({ error: "Failed to send message" }, 500);
    }
  }

  static async getConversations(c: Context) {
    try {
      const userId = c.get("userId");
      const conversations = await ChatService.getConversations(userId);

      return c.json({ conversations });
    } catch (error) {
      console.error("Error getting conversations:", error);
      return c.json({ error: "Failed to get conversations" }, 500);
    }
  }

  static async getMessages(c: Context) {
    try {
      const userId = c.get("userId");
      const conversationId = BigInt(c.req.param("conversationId"));
      const limit = parseInt(c.req.query("limit") || "50");
      const offset = parseInt(c.req.query("offset") || "0");

      const messages = await ChatService.getMessages(
        conversationId,
        userId,
        limit,
        offset
      );

      return c.json({ messages });
    } catch (error) {
      console.error("Error getting messages:", error);
      return c.json({ error: "Failed to get messages" }, 500);
    }
  }

  static async markAsRead(c: Context) {
    try {
      const userId = c.get("userId");
      const conversationId = BigInt(c.req.param("conversationId"));

      await ChatService.markAsRead(conversationId, userId);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error marking as read:", error);
      return c.json({ error: "Failed to mark as read" }, 500);
    }
  }
}
