import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  fetchAllPostsAdmin,
  restorePost,
  hardDeletePost,
  getUser,
} from "../../services/warzone";
import AuthPage from "../../pages/AuthPage";

const LIMIT = 10;

export default function AdminPanel() {
  const auth = useSelector((state) => state.auth);
  const [showAuth, setShowAuth] = useState(false);

  if (!auth.isLoggedIn) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔒</p>
        <p className="text-gray-500 font-medium mb-4">Session expired — please login again</p>
        <button
          onClick={() => setShowAuth(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Login
        </button>
        {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  if (auth.role !== "ADMIN") {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔒</p>
        <p className="text-gray-500 font-medium">Admin access only</p>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [skip, setSkip]             = useState(0);
  const [total, setTotal]           = useState(0);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("posts");
  const [username, setUsername]     = useState("");
  const [userResult, setUserResult] = useState(null);
  const [userError, setUserError]   = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllPostsAdmin(LIMIT, skip);
      setPosts(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    if (activeTab === "posts") loadPosts();
  }, [loadPosts, activeTab]);

  async function handleRestore(postId) {
    try {
      await restorePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, deletedAt: null } : p))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleHardDelete(postId) {
    if (!window.confirm("Permanently delete this post? This cannot be undone.")) return;
    try {
      await hardDeletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLookupUser() {
    if (!username.trim()) return;
    setUserError(null);
    setUserResult(null);
    try {
      const user = await getUser(username.trim());
      setUserResult(user);
    } catch (err) {
      setUserError("User not found");
    }
  }

  const deletedCount = posts.filter((p) => p.deletedAt != null).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage all content and users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total posts</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{deletedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Soft deleted</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{total - deletedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6 w-fit">
        {["posts", "users"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Posts tab */}
      {activeTab === "posts" && (
        <>
          {loading ? (
            <p className="text-gray-500 text-center py-12">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No posts found.</p>
          ) : (
            <div className="grid gap-3">
              {posts.map((post) => (
                <AdminPostCard
                  key={post.id}
                  post={post}
                  onRestore={handleRestore}
                  onHardDelete={handleHardDelete}
                />
              ))}
            </div>
          )}

          {total > LIMIT && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
                disabled={skip === 0}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
              </span>
              <button
                onClick={() => setSkip((s) => s + LIMIT)}
                disabled={skip + LIMIT >= total}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Look up a user</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookupUser()}
              placeholder="Enter username..."
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLookupUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>

          {userError && <p className="text-red-500 text-sm mt-2">{userError}</p>}

          {userResult && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Username</span>
                <p className="font-medium text-gray-900 dark:text-white">{userResult.username}</p>
              </div>
              <div>
                <span className="text-gray-500 block">Role</span>
                <p className={`font-medium ${userResult.role === "ADMIN" ? "text-red-500" : "text-green-500"}`}>
                  {userResult.role}
                </p>
              </div>
              <div>
                <span className="text-gray-500 block">Joined</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(userResult.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPostCard({ post, onRestore, onHardDelete }) {
  const isDeleted = post.deletedAt != null;

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-lg p-4 transition-colors ${
      isDeleted
        ? "border-red-200 dark:border-red-900"
        : "border-gray-200 dark:border-gray-800"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isDeleted && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                Deleted
              </span>
            )}
            {post.tag && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                #{post.tag}
              </span>
            )}
          </div>

          <p className={`font-medium ${isDeleted ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
            {post.title}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span>by {post.author}</span>
            <span>⭐ {post.votes} votes</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {isDeleted && post.deletedAt && (
              <span className="text-red-400">
                deleted {new Date(post.deletedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDeleted ? (
            <>
              <button
                onClick={() => onRestore(post.id)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                ↺ Restore
              </button>
              <button
                onClick={() => onHardDelete(post.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Permanent
              </button>
            </>
          ) : (
            <span className="text-xs text-green-500 font-medium">✓ Active</span>
          )}
        </div>
      </div>
    </div>
  );
}