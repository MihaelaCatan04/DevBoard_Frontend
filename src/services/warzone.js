import { store } from '../store/store'
import { logout } from '../store/authSlice'

const BASE_URL = 'http://localhost:8080'

function getToken() {
  const state = store.getState()
  const auth = state.auth
  if (!auth) return null
  return auth.token ?? null
}

function isTokenExpired() {
  const { expiresAt } = store.getState().auth ?? {}
  return expiresAt != null && Date.now() >= expiresAt
}

async function authFetch(url, options = {}) {
  const token = getToken()

  if (token && isTokenExpired()) {
    store.dispatch(logout())
    throw new Error('Session expired — please login again')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    }
  })

  if (response.status === 429) {
    throw new Error('429 Too many requests')
  }

  if (response.status === 401 && token) {
    store.dispatch(logout())
    throw new Error('Session expired — please login again')
  }

  if (response.status === 401 && !token) {
    throw new Error('Please login to continue')
  }

  return response
}

export async function register(username, password) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Registration failed')
  }
  return response.json()
}

export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Invalid username or password')
  }
  return response.json()
}

export async function fetchPosts(limit = 10, skip = 0, tag = null, search = null, sort = 'date') {
  const params = new URLSearchParams({ limit, skip, sort })
  if (tag)    params.append('tag', tag)
  if (search) params.append('search', search)

  const response = await fetch(`${BASE_URL}/posts?${params}`)
  if (response.status === 429) throw new Error('429 Too many requests')
  return response.json()
}

export async function createPost(title, body, tag) {
  const response = await authFetch(`${BASE_URL}/posts`, {
    method: 'POST',
    body: JSON.stringify({ title, body, tag })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Could not create post')
  }
  return response.json()
}

export async function updatePost(id, title, body, tag) {
  const response = await authFetch(`${BASE_URL}/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, body, tag })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Could not update post')
  }
  return response.json()
}

export async function deletePost(id) {
  const response = await authFetch(`${BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok && response.status !== 204) {
    throw new Error('Could not delete post')
  }
}

export async function votePost(postId, direction) {
  const response = await authFetch(
    `${BASE_URL}/posts/${postId}/vote?direction=${direction}`,
    { method: 'POST' }
  )
  if (!response.ok) throw new Error('Could not vote')
  return response.json()
}

export async function fetchAllPostsAdmin(limit = 10, skip = 0) {
  const response = await authFetch(
    `${BASE_URL}/admin/posts?limit=${limit}&skip=${skip}`
  )
  if (!response.ok) throw new Error('Could not fetch admin posts')
  return response.json()
}

export async function restorePost(id) {
  const response = await authFetch(`${BASE_URL}/admin/posts/${id}/restore`, {
    method: 'POST'
  })
  if (!response.ok) throw new Error('Could not restore post')
}

export async function hardDeletePost(id) {
  const response = await authFetch(`${BASE_URL}/admin/posts/${id}/hard`, {
    method: 'DELETE'
  })
  if (!response.ok && response.status !== 204) {
    throw new Error('Could not permanently delete post')
  }
}

export async function getUser(username) {
  const response = await authFetch(`${BASE_URL}/admin/users/${username}`)
  if (!response.ok) throw new Error('User not found')
  return response.json()
}

export async function fetchComments(postId, limit = 10, skip = 0) {
  const response = await fetch(
    `${BASE_URL}/posts/${postId}/comments?limit=${limit}&skip=${skip}`
  )
  return response.json()
}

export async function addComment(postId, body) {
  const response = await authFetch(`${BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Could not add comment')
  }
  return response.json()
}

export async function deleteComment(postId, commentId) {
  const response = await authFetch(
    `${BASE_URL}/posts/${postId}/comments/${commentId}`,
    { method: 'DELETE' }
  )
  if (!response.ok && response.status !== 204) {
    throw new Error('Could not delete comment')
  }
}