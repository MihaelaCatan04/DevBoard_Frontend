import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/es/storage";
import profileReducer from "./profileSlice";
import themeReducer from "./themeSlice";
import authReducer from "./authSlice";

const profilePersistConfig = { key: "devboard_profile", storage };
const themePersistConfig = { key: "devboard_theme", storage };
const authPersistConfig = { key: "devboard_auth", storage };

export const store = configureStore({
  reducer: {
    profile: persistReducer(profilePersistConfig, profileReducer),
    theme: persistReducer(themePersistConfig, themeReducer),
    auth: persistReducer(authPersistConfig, authReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
