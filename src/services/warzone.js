import { store } from "../store/store";

const BASE_URL = "http://localhost:8080";

function getToken() {
  return store.getState().auth.token;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function register(username, password) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Invalid username or password");
  }

  return response.json();
}

export async function fetchPosts(limit = 10, skip = 0, tag = null, search = null, sort = 'date') {
  const params = new URLSearchParams({ limit, skip, sort })
  if (tag)    params.append('tag', tag)
  if (search) params.append('search', search)

  const response = await fetch(`${BASE_URL}/posts?${params}`);
  return response.json();
}

export async function createPost(title, body, tag) {
  const response = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, body, tag }),
  });

  if (!response.ok) throw new Error("Could not create post");
  return response.json();
}

export async function deletePost(id) {
  return fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function votePost(postId, direction) {
  return fetch(`${BASE_URL}/posts/${postId}/vote?direction=${direction}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function fetchComments(postId, limit = 10, skip = 0) {
  const response = await fetch(
    `${BASE_URL}/posts/${postId}/comments?limit=${limit}&skip=${skip}`,
  );
  return response.json();
}

export async function addComment(postId, body) {
  const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });

  if (!response.ok) throw new Error("Could not add comment");
  return response.json();
}

export async function deleteComment(postId, commentId) {
  return fetch(`${BASE_URL}/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
