import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useRealTimeMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Load existing messages
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error) setMessages(data);
    }

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return messages;
}