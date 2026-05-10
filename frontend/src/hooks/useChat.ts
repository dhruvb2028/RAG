import { useState, useCallback, useEffect } from "react";
import { ChatMessage } from "../lib/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("chat_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const newUserMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: content })
    })
      .then(res => res.json())
      .then(data => {
         const newAiMsg: ChatMessage = {
           id: `msg-${Date.now() + 1}`,
           role: "assistant",
           content: data.answer || data.error || "An error occurred",
           citations: data.sources || [],
           timestamp: Date.now(),
         };
         setMessages((prev) => [...prev, newAiMsg]);
         setIsTyping(false);
      })
      .catch(err => {
         console.error(err);
         const errorMsg: ChatMessage = {
           id: `msg-${Date.now() + 1}`,
           role: "assistant",
           content: "Failed to connect to the backend server.",
           timestamp: Date.now(),
         };
         setMessages((prev) => [...prev, errorMsg]);
         setIsTyping(false);
      });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
  };
}
