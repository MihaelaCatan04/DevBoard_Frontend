import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import {
  fetchPosts,
  createPost,
  deletePost,
  votePost,
  fetchComments,
  addComment,
  deleteComment,
} from "../../services/warzone";
import AuthPage from "../../pages/AuthPage";

const LIMIT = 5;

export default function WarzonePanel() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPosts();
  }, [skip, tagFilter]);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPosts(LIMIT, skip, tagFilter || null);
      setPosts(res.data);
      setTotal(res.total);
    } catch {
      setError("Could not load posts");
    } finally {
      setLoading(false);
    }
  }

  function requireAuth(action) {
    if (!auth.isLoggedIn) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  async function handleCreate(data) {
    await createPost(data.title, data.body, data.tag);
    setShowForm(false);
    setSkip(0);
    loadPosts();
  }

  async function handleVote(postId, direction) {
    if (!requireAuth()) return;
    await votePost(postId, direction);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, votes: p.votes + direction } : p,
      ),
    );
  }

  async function handleDelete(postId) {
    await deletePost(postId);
    loadPosts();
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              War Stories
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Real situations from real developers
            </p>
          </div>
          <button
            onClick={() => {
              if (!requireAuth()) return;
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Share a story
          </button>
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "devops", "frontend", "backend", "database", "management"].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => {
                  setTagFilter(tag);
                  setSkip(0);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tagFilter === tag
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tag === "" ? "All" : `#${tag}`}
              </button>
            ),
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <CreatePostForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-center py-4">{error}</p>}

        {/* Posts */}
        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No stories yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Be the first to share one
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                auth={auth}
                onVote={handleVote}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
              disabled={skip === 0}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
            </span>
            <button
              onClick={() => setSkip((s) => s + LIMIT)}
              disabled={skip + LIMIT >= total}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Auth modal — shows when unauthenticated user tries to do something */}
      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
    </>
  );
}

function PostCard({ post, auth, onVote, onDelete }) {
  const [showComments, setShowComments] = useState(false);

  const isOwner = auth.isLoggedIn && auth.username === post.author;
  const isAdmin = auth.isLoggedIn && auth.role === "ADMIN";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex gap-4">
        {/* Votes */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <button
            onClick={() => onVote(post.id, 1)}
            className="text-gray-400 hover:text-blue-500 transition-colors text-lg"
          >
            ▲
          </button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-6 text-center">
            {post.votes}
          </span>
          <button
            onClick={() => onVote(post.id, -1)}
            className="text-gray-400 hover:text-red-500 transition-colors text-lg"
          >
            ▼
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {post.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-3">
            {post.body}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <span>by {post.author}</span>
            {post.tag && (
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                #{post.tag}
              </span>
            )}
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setShowComments((s) => !s)}
              className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
            >
              💬 Comments
            </button>
            {(isOwner || isAdmin) && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                🗑 Delete
              </button>
            )}
          </div>

          {/* Comments section */}
          {showComments && <CommentsSection postId={post.id} auth={auth} />}
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ postId, auth }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchComments(postId).then((res) => {
      setComments(res.data);
      setLoading(false);
    });
  }, [postId]);

  async function handleAdd() {
    if (!auth.isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (!body.trim()) return;
    const comment = await addComment(postId, body);
    setComments((prev) => [...prev, comment]);
    setBody("");
  }

  async function handleDelete(commentId) {
    await deleteComment(postId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <>
      <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        {loading ? (
          <p className="text-xs text-gray-500">Loading comments...</p>
        ) : (
          <div className="grid gap-2 mb-3">
            {comments.length === 0 && (
              <p className="text-xs text-gray-500">
                No comments yet — be the first!
              </p>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {comment.author}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {comment.body}
                    </p>
                  </div>
                  {auth.isLoggedIn &&
                    (auth.username === comment.author ||
                      auth.role === "ADMIN") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={
              auth.isLoggedIn ? "Add a comment..." : "Login to comment..."
            }
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Post
          </button>
        </div>
      </div>

      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
    </>
  );
}

function CreatePostForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    await onSubmit({ title, body, tag });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Share your war story
      </h3>
      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Title — what happened?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
        <textarea
          placeholder="Tell the full story..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">No tag</option>
          <option value="devops">devops</option>
          <option value="frontend">frontend</option>
          <option value="backend">backend</option>
          <option value="database">database</option>
          <option value="management">management</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Post story
          </button>
        </div>
      </div>
    </div>
  );
}
