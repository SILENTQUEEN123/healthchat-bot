import { useState, useEffect } from "react";
import API from "../api";
import "./Chat.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchSessions();
      const storedId = localStorage.getItem("sessionId");
      if (storedId) {
        try {
          await loadChatSession(storedId);
        } catch {
          localStorage.removeItem("sessionId");
          setSessionId("");
          setMessages([]);
        }
      }
      if (!sessionId) {
        const latest = await API.get("/chat/sessions");
        if (latest.data.length > 0 && isMounted) {
          const lastSession = latest.data[latest.data.length - 1];
          await loadChatSession(lastSession.chat_id);
          localStorage.setItem("sessionId", lastSession.chat_id);
        }
      }
      if (isMounted) setInitialLoadComplete(true);
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const fetchSessions = async () => {
    const res = await API.get("/chat/sessions");
    setSessions(res.data);
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const res = await API.post("/chat/create", { name: "New Session" });
      setSessionId(res.data.chat_id);
      setMessages([]);
      await fetchSessions();
      localStorage.setItem("sessionId", res.data.chat_id);
    } finally {
      setLoading(false);
    }
  };

  const loadChatSession = async (id) => {
    setLoading(true);
    try {
      const res = await API.get(`/chat/${id}`);
      setSessionId(res.data.chat_id);
      setMessages(res.data.messages || []);
      localStorage.setItem("sessionId", res.data.chat_id);
    } catch {
      localStorage.removeItem("sessionId");
      setSessionId("");
      setMessages([]);
      alert("Failed to load chat session.");
      await fetchSessions();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Delete this chat?")) {
      setLoading(true);
      try {
        await API.delete(`/chat/${chatId}`);
        if (chatId === sessionId) {
          setSessionId("");
          setMessages([]);
          localStorage.removeItem("sessionId");
        }
        await fetchSessions();
      } finally {
        setLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = { role: "USER", message: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await API.post("/chat", {
        message: userMsg.message,
        session_id: sessionId,
      });
      const botMsg = { role: "BOT", message: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "BOT", message: "⚠️ Unable to respond. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedText(messages[index].message);
  };

  const saveEditedMessage = async () => {
    if (!editedText.trim()) return;
    setLoading(true);
    try {
      await API.put("/chat/edit-message", {
        chat_id: sessionId,
        index: editingIndex,
        new_message: editedText,
      });

      const updated = [...messages];
      updated[editingIndex].message = editedText;
      const rebuilt = updated.slice(0, editingIndex + 1);
      const userMsgs = updated.slice(editingIndex + 1).filter((m) => m.role === "USER");

      const botReplies = await Promise.all(
        userMsgs.map((msg) =>
          API.post("/chat", {
            message: msg.message,
            session_id: sessionId,
          })
        )
      );

      userMsgs.forEach((msg, i) => {
        rebuilt.push(msg);
        rebuilt.push({ role: "BOT", message: botReplies[i].data.reply });
      });

      setMessages(rebuilt);
      setEditingIndex(null);
      setEditedText("");
    } catch {
      alert("Editing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!initialLoadComplete) {
    return (
      <div className="layout loading-screen">
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Chats</h3>
        <button onClick={startNewChat} className="new-chat-button" disabled={loading}>
          {loading ? "Creating..." : "+ New Chat"}
        </button>
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.chat_id} className={`session-item ${sessionId === s.chat_id ? "active" : ""}`}>
              <span onClick={() => loadChatSession(s.chat_id)} className="session-name">
                {s.name}
              </span>
              <button
                onClick={() => handleDeleteChat(s.chat_id)}
                className="delete-button"
                disabled={loading}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      {sessionId ? (
        <div className="chat-area">
          <h2>Healthcare Chatbot</h2>
          <div className="chat-box">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role.toLowerCase()}`}>
                <strong>{m.role === "USER" ? "You" : "Bot"}:</strong>
                {editingIndex === i ? (
                  <>
                    <input
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="edit-input"
                    />
                    <button onClick={saveEditedMessage} className="save-button" disabled={loading}>
                      💾 Save
                    </button>
                  </>
                ) : (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.message}</ReactMarkdown>
                    {m.role === "USER" && (
                      <button onClick={() => handleEdit(i)} className="edit-button" disabled={loading}>
                        ✏️ Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            {loading && <p className="loading">Typing...</p>}
          </div>

          <div className="input-container">
            <input
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) sendMessage();
              }}
              disabled={loading}
            />
            <button className="send-button" onClick={sendMessage} disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <div className="no-chat-selected">
          <p>Welcome! Start a new conversation.</p>
          <button onClick={startNewChat} className="new-chat-button" disabled={loading}>
            + Start New Chat
          </button>
        </div>
      )}
    </div>
  );
}
