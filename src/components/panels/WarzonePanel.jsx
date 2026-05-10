import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
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
import PostDetailPage from "../../pages/PostDetailPage";

const LIMIT = 5;

function RateLimitBanner({ onDismiss }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-orange-500 text-lg">⚠️</span>
        <div>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
            Too many requests
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
            Slow down — you can try again in {seconds}s
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-orange-400 hover:text-orange-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

export default function WarzonePanel() {
  const auth = useSelector((state) => state.auth);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("date");
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPosts(
        LIMIT,
        skip,
        tagFilter || null,
        search || null,
        sort,
      );
      setPosts(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err.message?.includes("429")) {
        setRateLimited(true);
      } else {
        setError("Could not load posts");
      }
    } finally {
      setLoading(false);
    }
  }, [skip, tagFilter, search, sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const interval = setInterval(loadPosts, 30000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  function requireAuth() {
    if (!auth.isLoggedIn) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  async function handleCreate(data) {
    try {
      await createPost(data.title, data.body, data.tag);
      setShowForm(false);
      setSkip(0);
      loadPosts();
    } catch (err) {
      if (err.message?.includes("429")) setRateLimited(true);
      else setError("Could not create post — try again");
    }
  }

  async function handleVote(postId, direction) {
    if (!requireAuth()) return;
    try {
      const data = await votePost(postId, direction);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, votes: data.votes } : p)),
      );
    } catch (err) {
      if (err.message?.includes("429")) setRateLimited(true);
    }
  }

  async function handleDelete(postId) {
    try {
      await deletePost(postId);

      if (auth.role === "ADMIN") {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, deletedAt: new Date().toISOString() } : p,
          ),
        );
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setTotal((t) => t - 1);
      }
    } catch (err) {
      if (err.message?.includes("429")) setRateLimited(true);
      else setError("Could not delete post");
    }
  }

  function handleSearch() {
    setSearch(searchInput);
    setSkip(0);
  }

  function handleClearSearch() {
    setSearch("");
    setSearchInput("");
    setSkip(0);
  }

  if (selectedPost) {
    return (
      <PostDetailPage
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onDelete={(id) => {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setTotal((t) => t - 1);
          setSelectedPost(null);
        }}
      />
    );
  }

  return (
    <>
      <div>
        {/* Rate limit banner */}
        {rateLimited && (
          <RateLimitBanner onDismiss={() => setRateLimited(false)} />
        )}

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
            disabled={rateLimited}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Share a story
          </button>
        </div>

        {/* Search and sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search stories..."
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setSkip(0);
            }}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="date">Latest</option>
            <option value="votes">Most voted</option>
            <option value="comments">Most discussed</option>
          </select>
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

        {/* Active search indicator */}
        {search && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Results for</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
              "{search}"
            </span>
            <span className="text-sm text-gray-500">— {total} found</span>
          </div>
        )}

        {/* Create post form */}
        {showForm && (
          <CreatePostForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* General error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-6 flex flex-col gap-2 items-center">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-4 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="flex-1 grid gap-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">
              {search ? "No stories match your search" : "No stories yet"}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              {search ? "Try different keywords" : "Be the first to share one"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                auth={auth}
                rateLimited={rateLimited}
                onVote={handleVote}
                onDelete={handleDelete}
                onSelect={setSelectedPost}
                onRequireAuth={() => setShowAuth(true)}
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">
              {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
            </span>
            <button
              onClick={() => setSkip((s) => s + LIMIT)}
              disabled={skip + LIMIT >= total}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Not logged in hint */}
        {!auth.isLoggedIn && (
          <div className="mt-6 text-center py-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              <button
                onClick={() => setShowAuth(true)}
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Login
              </button>{" "}
              to vote, comment, and share your own stories
            </p>
          </div>
        )}
      </div>

      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
    </>
  );
}

function PostCard({
  post,
  auth,
  rateLimited,
  onVote,
  onDelete,
  onSelect,
  onRequireAuth,
}) {
  const [showComments, setShowComments] = useState(false);

  const isOwner = auth.isLoggedIn && auth.username === post.author;
  const isAdmin = auth.isLoggedIn && auth.role === "ADMIN";
  const isDeleted = post.deletedAt !== null && post.deletedAt !== undefined;

  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-lg p-4 transition-colors ${
        isDeleted
          ? "border-red-200 dark:border-red-900 opacity-60"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {/* Deleted badge — only admins see deleted posts */}
      {isDeleted && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
            🗑 Deleted
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Votes */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <button
            onClick={() => {
              if (!auth.isLoggedIn) {
                onRequireAuth();
                return;
              }
              if (rateLimited) return;
              onVote(post.id, 1);
            }}
            disabled={rateLimited || isDeleted}
            title={rateLimited ? "Too many requests — slow down" : "Upvote"}
            className={`transition-colors text-lg disabled:cursor-not-allowed ${
              rateLimited
                ? "text-gray-300 dark:text-gray-600"
                : "text-gray-400 hover:text-blue-500"
            }`}
          >
            ▲
          </button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-6 text-center">
            {post.votes}
          </span>
          <button
            onClick={() => {
              if (!auth.isLoggedIn) {
                onRequireAuth();
                return;
              }
              if (rateLimited) return;
              onVote(post.id, -1);
            }}
            disabled={rateLimited || isDeleted}
            title={rateLimited ? "Too many requests — slow down" : "Downvote"}
            className={`transition-colors text-lg disabled:cursor-not-allowed ${
              rateLimited
                ? "text-gray-300 dark:text-gray-600"
                : "text-gray-400 hover:text-red-500"
            }`}
          >
            ▼
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            onClick={() => !isDeleted && onSelect(post)}
            className={`font-semibold text-gray-900 dark:text-white ${
              !isDeleted
                ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                : ""
            }`}
          >
            {post.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-3">
            {post.body}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
            <span>
              by <strong>{post.author}</strong>
            </span>
            {post.tag && (
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                #{post.tag}
              </span>
            )}
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => setShowComments((s) => !s)}
              className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              💬 {showComments ? "Hide comments" : "Comments"}
            </button>

            {(isOwner || isAdmin) && !isDeleted && (
              <button
                onClick={() => onDelete(post.id)}
                disabled={rateLimited}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                🗑 Delete
              </button>
            )}

            <button
              onClick={() => !isDeleted && onSelect(post)}
              className="text-xs text-gray-500 hover:text-blue-500 transition-colors ml-auto"
            >
              Read more →
            </button>
          </div>

          {/* Inline comments */}
          {showComments && (
            <CommentsSection
              postId={post.id}
              auth={auth}
              rateLimited={rateLimited}
              onRateLimit={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ postId, auth, rateLimited, onRateLimit }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(postId)
      .then((res) => {
        setComments(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  async function handleAdd() {
    if (!auth.isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const comment = await addComment(postId, body);
      setComments((prev) => [...prev, comment]);
      setBody("");
    } catch (err) {
      if (err.message?.includes("429")) {
        onRateLimit();
        setError("Too many requests — slow down");
      } else {
        setError("Could not add comment");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      if (err.message?.includes("429")) {
        setError("Too many requests — slow down");
      }
    }
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
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {comment.author}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 break-words">
                      {comment.body}
                    </p>
                  </div>
                  {auth.isLoggedIn &&
                    (auth.username === comment.author ||
                      auth.role === "ADMIN") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={rateLimited}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xs flex-shrink-0 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        {/* Add comment input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={rateLimited}
            placeholder={
              rateLimited
                ? "Too many requests — slow down..."
                : auth.isLoggedIn
                  ? "Add a comment..."
                  : "Login to comment..."
            }
            className={`flex-1 bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors ${
              rateLimited
                ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          />
          <button
            onClick={handleAdd}
            disabled={submitting || rateLimited}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
          >
            {submitting ? "..." : "Post"}
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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    else if (title.length < 5) e.title = "Title must be at least 5 characters";
    if (!body.trim()) e.body = "Story is required";
    else if (body.length < 10) e.body = "Story must be at least 10 characters";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    await onSubmit({ title, body, tag });
    setSubmitting(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Share your war story
      </h3>
      <div className="grid gap-3">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Title — what happened?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
            }}
            className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors ${
              errors.title
                ? "border-red-400"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 text-right">
            {title.length}/255
          </p>
        </div>

        {/* Body */}
        <div>
          <textarea
            placeholder="Tell the full story... What went wrong? What did you learn?"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (errors.body) setErrors((prev) => ({ ...prev, body: null }));
            }}
            rows={5}
            className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors resize-none ${
              errors.body
                ? "border-red-400"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          {errors.body && (
            <p className="text-xs text-red-500 mt-1">{errors.body}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 text-right">
            {body.length} characters
          </p>
        </div>

        {/* Tag */}
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">No tag</option>
          <option value="devops">devops</option>
          <option value="frontend">frontend</option>
          <option value="backend">backend</option>
          <option value="database">database</option>
          <option value="management">management</option>
        </select>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Posting..." : "Post story"}
          </button>
        </div>
      </div>
    </div>
  );
}
