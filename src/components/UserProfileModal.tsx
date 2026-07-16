import React, { useState, useEffect } from "react";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User as FirebaseUser } from "firebase/auth";
import { auth, db, saveUserData } from "../lib/firebase";
import { 
  User, 
  Mail, 
  ShieldAlert, 
  Clock, 
  Save, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  Settings, 
  Database, 
  Brain, 
  CheckSquare, 
  MessageSquare, 
  Zap, 
  Eye, 
  EyeOff, 
  X,
  AlertCircle
} from "lucide-react";
import { Task, ChatSession, TrainingExemplar } from "../types";

interface UserProfileModalProps {
  user: FirebaseUser;
  tasks: Task[];
  preferences: string[];
  sessions: ChatSession[];
  exemplars: TrainingExemplar[];
  predictedCount: number;
  onClose: () => void;
  triggerToast: (type: "reminder" | "success" | "info", title: string, message: string) => void;
}

export default function UserProfileModal({
  user,
  tasks,
  preferences,
  sessions,
  exemplars,
  predictedCount,
  onClose,
  triggerToast
}: UserProfileModalProps) {
  // Profile settings state
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Statistics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  // Tab state
  const [activeTab, setActiveTab] = useState<"general" | "security" | "stats">("general");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      if (displayName.trim() !== (user.displayName || "")) {
        await updateProfile(user, {
          displayName: displayName.trim()
        });
        
        // Also ensure user's core document metadata is immediately synched
        await saveUserData(user.uid, {
          displayName: displayName.trim(),
          updatedAt: new Date().toISOString()
        });

        triggerToast("success", "👤 Profile Updated", "Your display name was successfully modified.");
      } else {
        triggerToast("info", "No Changes", "No modifications were found to apply.");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      triggerToast("info", "Update Failed", error.message || "An error occurred during updating.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerToast("info", "Security Lock", "Current password is required to perform this action.");
      return;
    }
    if (newPassword.length < 6) {
      triggerToast("info", "Password Weak", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      triggerToast("info", "Mismatch", "New password confirmation does not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      // Re-authenticate user first
      if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        triggerToast("success", "🔒 Password Changed", "Your account security credentials were changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error: any) {
      console.error("Error updating password:", error);
      let friendlyMsg = error.message || "Credential updates failed.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        friendlyMsg = "Your current password verification was incorrect. Please verify.";
      }
      triggerToast("info", "Security Alert", friendlyMsg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md" id="user-profile-modal-overlay">
      {/* Container */}
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[580px] max-h-[90vh]"
        id="user-profile-modal-box"
      >
        {/* Left Sidebar: Brand, Avatar and Navigation */}
        <div className="w-full md:w-60 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col shrink-0" id="profile-sidebar">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Settings size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Account Center</h3>
              <p className="font-sans text-[10px] text-slate-400">Settings & Cloud Analytics</p>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="flex flex-col items-center text-center py-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200/60 flex items-center justify-center text-indigo-600 text-xl font-bold font-mono mb-2 shadow-inner">
              {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <h4 className="font-sans font-bold text-slate-800 text-sm truncate w-full" title={displayName || "Workspace Owner"}>
              {displayName || "Workspace Owner"}
            </h4>
            <span className="font-mono text-[9px] text-slate-400 max-w-full truncate pl-1" title={user.email || ""}>
              {user.email}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5 flex-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
                activeTab === "general"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              id="tab-general"
            >
              <User size={14} className={activeTab === "general" ? "text-indigo-600" : "text-slate-400"} />
              General Profile
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              id="tab-security"
            >
              <Key size={14} className={activeTab === "security" ? "text-indigo-600" : "text-slate-400"} />
              Cloud Password
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              id="tab-stats"
            >
              <Database size={14} className={activeTab === "stats" ? "text-indigo-600" : "text-slate-400"} />
              Usage Statistics
            </button>
          </div>

          {/* Cloud Sync State */}
          <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left leading-none">
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Active database</p>
              <p className="text-[10px] text-slate-600 font-bold font-mono">Firestore Connected</p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto" id="profile-content-area">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl cursor-pointer transition-colors z-20"
            aria-label="Close user profile"
            id="close-profile-btn"
          >
            <X size={18} />
          </button>

          {/* 1. GENERAL TAB */}
          {activeTab === "general" && (
            <div className="flex flex-col h-full animate-fade-in" id="panel-general">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight font-sans">General Profile</h2>
                <p className="text-xs text-slate-500 font-sans">Edit your user details and review your personal account parameters.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wide">Display Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wide">Email Address</label>
                  <div className="relative opacity-60">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-600 font-sans cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans pl-1">Primary authentication email cannot be modified inside this client container.</p>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3 text-indigo-700 text-xs">
                  <Clock className="w-4.5 h-4.5 shrink-0 text-indigo-600 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Cloud Account Sync:</span> All changes are instantly synced to your isolated database in real-time. No manual exports needed.
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-auto flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-5 font-semibold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. SECURITY TAB */}
          {activeTab === "security" && (
            <div className="flex flex-col h-full animate-fade-in" id="panel-security">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight font-sans">Change Password</h2>
                <p className="text-xs text-slate-500 font-sans">Verify your current security credentials to update your password details.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wide">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? "text" : "password"}
                      required
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wide">New Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      required
                      placeholder="Re-type new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPasswords ? "Hide Passwords" : "Reveal Input"}
                  </button>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-800 text-xs">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Important Security Notice:</span> Updating your cloud credentials requires actively typing your current valid password for local verification first.
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-auto flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-5 font-semibold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {updatingPassword ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Key size={14} />
                    )}
                    <span>Update Secure Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. STATISTICS TAB */}
          {activeTab === "stats" && (
            <div className="flex flex-col h-full animate-fade-in" id="panel-stats">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight font-sans">Workspace Analytics</h2>
                <p className="text-xs text-slate-500 font-sans">Real-time statistics fetched from your isolated Cloud Firestore schema.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Stat Cards */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">Tasks Synced</p>
                    <p className="text-lg font-extrabold text-slate-800 font-sans mt-0.5">{totalTasks}</p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">{completionRate}% Completion rate</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
                    <Brain size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">Memory rules</p>
                    <p className="text-lg font-extrabold text-slate-800 font-sans mt-0.5">{preferences.length}</p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">Learned via deep chat</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">Chat Messages</p>
                    <p className="text-lg font-extrabold text-slate-800 font-sans mt-0.5">{totalMessages}</p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">Stored in {sessions.length} sessions</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">AI Predictions</p>
                    <p className="text-lg font-extrabold text-slate-800 font-sans mt-0.5">{predictedCount}</p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">Few-shots: {exemplars.length}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>DATABASE SIZE LIMIT: NO HARD CEILING</span>
                <span>COMPLYING WITH FIRESTORE FREE-TIER</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
