import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import Navbar from "../components/layout/Navbar";
import GithubPanel from "../components/panels/GithubPanel";
import HackerNewsPanel from "../components/panels/HackerNewsPanel";
import NpmPanel from "../components/panels/NpmPanel";
import DevToPanel from "../components/panels/DevToPanel";
import ClocksPanel from "../components/panels/ClocksPanel";
import BookmarksPanel from "../components/panels/BookmarksPanel";
import WarzonePanel from "../components/panels/WarzonePanel";
import AdminPanel from "../components/panels/AdminPanel";
import SettingsDrawer from "../components/layout/SettingsDrawer";
import AuthPage from "./AuthPage";
import { TABS } from "../constants/topics";

const SESSION_WARN_MS = 15_000;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("github");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [showSessionAuth, setShowSessionAuth] = useState(false);

  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!auth.isLoggedIn || !auth.expiresAt) {
      setSessionWarning(false);
      return;
    }

    const now = Date.now();
    const timeLeft = auth.expiresAt - now;

    if (timeLeft <= 0) {
      dispatch(logout());
      return;
    }

    const timers = [];
    if (timeLeft > SESSION_WARN_MS) {
      timers.push(setTimeout(() => setSessionWarning(true), timeLeft - SESSION_WARN_MS));
    } else {
      setSessionWarning(true);
    }
    timers.push(setTimeout(() => {
      dispatch(logout());
      setSessionWarning(false);
    }, timeLeft));

    return () => timers.forEach(clearTimeout);
  }, [auth.isLoggedIn, auth.expiresAt, dispatch]);

  const visibleTabs = [
    ...TABS,
    { id: "warzone", label: "War Stories" },
    ...(auth.isLoggedIn && auth.role === "ADMIN"
      ? [{ id: "admin", label: "Admin" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar onSettingsOpen={() => setSettingsOpen(true)} />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Session expiry warning */}
      {sessionWarning && auth.isLoggedIn && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 sm:px-6 py-2 flex items-center justify-between">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠ Your session is expiring soon
          </p>
          <button
            onClick={() => setShowSessionAuth(true)}
            className="text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:underline"
          >
            Re-login →
          </button>
        </div>
      )}

      {showSessionAuth && (
        <AuthPage onClose={() => setShowSessionAuth(false)} />
      )}

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-2 sm:px-6">
        <div
          className="max-w-7xl mx-auto flex overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-white"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }
                ${tab.id === "admin" ? "text-red-500 dark:text-red-400" : ""}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {activeTab === "github" && <GithubPanel />}
        {activeTab === "hackernews" && <HackerNewsPanel />}
        {activeTab === "npm" && <NpmPanel />}
        {activeTab === "devto" && <DevToPanel />}
        {activeTab === "clocks" && <ClocksPanel />}
        {activeTab === "bookmarks" && <BookmarksPanel />}
        {activeTab === "warzone" && <WarzonePanel />}
        {activeTab === "admin" && <AdminPanel />}
      </main>
    </div>
  );
}
