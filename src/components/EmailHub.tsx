import React, { useState } from "react";
import { 
  Mail, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Inbox, 
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus
} from "lucide-react";
import { Task } from "../types";

interface EmailTemplate {
  id: string;
  from: string;
  subject: string;
  body: string;
  label: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    label: "🚨 Urgent Security Hotfix (Work / High)",
    from: "cto@company.com",
    subject: "URGENT: Deploy security fix for CORS session leaks",
    body: "Hi team, we found a high severity CORS leak in the production container configurations. Please audit package.json, verify our Express CORS middlewares, and rebuild the bundle today. This is critical for customer privacy. It should take around 60 minutes to deploy the hotfix. Try to start by 10:30."
  },
  {
    id: "tpl-2",
    label: "🛒 Evening Groceries & Errands (Personal / Medium)",
    from: "family@home.org",
    subject: "Pick up groceries and dry cleaning on your way home",
    body: "Hey! Can you please stop by the organic store and buy some fresh vegetables, whole milk, and sourdough bread? Also, remember to pick up my dry cleaning. It's under my name. Should take about 20 minutes if you go around 17:00."
  },
  {
    id: "tpl-3",
    label: "📚 Research & Learning (Study / Low)",
    from: "coursera-learning@edu.com",
    subject: "New module available: Advanced PostgreSQL Indexes",
    body: "Welcome to Module 4! In this lesson, we will cover B-tree indexes, GIN indexes, and index optimization science. Please watch the 45-minute video lecture and solve the multiple-choice quiz."
  }
];

interface EmailHubProps {
  onAddTask: (task: Partial<Task>) => void;
}

export default function EmailHub({ onAddTask }: EmailHubProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fromAddress, setFromAddress] = useState("manager@workplace.com");
  const [subject, setSubject] = useState("Review quarterly feedback reports");
  const [emailBody, setEmailBody] = useState("Hi, please review our team's quarterly performance sheets. Identify bottlenecks, summarize the milestones, and list 3 key action steps to present to the VP tomorrow morning. It should take about 45 minutes.");
  
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTask, setParsedTask] = useState<any | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; from: string; subject: string; date: string; taskAdded: boolean }>>([
    { id: "hist-1", from: "manager@workplace.com", subject: "Initial workspace migration spec", date: "Just now", taskAdded: true }
  ]);

  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState<{ sent: boolean; previewUrl: string | null; realDelivery: boolean; recipient: string } | null>(null);

  const selectTemplate = (tpl: EmailTemplate) => {
    setFromAddress(tpl.from);
    setSubject(tpl.subject);
    setEmailBody(tpl.body);
  };

  const handleProcessEmail = async () => {
    if (!subject.trim() || !emailBody.trim()) return;
    setIsLoading(true);
    setParsedTask(null);

    try {
      const response = await fetch("/api/forward-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAddress,
          subject,
          body: emailBody
        })
      });

      if (!response.ok) throw new Error("Email processing failed");
      const data = await response.json();
      setParsedTask(data);
    } catch (err) {
      console.error("Error processing email:", err);
      // Fallback parser locally
      const isUrgent = subject.toLowerCase().includes("urgent") || emailBody.toLowerCase().includes("urgent");
      setParsedTask({
        title: subject.substring(0, 45) || "Actionable Task from Email",
        description: emailBody.substring(0, 150) + "...",
        category: "Work",
        complexity: "Medium",
        priority: isUrgent ? "high" : "medium",
        duration: 45,
        suggestedStart: "10:00",
        subtasks: ["Read email instructions thoroughly", "Implement actions requested", "Reply to sender"],
        emailSent: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParsedTask = () => {
    if (!parsedTask) return;

    // Build end time from duration
    const [h, m] = (parsedTask.suggestedStart || "10:00").split(":");
    const duration = parsedTask.duration || 30;
    let totalMinutes = parseInt(h) * 60 + parseInt(m) + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    // Create subtasks list in standard object shape
    const customSubtasks = (parsedTask.subtasks || []).map((text: string, index: number) => ({
      id: `sub-email-${Date.now()}-${index}`,
      text,
      completed: false
    }));

    onAddTask({
      title: parsedTask.title,
      description: parsedTask.description,
      category: parsedTask.category || "Work",
      complexity: parsedTask.complexity || "Medium",
      priority: parsedTask.priority || "medium",
      duration,
      start: parsedTask.suggestedStart || "10:00",
      end: endStr,
      subtasks: customSubtasks,
      reasoning: "Extracted and structured from email using Memora LLM Parser.",
      reminderActive: parsedTask.priority === "high"
    });

    // Add to history list
    setHistory(prev => [
      { id: `${Date.now()}`, from: fromAddress, subject, date: "Just now", taskAdded: true },
      ...prev
    ]);

    // Clear parsed view
    setParsedTask(null);
    setSubject("");
    setEmailBody("");
  };

  const handleInitiateReply = (toEmail: string, emailSubject: string) => {
    setReplyTo(toEmail);
    setReplySubject(`Re: ${emailSubject}`);
    setReplyBody(`Hi, \n\nI have received your request and successfully scheduled the task: "${emailSubject}" on my Memora AI calendar. I am starting to work on this now and will update you once it is completed.\n\nBest regards,\nUser`);
    setReplyNotice(null);
  };

  const handleSendCustomReply = async () => {
    if (!replyTo.trim() || !replySubject.trim() || !replyBody.trim()) return;
    setIsSendingReply(true);
    setReplyNotice(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          body: replyBody
        })
      });

      if (!response.ok) throw new Error("Reply email sending failed");
      const data = await response.json();
      setReplyNotice({
        sent: data.success,
        previewUrl: data.previewUrl,
        realDelivery: data.realDelivery,
        recipient: replyTo
      });
    } catch (err) {
      console.error("Error sending custom reply:", err);
      setReplyNotice({
        sent: false,
        previewUrl: null,
        realDelivery: false,
        recipient: replyTo
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="email-hub-root">
      {/* Header Bar */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Mail size={15} />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-800">Email Forwarding & Plugin Hub</h3>
            <p className="text-[10px] text-slate-500">Auto-create tasks from forwarded email content</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">
            forward-f4051cc9@memora.ai
          </span>
          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded Interface */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/40 animate-fade-in text-left">
          {/* Quick Explainer */}
          <div className="bg-indigo-50/60 border border-indigo-150 p-3 rounded-xl text-[11px] text-slate-700 leading-relaxed flex items-start gap-2">
            <Inbox size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-indigo-750">Integrated Mailbox Active:</span> Every email sent or forwarded to your unique forwarding address is digested by Memora. Its subject and body are evaluated to schedule your day automatically!
            </div>
          </div>

          {/* Playground Simulator controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Col: Composer & Templates */}
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Forward Simulator Composer</span>
                <span className="text-[9px] text-slate-400">Offline Mock Ingress</span>
              </div>

              {/* Template quick picks */}
              <div className="space-y-1">
                <label className="block text-[10px] font-medium text-slate-400">Load Template</label>
                <div className="flex flex-col gap-1">
                  {EMAIL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => selectTemplate(tpl)}
                      className="text-[10px] text-left px-2 py-1.5 rounded bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-250 transition-colors font-medium truncate"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* From, Subject, Body */}
              <div className="space-y-2 pt-1.5 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-medium text-slate-450 mb-0.5">Sender Email</label>
                  <input
                    type="text"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-450 mb-0.5">Email Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Action required on project metrics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-450 mb-0.5">Email Content / Body</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the work instructions..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleProcessEmail}
                disabled={isLoading || !subject.trim() || !emailBody.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-lg text-[11px] transition flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                    Memora Parsing email content...
                  </>
                ) : (
                  <>
                    <Send size={11} />
                    Simulate Email Ingress Forwarding
                  </>
                )}
              </button>
            </div>

            {/* Right Col: Extracted Task Proposal */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-indigo-600" /> Extracted Structured Task
                  </span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">Live LLM Parser</span>
                </div>

                {!parsedTask ? (
                  <div className="h-[180px] border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <Mail size={22} className="text-slate-300 mb-1" />
                    <p className="text-[10px] text-slate-500 font-medium">Ready for Inbound Traffic</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Use the composer on the left or click a template to trigger simulated email forwarding.</p>
                  </div>
                ) : (
                  <div className="space-y-3 bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 animate-fade-in text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Parsed Title</span>
                      <p className="font-bold text-slate-800">{parsedTask.title}</p>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">Parsed Summary</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{parsedTask.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Category / Complexity</span>
                        <p className="font-semibold text-slate-700">{parsedTask.category} • {parsedTask.complexity}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Priority Level</span>
                        <p className={`font-bold uppercase ${
                          parsedTask.priority === "high" ? "text-rose-600" :
                          parsedTask.priority === "medium" ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {parsedTask.priority || "medium"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-indigo-100/50 pt-2">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Suggested Start</span>
                        <p className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock size={10} /> {parsedTask.suggestedStart || "10:00"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Est. Duration</span>
                        <p className="font-semibold text-indigo-700">{parsedTask.duration || 30} minutes</p>
                      </div>
                    </div>

                    {parsedTask.subtasks && parsedTask.subtasks.length > 0 && (
                      <div className="border-t border-indigo-100/50 pt-2 space-y-1">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Proposed Subtasks</span>
                        <ul className="space-y-0.5">
                          {parsedTask.subtasks.map((st: string, idx: number) => (
                            <li key={idx} className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                              <span className="text-indigo-500">•</span> {st}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Email Dispatch Result Indicator */}
                    {parsedTask.emailSent && (
                      <div className="border-t border-indigo-150/40 pt-2.5 mt-1">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[10px] text-emerald-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {parsedTask.emailRealDelivery ? (
                              <span>📬 Real Email Sent to {parsedTask.emailRecipient}!</span>
                            ) : (
                              <span>📧 Confirmation Email Simulated!</span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-emerald-600 leading-normal">
                            A beautifully formatted schedule notification has been dispatched to <strong className="font-semibold text-emerald-700">{parsedTask.emailRecipient}</strong>.
                          </p>
                          {parsedTask.emailPreviewUrl && (
                            <a 
                              href={parsedTask.emailPreviewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 mt-1 text-indigo-600 hover:text-indigo-800 font-bold underline text-[9.5px]"
                            >
                              View Sent HTML Email ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {parsedTask && (
                <button
                  onClick={handleAddParsedTask}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-1 mt-3"
                >
                  <Plus size={12} />
                  Approve and Schedule Extracted Task
                </button>
              )}
            </div>
          </div>

          {/* Interactive Direct Reply Composer */}
          {replyTo && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs shadow-sm animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Send size={12} />
                  </div>
                  <span className="font-bold text-slate-800">Direct Email Reply Composer</span>
                </div>
                <button 
                  onClick={() => setReplyTo("")} 
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Recipient</label>
                  <input
                    type="text"
                    disabled
                    value={replyTo}
                    className="w-full bg-slate-50 border border-slate-250 rounded px-2 py-1.5 text-[11px] text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Subject</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Message Body</label>
                  <textarea
                    rows={4}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              {replyNotice && (
                <div className={`p-2.5 rounded-lg border text-[10.5px] leading-relaxed ${
                  replyNotice.sent 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50 border-rose-150 text-rose-800"
                }`}>
                  <div className="font-bold">
                    {replyNotice.sent ? "✓ Message Dispatched Successfully!" : "⚠ Message Dispatch Failed"}
                  </div>
                  <p className="mt-0.5">
                    {replyNotice.sent 
                      ? `Your reply was successfully dispatched to ${replyNotice.recipient}.`
                      : "We could not deliver this message. Please check the SMTP configurations."
                    }
                  </p>
                  {replyNotice.previewUrl && (
                    <a 
                      href={replyNotice.previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 mt-1 text-indigo-600 hover:text-indigo-800 font-bold underline text-[9.5px]"
                    >
                      View Dispatched Email Preview ↗
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={handleSendCustomReply}
                disabled={isSendingReply || !replyBody.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center gap-1.5"
              >
                {isSendingReply ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send size={11} />
                    Send Custom Reply Email
                  </>
                )}
              </button>
            </div>
          )}

          {/* Inbox Forwarding Logs History */}
          <div className="space-y-1.5 pt-2 border-t border-slate-150">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inbox Forwarding History</span>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[10px]">
              {history.map((h, i) => (
                <div key={h.id} className={`p-2.5 flex items-center justify-between border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-slate-50/30" : "bg-white"}`}>
                  <div className="flex items-center gap-2 truncate pr-4 text-left">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-700 font-semibold truncate block leading-normal">{h.subject}</span>
                      <span className="text-[8.5px] text-slate-400 font-mono">From: {h.from || "unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-slate-400 font-mono text-[9px]">{h.date}</span>
                    <button
                      onClick={() => handleInitiateReply(h.from || "manager@workplace.com", h.subject)}
                      className="text-[9px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
                    >
                      Reply
                    </button>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-medium">Auto-Created</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
