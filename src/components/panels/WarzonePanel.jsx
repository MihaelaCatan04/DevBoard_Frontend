import { useState, useEffect } from "react";
import {
  fetchPosts,
  createPost,
  votePost,
  getToken,
} from "../../services/warzone";

export default function WarzonePanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [authed, setAuthed] = useState(false);
  const LIMIT = 5;

  useEffect(() => {
    getToken("devboard_user", "WRITER").then(() => setAuthed(true));
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchPosts(LIMIT, skip).then((res) => {
      setPosts(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [skip, authed]);

  function handleVote(postId, direction) {
    votePost(postId, direction).then(() => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, votes: p.votes + direction } : p,
        ),
      );
    });
  }

  return (
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
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Share a story
        </button>
      </div>

      {/* Create post form */}
      {showForm && (
        <CreatePostForm
          onSubmit={async (data) => {
            await createPost(data.title, data.body, data.tag);
            setShowForm(false);
            setSkip(0);
            fetchPosts(LIMIT, 0).then((res) => {
              setPosts(res.data);
              setTotal(res.total);
            });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Posts */}
      {loading ? (
        <p className="text-gray-500 text-center py-12">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onVote={handleVote} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
          disabled={skip === 0}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-500">
          Showing {skip + 1}–{Math.min(skip + LIMIT, total)} of {total}
        </span>
        <button
          onClick={() => setSkip((s) => s + LIMIT)}
          disabled={skip + LIMIT >= total}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, onVote }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex gap-4">
        {/* Votes */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onVote(post.id, 1)}
            className="text-gray-400 hover:text-blue-500 transition-colors"
          >
            ▲
          </button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {post.votes}
          </span>
          <button
            onClick={() => onVote(post.id, -1)}
            className="text-gray-400 hover:text-red-500 transition-colors"
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
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>by {post.author}</span>
            {post.tag && (
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                #{post.tag}
              </span>
            )}
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
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
          placeholder="Tell the story..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
        />
        <input
          type="text"
          placeholder="Tag — e.g. devops, frontend, database (optional)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            Post story
          </button>
        </div>
      </div>
    </div>
  );
}
