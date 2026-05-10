const BASE_URL = "http://localhost:8080";

let currentToken = null;
let currentUsername = null;

export async function getToken(username, role) {
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, role }),
  });
  const data = await response.json();
  currentToken = data.token;
  currentUsername = data.username;
  return data;
}

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }
  return headers;
}

export async function fetchPosts(limit = 10, skip = 0, tag = null) {
  const params = new URLSearchParams({ limit, skip });
  if (tag) params.append("tag", tag);

  const response = await fetch(`${BASE_URL}/posts?${params}`);
  return response.json();
}

export async function createPost(title, body, tag) {
  const response = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, body, tag }),
  });
  return response.json();
}

export async function deletePost(id) {
  return fetch(`${BASE_URL}/posts/${id}`, {
    method: "DELETE",
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
  return response.json();
}

export async function votePost(postId, direction) {
  return fetch(`${BASE_URL}/posts/${postId}/vote?direction=${direction}`, {
    method: "POST",
    headers: authHeaders(),
  });
}
