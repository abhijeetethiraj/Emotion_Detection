// ProtectedRoute.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { Appcontext } from "../src/context/Appcontext";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const { user, setShowLogin } = useContext(Appcontext);

  useEffect(() => {
    if (!user) {
      setShowLogin(true);
      navigate("/");
    }
  }, [user, navigate, setShowLogin]);

  // Optional: show a loading state while checking user
  if (!user) return null;

  return children;
};

export default ProtectedRoute;
