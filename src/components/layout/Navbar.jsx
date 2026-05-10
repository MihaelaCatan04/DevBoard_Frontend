import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../store/themeSlice";
import { logout } from "../../store/authSlice";
import AuthPage from "../../pages/AuthPage";

export default function Navbar({ onSettingsOpen }) {
  const languages = useSelector((state) => state.profile.data.languages);
  const topics = useSelector((state) => state.profile.data.topics);
  const isDark = useSelector((state) => state.theme.isDark);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              DevBoard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              {languages.length} languages · {topics.length} topics
            </span>

            <button
              onClick={() => dispatch(toggleTheme())}
              title="Toggle theme"
              className="text-xl text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Auth section */}
            {auth.isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* Username badge */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  {auth.username}
                </span>
                {/* Logout */}
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm font-medium px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Login
              </button>
            )}

            <button
              onClick={onSettingsOpen}
              title="Settings"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Auth modal */}
      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
    </>
  );
}
