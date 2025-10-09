import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const Appcontext = createContext();

const AppcontextProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // Verify token and fetch user on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          const response = await axios.get(`${backendUrl}/auth/verify`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.data.success) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [backendUrl]);

  const value = {
    showLogin,
    setShowLogin,
    user,
    setUser,
    logout,
    backendUrl,
    token,
    setToken,
    loading,
  };

  return <Appcontext.Provider value={value}>{children}</Appcontext.Provider>;
};

export default AppcontextProvider;
