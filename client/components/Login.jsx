import React, { useEffect, useState } from "react";

import { useContext } from "react";

import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { assets } from "../src/assets/assets";
import { Appcontext } from "../src/context/Appcontext";

const Login = () => {
  const navigate = useNavigate();

  const { setShowLogin, backendUrl, setUser, setToken } =
    useContext(Appcontext);

  const [formMode, setFormMode] = useState("Login");

  const onSubmithandler = async (e) => {
    e.preventDefault();

    const endpoint =
      formMode === "Login" ? "/api/user/login" : "/api/user/register";
    const url = backendUrl + endpoint;

    const payload = { email, password };
    if (formMode === "Sign Up") {
      payload.name = name;
    }

    try {
      const { data } = await axios.post(url, payload);
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);

        toast.success(
          `Successfully ${formMode === "Login" ? "logged in" : "registered"}!`
        );

        setShowLogin(false);
        navigate("/zoom");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred.";
      toast.error(errorMessage);
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm flex justify-center items-center">
      <form
        onSubmit={onSubmithandler}
        className="relative p-8 bg-white rounded-2xl text-slate-600 w-full max-w-sm mx-4"
      >
        <img
          onClick={() => setShowLogin(false)}
          src={assets.cross_icon}
          alt="Close"
          className="absolute top-4 right-4 cursor-pointer w-5"
        />

        <div className="flex bg-slate-100 p-1 rounded-full mb-6">
          <button
            type="button"
            onClick={() => setFormMode("Login")}
            className={`w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${
              formMode === "Login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setFormMode("Sign Up")}
            className={`w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${
              formMode === "Sign Up"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="text-2xl text-center text-neutral-800 font-bold mb-2">
          {formMode === "Login" ? "Welcome Back!" : "Create an Account"}
        </h1>
        <p className="text-sm text-center mb-6">
          Please enter your details to continue.
        </p>

        {formMode === "Sign Up" && (
          <div className="border px-4 py-3 flex items-center gap-3 rounded-md mb-4 border-none">
            <img src={assets.profile_icon} alt="" className="w-7" />
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              placeholder="Full Name"
              required
              className="outline-none text-sm w-full bg-transparent"
            />
          </div>
        )}

        <div className="border px-4 py-3 flex items-center gap-3 rounded-md mt-4 border-none">
          <img src={assets.email_icon} alt="" className="w-5" />
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Email Address"
            required
            className="outline-none text-sm w-full bg-transparent"
          />
        </div>
        <div className="border px-4 py-3 flex items-center gap-3 rounded-md mt-4 border-none">
          <img src={assets.lock_icon} alt="" className="w-5" />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Password"
            required
            className="outline-none text-sm w-full bg-transparent"
          />
        </div>

        <p className="text-xs text-blue-600 my-4 cursor-pointer text-right font-semibold">
          Forgot password?
        </p>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 w-full rounded-full font-semibold"
        >
          {formMode === "Login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default Login;
