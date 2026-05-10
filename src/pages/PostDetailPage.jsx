import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  fetchComments,
  addComment,
  deleteComment,
  votePost,
  deletePost,
} from "../services/warzone";
import AuthPage from "./AuthPage";

export default function PostDetailPage({ post, onBack, onDelete }) {
  const auth = useSelector((state) => state.auth);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [votes, setVotes] = useState(post.votes);
  const [showAuth, setShowAuth] = useState(false);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    fetchComments(post.id, LIMIT, skip).then((res) => {
      setComments(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [post.id, skip]);

  function requireAuth() {
    if (!auth.isLoggedIn) {
      setShowAuth(true);
      return false;
    }
    return true;
  }

  async function handleVote(direction) {
    if (!requireAuth()) return;
    await votePost(post.id, direction);
    setVotes((v) => v + direction);
  }

  async function handleAddComment() {
    if (!requireAuth()) return;
    if (!body.trim()) return;
    const comment = await addComment(post.id, body);
    setComments((prev) => [...prev, comment]);
    setTotal((t) => t + 1);
    setBody("");
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(post.id, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((t) => t - 1);
  }

  async function handleDeletePost() {
    await deletePost(post.id);
    onDelete(post.id);
    onBack();
  }

  const isOwner = auth.isLoggedIn && auth.username === post.author;
  const isAdmin = auth.isLoggedIn && auth.role === "ADMIN";

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          ← Back to stories
        </button>

        {/* Post */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex gap-4">
            {/* Votes */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleVote(1)}
                className="text-gray-400 hover:text-blue-500 transition-colors text-xl"
              >
                ▲
              </button>
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {votes}
              </span>
              <button
                onClick={() => handleVote(-1)}
                className="text-gray-400 hover:text-red-500 transition-colors text-xl"
              >
                ▼
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {post.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {post.body}
              </p>
              <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                <span>
                  by <strong>{post.author}</strong>
                </span>
                {post.tag && (
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                    #{post.tag}
                  </span>
                )}
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {(isOwner || isAdmin) && (
                  <button
                    onClick={handleDeletePost}
                    className="ml-auto text-red-500 hover:text-red-400 transition-colors text-xs"
                  >
                    🗑 Delete post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Comments ({total})
          </h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading comments...</p>
          ) : (
            <>
              <div className="grid gap-3 mb-6">
                {comments.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No comments yet — be the first!
                  </p>
                )}
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {comment.author}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {comment.body}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {auth.isLoggedIn &&
                        (auth.username === comment.author || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors text-sm flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
                    disabled={skip === 0}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
                  </span>
                  <button
                    onClick={() => setSkip((s) => s + LIMIT)}
                    disabled={skip + LIMIT >= total}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Add comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder={
                    auth.isLoggedIn
                      ? "Write a comment..."
                      : "Login to comment..."
                  }
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}
    </>
  );
}
