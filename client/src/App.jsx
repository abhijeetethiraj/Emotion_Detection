import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "../components/Login";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useContext } from "react";
import { Appcontext } from "./context/Appcontext";

import ZoomClone from "./pages/ZoomClone";
import VideoApp from "./pages/VideoApp";

import EmotionDashboard from "./pages/EmotionDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

const App = () => {
  const { showLogin } = useContext(Appcontext);

  return (
    <div className="px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gradient-to-b from-teal-50 to-orange-50">
      <Navbar />

      {showLogin && <Login />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/zoom" element={<ZoomClone />} />
        <Route
          path="/video"
          element={
            <ProtectedRoute>
              <VideoApp />{" "}
            </ProtectedRoute>
          }
        />

        <Route path="/emotion" element={<EmotionDashboard />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
