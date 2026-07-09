import { createContext, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const value = {
    user: { name: "Admin Demo", role: "admin" },
    logout: () => alert("Đăng xuất (demo)"),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);