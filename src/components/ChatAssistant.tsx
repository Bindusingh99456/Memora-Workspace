import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Bot, 
  User, 
  Sparkles, 
  BrainCircuit, 
  Trash2,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  History,
  Menu,
  Plus
} from "lucide-react";
import { Message, Attachment, ChatSession } from "../types";
import WeatherWidget from "./WeatherWidget";
import InteractiveMap from "./InteractiveMap";
import { motion, AnimatePresence } from "motion/react";

interface ChatAssistantProps {
  messages: Message[];
  onSendMessage: (text: string, attachment?: Attachment) => Promise<void>;
  onClearChat: () => void;
  onExecuteAction: (actionData: any) => void;
  sessionPreferences: string[];
  onAddPreference: (pref: string) => void;
  onDeletePreference: (index: number) => void;
  
  // Multi-conversation Props
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export default function ChatAssistant({
  messages,
  onSendMessage,
  onClearChat,
  onExecuteAction,
  sessionPreferences,
  onAddPreference,
  onDeletePreference,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [newPrefInput, setNewPrefInput] = useState("");
  const [showPreferences, setShowPreferences] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Setup Web Speech API for Real voice input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser format. Please use Chrome or Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith("image/");

    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type,
        content: reader.result as string, // base64 payload or text
      });
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !attachment) return;

    const textToSend = inputText;
    const attachmentToSend = attachment || undefined;

    setInputText("");
    setAttachment(null);
    setIsTyping(true);

    try {
      await onSendMessage(textToSend, attachmentToSend);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speaks out Memora AI messages
  const speakMessage = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const cleanText = text.replace(/```[\s\S]*?```/g, ""); // Strip out code blocks from TTS
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Intercept json actions in message
  const renderMessageContent = (message: Message) => {
    // 1. Check for standard action blocks
    const actionRegex = /```json-action\n([\s\S]*?)\n```/g;
    const actionMatch = actionRegex.exec(message.content);

    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        const textBefore = message.content.split("```json-action")[0];

        return (
          <div className="space-y-3">
            <p className="whitespace-pre-line leading-relaxed">{textBefore}</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles size={13} className="animate-pulse" /> Action Request
                </span>
                <span className="text-xs text-slate-500">Memora Suggestion</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-750">
                  <span className="font-medium text-slate-900">Action:</span>{" "}
                  {actionData.action === "ADD_TASK" ? "Create Task Schedule" : actionData.action === "UPDATE_TASK" ? "Update Task" : "Optimize Timeline"}
                </p>
                {actionData.task && (
                  <div className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-emerald-150">
                    <p className="text-emerald-750 font-medium">{actionData.task.title}</p>
                    {actionData.task.duration && <p>Duration: {actionData.task.duration} min</p>}
                    {actionData.task.category && <p>Category: {actionData.task.category}</p>}
                  </div>
                )}
              </div>
              <button
                onClick={() => onExecuteAction(actionData)}
                className="w-full mt-3 py-2 px-3 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg font-medium text-xs transition duration-250 flex items-center justify-center gap-1.5 shadow-sm"
              >
                Approve & Schedule <ArrowRight size={13} />
              </button>
            </div>
          </div>
        );
      } catch (err) {
        // Fallback
      }
    }

    // 2. Check for weather blocks
    const weatherRegex = /```json-weather\n([\s\S]*?)\n```/g;
    const weatherMatch = weatherRegex.exec(message.content);

    if (weatherMatch) {
      try {
        const weatherData = JSON.parse(weatherMatch[1]);
        const textBefore = message.content.split("```json-weather")[0];

        return (
          <div className="space-y-3">
            <p className="whitespace-pre-line leading-relaxed">{textBefore}</p>
            <WeatherWidget 
              city={weatherData.city} 
              latitude={weatherData.latitude} 
              longitude={weatherData.longitude} 
            />
          </div>
        );
      } catch (err) {
        // Fallback
      }
    }

    // 3. Check for map blocks
    const mapRegex = /```json-map\n([\s\S]*?)\n```/g;
    const mapMatch = mapRegex.exec(message.content);

    if (mapMatch) {
      try {
        const mapData = JSON.parse(mapMatch[1]);
        const textBefore = message.content.split("```json-map")[0];

        return (
          <div className="space-y-3">
            <p className="whitespace-pre-line leading-relaxed">{textBefore}</p>
            <InteractiveMap 
              type={mapData.type}
              query={mapData.query}
              center={mapData.center}
              zoom={mapData.zoom}
              origin={mapData.origin}
              destination={mapData.destination}
              originLatLng={mapData.originLatLng}
              destinationLatLng={mapData.destinationLatLng}
            />
          </div>
        );
      } catch (err) {
        // Fallback
      }
    }

    return <p className="whitespace-pre-line leading-relaxed">{message.content}</p>;
  };

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefInput.trim()) return;
    onAddPreference(newPrefInput.trim());
    setNewPrefInput("");
  };

  return (
    <div className="relative flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="chat-assistant-container">
      {/* Sliding History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-slate-900/40 z-30 transition-opacity backdrop-blur-sm"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-72 bg-slate-900 text-white z-40 flex flex-col shadow-2xl border-r border-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono text-xs uppercase tracking-wider">
                  <History size={14} />
                  <span>Chat Chronicles</span>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* New Conversation Button */}
              <div className="p-3">
                <button
                  onClick={() => {
                    onNewSession();
                    setIsHistoryOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer border border-indigo-500/30"
                >
                  <Plus size={14} />
                  <span>New Conversation</span>
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 custom-scrollbar">
                <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider px-2 mb-1">Recent Consultations</p>
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const messageCount = session.messages.length;
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsHistoryOpen(false);
                      }}
                      className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-1 text-left ${
                        isActive
                          ? "bg-slate-800/80 border-indigo-500/50 text-white shadow-inner"
                          : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-350 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 pr-6">
                        <span className="text-xs font-semibold leading-tight line-clamp-2">
                          {session.title || "Untitled Conversation"}
                        </span>
                        
                        {/* Delete Session Button */}
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="absolute right-2 top-2.5 p-1 rounded hover:bg-slate-700/80 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-150"
                          title="Delete conversation"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>{messageCount} {messageCount === 1 ? "message" : "messages"}</span>
                        <span>
                          {(() => {
                            if (!session.createdAt) return new Date().toLocaleDateString([], { month: "short", day: "numeric" });
                            const d = new Date(session.createdAt);
                            return isNaN(d.getTime()) 
                              ? new Date().toLocaleDateString([], { month: "short", day: "numeric" }) 
                              : d.toLocaleDateString([], { month: "short", day: "numeric" });
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer info */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
                <p className="text-[9px] text-slate-500 font-mono">Memora Session Ledger v1.2</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* History / Drawer Toggle Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors relative cursor-pointer flex items-center justify-center"
            title="Open Chat Chronicles History"
          >
            <Menu size={18} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Bot size={22} className="animate-bounce" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-850">Memora AI Companion</h2>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Google Gemini-Powered Agent</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Output Settings */}
          <button
            onClick={() => {
              setSpeechEnabled(!speechEnabled);
              if (speechEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2 rounded-lg transition-colors ${speechEnabled ? "bg-blue-50 text-blue-600 border border-blue-150" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
            title={speechEnabled ? "Mute Voice Output" : "Enable Voice Output (TTS)"}
          >
            {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Settings / Preferences Toggle */}
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className={`p-2 rounded-lg transition-colors ${showPreferences ? "bg-slate-200 text-blue-600" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
            title="Brain Memory / Context Rules"
          >
            <BrainCircuit size={18} />
          </button>

          {/* Reset Conversation */}
          <button
            onClick={onClearChat}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-rose-600 transition-colors"
            title="Reset Chat History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Preferences / Memory Shelf */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <BrainCircuit size={13} className="text-blue-600" /> Continuous Session Memory
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono border border-blue-250">
                Active Context
              </span>
            </div>
            
            {sessionPreferences.length === 0 ? (
              <p className="text-xs text-slate-400 italic mb-2">
                No preferences captured yet. Speak naturally (e.g. "I prefer focused morning sessions") to teach Memora AI.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto mb-2 pr-1 custom-scrollbar">
                {sessionPreferences.map((pref, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md hover:border-blue-500/35 transition-colors"
                  >
                    <span>{pref}</span>
                    <button
                      onClick={() => onDeletePreference(i)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddPreference} className="flex gap-2">
              <input
                type="text"
                placeholder="Teach preference manually (e.g., 'Break every 50 mins')"
                value={newPrefInput}
                onChange={(e) => setNewPrefInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs transition-colors font-medium flex items-center gap-1"
              >
                Learn
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Sandbox */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Bot size={44} className="text-slate-300 mb-3 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-700 mb-1.5">Welcome to Memora AI Workspace</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              I am your conversational, context-aware scheduling partner. You can type instructions, speak naturally, or attach logs, images, and daily plan sheets.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-xs">
              <button
                onClick={() => setInputText("How do I plan an efficient day using machine learning prediction?")}
                className="text-left text-xs bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-slate-600 hover:text-slate-800 transition-all flex items-center justify-between"
              >
                <span>💡 "How do I plan an efficient day?"</span>
                <Play size={10} />
              </button>
              <button
                onClick={() => setInputText("Remind me to finish coding at 3:00 PM. Category is Work.")}
                className="text-left text-xs bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-slate-600 hover:text-slate-800 transition-all flex items-center justify-between"
              >
                <span>📅 "Remind me to finish coding..."</span>
                <Play size={10} />
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isMe ? "justify-end animate-fade-in-right" : "justify-start animate-fade-in-left"}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                <div className="max-w-[85%] space-y-1">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-mono font-medium text-slate-400">
                      {isMe ? "You" : "Memora AI"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isMe && speechEnabled && (
                      <button 
                        onClick={() => speakMessage(message.content)}
                        className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                        title="Speak aloud"
                      >
                        <Volume2 size={10} />
                      </button>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl border text-xs shadow-sm ${
                      isMe
                        ? "bg-blue-600 border-blue-500 text-white rounded-tr-none"
                        : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {message.attachment && (
                      <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {message.attachment.type.startsWith("image/") ? (
                            <img 
                              src={message.attachment.content} 
                              alt="attached payload" 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                              <FileText size={18} />
                            </div>
                          )}
                          <div className="text-left overflow-hidden">
                            <p className="text-[11px] font-medium text-slate-700 truncate max-w-[150px]">
                              {message.attachment.name}
                            </p>
                            <p className="text-[9px] text-slate-450 font-mono">
                              {message.attachment.size}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {renderMessageContent(message)}
                  </div>
                </div>
                {isMe && (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2">
        {/* Active attachment display */}
        <AnimatePresence>
          {attachment && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {attachment.type.startsWith("image/") ? (
                  <div className="relative">
                    <img 
                      src={attachment.content} 
                      alt="attachment preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center text-[8px] text-white font-mono">
                      IMG
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FileText size={18} />
                  </div>
                )}
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                    {attachment.name}
                  </p>
                  <p className="text-[10px] text-slate-450 font-mono">{attachment.size}</p>
                </div>
              </div>
              <button
                onClick={() => setAttachment(null)}
                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* File Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            title="Attach Image or Text Document"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,text/*"
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Memora to schedule, predict, or optimize..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white resize-none h-10 custom-scrollbar placeholder:text-slate-400"
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>

          {/* Voice Mic Input */}
          <button
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
            title={isRecording ? "Recording... Click to stop" : "Speak to Write"}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() && !attachment}
            className={`p-2.5 rounded-xl transition-all ${
              inputText.trim() || attachment
                ? "bg-blue-600 hover:bg-blue-750 text-white shadow-sm"
                : "bg-slate-50 border border-slate-200 text-slate-300 cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
