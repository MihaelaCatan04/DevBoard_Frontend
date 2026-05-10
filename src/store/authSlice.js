import { createSlice } from "@reduxjs/toolkit";

function parseExpiry(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])).exp * 1000;
  } catch {
    return null;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    username: null,
    role: null,
    isLoggedIn: false,
    expiresAt: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.isLoggedIn = true;
      state.expiresAt = action.payload.token ? parseExpiry(action.payload.token) : null;
    },
    logout(state) {
      state.token = null;
      state.username = null;
      state.role = null;
      state.isLoggedIn = false;
      state.expiresAt = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
