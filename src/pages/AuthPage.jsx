import { useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import { login, register } from "../services/warzone";

export default function AuthPage({ onClose }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const dispatch = useDispatch();

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = isLogin
        ? await login(username, password)
        : await register(username, password);

      dispatch(loginSuccess({
        token:    data.token,
        username: data.username,
        role:     data.role,
      }));

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              isLogin
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !isLogin
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Register
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. mihaela"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLogin ? "••••••" : "At least 6 characters"}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors mt-1"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}