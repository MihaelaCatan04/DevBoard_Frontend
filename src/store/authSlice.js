import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    username: null,
    role: null,
    isLoggedIn: false,
  },
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.isLoggedIn = true;
    },
    logout(state) {
      state.token = null;
      state.username = null;
      state.role = null;
      state.isLoggedIn = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
