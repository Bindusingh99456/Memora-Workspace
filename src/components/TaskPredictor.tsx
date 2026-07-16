import React, { useState } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Lightbulb, 
  Plus,
  Loader2,
  CalendarDays
} from "lucide-react";
import { TimePrediction, Task, TrainingExemplar } from "../types";

interface TaskPredictorProps {
  onAddTask: (task: Partial<Task>) => void;
  predictedEstimatesCount: number;
  exemplars?: TrainingExemplar[];
}

export default function TaskPredictor({ onAddTask, predictedEstimatesCount, exemplars = [] }: TaskPredictorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Task["category"]>("Work");
  const [complexity, setComplexity] = useState<Task["complexity"]>("Medium");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [subtasksCount, setSubtasksCount] = useState(2);
  const [userEstimate, setUserEstimate] = useState(30);
  const [startHour, setStartHour] = useState("09:00");

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<TimePrediction | null>(null);

  const handlePredictTime = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/predict-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          complexity,
          subtasksCount,
          trainingExemplars: exemplars,
        }),
      });
      if (!response.ok) throw new Error("Estimation failed");
      const data: TimePrediction = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Error predicting time:", err);
      // Fallback fallback if server isn't loaded with active internet or key
      const baseMinutes = complexity === "High" ? 90 : complexity === "Medium" ? 45 : 20;
      setPrediction({
        predictedTimeMinutes: baseMinutes + (subtasksCount * 12),
        confidenceScore: 82,
        reasoning: "Estimated via default local scheduler heuristic based on task complexity and subtask layout constraints.",
        efficiencyTips: [
          "Batch similar routine administrative tasks together to avoid high context switching costs.",
          "Use the Pomodoro technique to complete individual milestones with focused blocks of work."
        ],
        dynamicBreakdown: [
          "Phase 1: Structure & Initial Draft Setup (25%)",
          "Phase 2: Active Focused Execution & Core Coding/Writing (60%)",
          "Phase 3: Quality Check, Review, & Polish (15%)"
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndSchedule = () => {
    if (!title.trim()) return;
    const durationToUse = prediction ? prediction.predictedTimeMinutes : userEstimate;
    
    // Parse startHour to find endHour
    const [hStr, mStr] = startHour.split(":");
    let totalMinutes = parseInt(hStr) * 60 + parseInt(mStr) + durationToUse;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endHourStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    // Create subtasks list from dynamic breakdown if available, otherwise mock list
    const parsedSubtasks = prediction?.dynamicBreakdown?.map((milestone, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: milestone,
      completed: false
    })) || Array.from({ length: subtasksCount }).map((_, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: `Draft milestone part ${idx + 1}`,
      completed: false
    }));

    onAddTask({
      title,
      description,
      category,
      complexity,
      duration: durationToUse,
      start: startHour,
      end: endHourStr,
      status: "todo",
      priority: priority,
      reminderActive: true,
      subtasks: parsedSubtasks,
      predictedTimeMinutes: prediction?.predictedTimeMinutes,
      confidenceScore: prediction?.confidenceScore,
      reasoning: prediction?.reasoning,
      efficiencyTips: prediction?.efficiencyTips,
      dynamicBreakdown: prediction?.dynamicBreakdown,
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setPrediction(null);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 border-emerald-200 bg-emerald-50";
    if (score >= 65) return "text-amber-700 border-amber-200 bg-amber-50";
    return "text-rose-700 border-rose-200 bg-rose-50";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="task-predictor-root">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Smart Task Creator</h3>
            <p className="text-[11px] text-slate-500">Predictive Machine Learning Scheduler</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-50 text-blue-600 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
          {predictedEstimatesCount} Predictions Run
        </span>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Task Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Write design documentation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Categories, Complexity, Priority */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Task["category"])}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
            >
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Study">Study</option>
              <option value="Routine">Routine</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Complexity</label>
            <select
              value={complexity}
              onChange={(e) => {
                const val = e.target.value as Task["complexity"];
                setComplexity(val);
                setPriority(val === "High" ? "high" : val === "Medium" ? "medium" : "low");
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white font-medium"
            >
              <option value="low">Low 🟢</option>
              <option value="medium">Medium 🟡</option>
              <option value="high">High 🔴</option>
            </select>
          </div>
        </div>

        {/* Start Hour, Subtasks count */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Start Time</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              Estimated Milestones <HelpCircle size={10} className="text-slate-400" title="Expected subtasks breakdown" />
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={subtasksCount}
              onChange={(e) => setSubtasksCount(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Task description */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Task Description / Details</label>
          <textarea
            rows={2}
            placeholder="Outline task details so Memora's AI model can build a more precise time completion prediction."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white resize-none"
          />
        </div>

        {/* Predict / Manual Action trigger */}
        {!prediction ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={handlePredictTime}
              disabled={loading || !title.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-sm disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  Running Predictive ML Model...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analyze & Predict Completion Time
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 border border-slate-200 bg-slate-50 rounded-xl p-4 animate-fade-in">
            {/* Visual Time Comparison */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-600" /> Predicted Time
                </span>
                <span className="font-semibold text-slate-800">{prediction.predictedTimeMinutes} minutes</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (prediction.predictedTimeMinutes / 120) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>0m</span>
                <span>Max Capacity Visual (120m+)</span>
              </div>
            </div>

            {/* Model Confidence */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${getConfidenceColor(prediction.confidenceScore)}`}>
              <span className="flex items-center gap-1.5">
                <TrendingUp size={13} /> Model Confidence Score:
              </span>
              <span className="font-bold">{prediction.confidenceScore}%</span>
            </div>

            {/* Reasoning text */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">AI Reasoning Factor</span>
              <p className="text-xs text-slate-600 italic leading-relaxed">{prediction.reasoning}</p>
            </div>

            {/* Milestones dynamic breakdown list */}
            {prediction.dynamicBreakdown && prediction.dynamicBreakdown.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Layers size={11} /> Suggested Milestone Phases
                </span>
                <ul className="space-y-1">
                  {prediction.dynamicBreakdown.map((milestone, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5 pl-1">
                      <CheckCircle2 size={11} className="text-blue-600 flex-shrink-0" />
                      <span>{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Efficiency Tips */}
            {prediction.efficiencyTips && prediction.efficiencyTips.length > 0 && (
              <div className="space-y-1.5 bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb size={11} /> High-Efficiency Suggestions
                </span>
                <ul className="space-y-1">
                  {prediction.efficiencyTips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-600 pl-1.5 relative before:content-['•'] before:text-blue-500 before:absolute before:left-0">
                      <span className="pl-2 block">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirmation Schedule and Re-analyze buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPrediction(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-semibold transition"
              >
                Reset Details
              </button>
              <button
                type="button"
                onClick={handleApplyAndSchedule}
                className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus size={13} /> Schedule Predicted Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
