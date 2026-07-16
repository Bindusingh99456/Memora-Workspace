import React, { useState } from "react";
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Maximize2, 
  Play, 
  CheckSquare, 
  Square,
  Bell,
  BellOff,
  Trash2,
  ListTodo,
  Check,
  TrendingDown,
  Moon,
  Sun,
  X,
  Shuffle,
  Loader2,
  FileText,
  MapPin,
  Map,
  ExternalLink
} from "lucide-react";
import { Task, TrainingExemplar } from "../types";
import { motion, AnimatePresence } from "motion/react";
import ReportModal from "./ReportModal";
import InteractiveMap from "./InteractiveMap";
import { detectAddressInText, getDeterministicCoordinates } from "../lib/locationDetector";

interface ScheduleViewProps {
  tasks: Task[];
  onToggleTaskStatus: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (id: string) => void;
  onOptimizeSchedule: (optimizedTasks: any[], summaryText: string) => void;
  onToggleReminder: (id: string) => void;
  onTogglePriority?: (id: string) => void;
  exemplars?: TrainingExemplar[];
}

export default function ScheduleView({
  tasks,
  onToggleTaskStatus,
  onToggleSubtask,
  onDeleteTask,
  onOptimizeSchedule,
  onToggleReminder,
  onTogglePriority,
  exemplars = [],
}: ScheduleViewProps) {
  const [workingStart, setWorkingStart] = useState("09:00");
  const [workingEnd, setWorkingEnd] = useState("17:00");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [expandedMaps, setExpandedMaps] = useState<Record<string, boolean>>({});

  const toggleMapExpansion = (taskId: string) => {
    setExpandedMaps(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  const totalDuration = tasks.reduce((acc, t) => acc + (t.predictedTimeMinutes || t.duration), 0);

  const handleOptimize = async () => {
    if (tasks.length === 0) return;
    setIsOptimizing(true);
    setOptimizationSummary(null);

    try {
      const response = await fetch("/api/optimize-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          workingHoursStart: workingStart,
          workingHoursEnd: workingEnd,
          trainingExemplars: exemplars,
        }),
      });

      if (!response.ok) throw new Error("Optimization failed");
      const data = await response.json();

      if (data.optimizedTasks && Array.isArray(data.optimizedTasks)) {
        onOptimizeSchedule(data.optimizedTasks, data.overallSummary || "Your schedule has been optimized!");
        setOptimizationSummary(data.overallSummary);
      }
    } catch (err) {
      console.error("Optimization error:", err);
      // Local fallback optimization: Sort by complexity (high first) and start times
      const sorted = [...tasks].sort((a, b) => {
        const order = { High: 3, Medium: 2, Low: 1 };
        return order[b.complexity] - order[a.complexity];
      });
      
      let currentMinutes = parseInt(workingStart.split(":")[0]) * 60 + parseInt(workingStart.split(":")[1]);
      const mapped = sorted.map((t) => {
        const dur = t.predictedTimeMinutes || t.duration;
        const startH = Math.floor(currentMinutes / 60) % 24;
        const startM = currentMinutes % 60;
        currentMinutes += dur;
        const endH = Math.floor(currentMinutes / 60) % 24;
        const endM = currentMinutes % 60;

        return {
          id: t.id,
          suggestedStart: `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`,
          suggestedEnd: `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`,
          optimizationNote: "Sequenced based on task complexity levels to reduce decision fatigue."
        };
      });

      onOptimizeSchedule(mapped, "Local heuristics applied: Tasks reordered in descend sequence of cognitive complexity to maximize peak willpower.");
      setOptimizationSummary("Local heuristics applied: Tasks sequenced in order of cognitive complexity to leverage peak mental energy in the morning.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getCategoryColor = (category: Task["category"]) => {
    switch (category) {
      case "Work": return "border-blue-150 text-blue-600 bg-blue-50/40";
      case "Personal": return "border-fuchsia-150 text-fuchsia-600 bg-fuchsia-50/40";
      case "Health": return "border-emerald-150 text-emerald-600 bg-emerald-50/40";
      case "Study": return "border-amber-150 text-amber-600 bg-amber-50/40";
      case "Routine": return "border-slate-200 text-slate-500 bg-slate-50/40";
    }
  };

  const getComplexityBorder = (complexity: Task["complexity"]) => {
    if (complexity === "High") return "border-rose-200 hover:border-rose-300";
    if (complexity === "Medium") return "border-amber-200 hover:border-amber-300";
    return "border-slate-200 hover:border-slate-300";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5" id="schedule-view-root">
      {/* Header Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Tasks</span>
          <span className="text-xl font-bold text-slate-800 mt-1">{tasks.length}</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Completion</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-emerald-600">{completionPercentage}%</span>
            <span className="text-[10px] text-slate-400 font-mono">({completedCount}/{tasks.length})</span>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active Timeline</span>
          <span className="text-xl font-bold text-blue-600 mt-1">{totalDuration}m</span>
        </div>
      </div>

      {/* Constraints & Optimizer Trigger */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shuffle size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">Daily Focus Constraints</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Working Hours:</span>
            <input
              type="time"
              value={workingStart}
              onChange={(e) => setWorkingStart(e.target.value)}
              className="bg-white text-slate-700 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-slate-400">to</span>
            <input
              type="time"
              value={workingEnd}
              onChange={(e) => setWorkingEnd(e.target.value)}
              className="bg-white text-slate-700 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={tasks.length === 0 || isOptimizing}
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-450 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed"
        >
          {isOptimizing ? (
            <>
              <Loader2 size={13} className="animate-spin text-blue-200" />
              Recalculating Optimal Sequences...
            </>
          ) : (
            <>
              <Sparkles size={13} className="animate-pulse" />
              Re-optimize Timeline via Memora ML
            </>
          )}
        </button>

        {/* Dynamic Optimization Feedback */}
        <AnimatePresence>
          {optimizationSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 border border-blue-150 p-3 rounded-lg relative overflow-hidden"
            >
              <button
                onClick={() => setOptimizationSummary(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 mb-1">
                <Sparkles size={12} /> Optimization Scientific Report
              </div>
              <p className="text-[11px] text-slate-600 italic leading-relaxed pr-4">
                {optimizationSummary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <ListTodo size={13} /> Active Day Schedule
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReport(true)}
              disabled={tasks.length === 0}
              className="text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 border border-indigo-200 disabled:border-slate-200 px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
              title="Generate printable or downloadable summary report"
            >
              <FileText size={11} /> Generate Daily Report
            </button>
            <span className="text-[10px] text-slate-400 font-mono">Today</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center">
            <Calendar size={28} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-600 font-medium">Timeline Empty</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the Smart Task Creator or ask Memora AI in chat to build your day.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-3.5 transition-all space-y-3 shadow-sm ${
                  task.status === "completed" 
                    ? "opacity-60 border-slate-100 bg-slate-50/50 shadow-none" 
                    : getComplexityBorder(task.complexity)
                }`}
              >
                {/* Core Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggleTaskStatus(task.id)}
                      className={`mt-0.5 p-0.5 rounded transition ${
                        task.status === "completed" 
                          ? "text-emerald-600 hover:text-emerald-700" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle size={18} />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 hover:border-blue-500" />
                      )}
                    </button>

                    <div className="text-left">
                      <h4 className={`text-xs font-semibold text-slate-800 ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Meta elements */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                        
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          task.complexity === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                          task.complexity === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-emerald-50 text-emerald-750 border border-emerald-100"
                        }`}>
                          {task.complexity} Complexity
                        </span>

                        <button
                          onClick={() => onTogglePriority && onTogglePriority(task.id)}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 hover:brightness-95 active:scale-95 transition-all ${
                            task.priority === "high" ? "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse" :
                            task.priority === "medium" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            "bg-emerald-100 text-emerald-750 border border-emerald-200"
                          }`}
                          title="Click to toggle Priority Level"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === "high" ? "bg-rose-600 animate-ping" :
                            task.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                          }`} />
                          <span>{(task.priority || "medium").toUpperCase()} Priority</span>
                        </button>

                        <span className="text-[9px] text-slate-450 flex items-center gap-1 font-mono">
                          <Clock size={10} /> {task.start} - {task.end} ({task.predictedTimeMinutes || task.duration}m)
                        </span>

                        {task.confidenceScore && (
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded font-mono">
                            ML Accuracy: {task.confidenceScore}%
                          </span>
                        )}
                      </div>

                      {/* Location-aware Map Integration */}
                      {(() => {
                        const detectedAddress = task.description ? detectAddressInText("", task.description) : null;
                        const isMapExpanded = expandedMaps[task.id];
                        if (!detectedAddress) return null;

                        return (
                          <div className="mt-2.5 space-y-2 border-l-2 border-indigo-200 pl-2 py-0.5">
                            <div className="flex flex-wrap items-center gap-2 text-[10px]">
                              <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <MapPin size={10} className="text-rose-500" />
                                Commitment Location: <span className="font-mono text-[9.5px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{detectedAddress}</span>
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detectedAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 transition hover:underline"
                                >
                                  Directions <ExternalLink size={9} />
                                </a>
                                
                                <span className="text-slate-300">•</span>

                                <button
                                  onClick={() => toggleMapExpansion(task.id)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Map size={10} />
                                  {isMapExpanded ? "Hide Mini-Map" : "Show Mini-Map"}
                                </button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isMapExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden rounded-xl border border-slate-200 mt-2"
                                >
                                  <InteractiveMap 
                                    type="PLACE" 
                                    query={detectedAddress} 
                                    center={getDeterministicCoordinates(detectedAddress)}
                                    zoom={14}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Reminder toggle */}
                    <button
                      onClick={() => onToggleReminder(task.id)}
                      className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                        task.reminderActive ? "text-amber-500" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={task.reminderActive ? "Mute Smart Reminders" : "Enable Smart Reminders"}
                    >
                      {task.reminderActive ? <Bell size={13} /> : <BellOff size={13} />}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Optimization Placement feedback */}
                {task.optimizationNote && (
                  <p className="text-[9.5px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 italic leading-normal">
                    💡 <span className="font-semibold text-emerald-600">ML Optimist:</span> {task.optimizationNote}
                  </p>
                )}

                {/* Subtask list */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="border-t border-slate-100 pt-2 pl-6 space-y-1">
                    {task.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => onToggleSubtask(task.id, sub.id)}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {sub.completed ? (
                            <CheckSquare size={11} className="text-emerald-600" />
                          ) : (
                            <Square size={11} className="text-slate-400" />
                          )}
                          <span className={sub.completed ? "line-through text-slate-400" : ""}>
                            {sub.text}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal 
          tasks={tasks} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}
