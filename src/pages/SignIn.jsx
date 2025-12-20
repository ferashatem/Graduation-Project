import React, { useState } from "react";
import "../assets/styles/styles.css";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

import BigLogo from '../assets/university-logo.png'

export const auth = getAuth(app);

function SignIn() {
  const [user, pageLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ⬅️ add this right after hooks
if (pageLoading) {
  return (
    <section className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-[#B0B0B0] to-blue-600">
      <div className="w-12 h-12 border-4 border-white/40 border-t-white rounded-full animate-spin" />
    </section>
  );
}

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    const user = userCred.user;
    const userName = user.displayName || user.email.split("@")[0];

    // Save locally if you need
    localStorage.setItem("userName", userName);
    localStorage.setItem(
      "user",
      JSON.stringify({ role: "admin", email: user.email })
    );

    // Always redirect to admin
    navigate("/admin", { replace: true });
  } catch (err) {
    console.error("❌ Firebase SignIn Error:", err.code, err.message);
    alert("Login failed: " + err.message);
    setLoading(false);
  }
};


  return (
    <section className="flex flex-col lg:flex-row h-screen w-screen">
      {/* Left Image Section */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center gap-4">
        <img
          src={BigLogo}
          alt="Sign in Illustration"
          className="max-w-[80%] h-auto"
        />
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 bg-gradient-to-r from-[#303030] via-blue-600 to-[#B0B0B0] flex items-center justify-center py-6">
        <div className="h-auto lg:h-[528px] w-[90%] max-w-sm lg:w-[354px] rounded-[15px] text-center flex flex-col shadow-lg">
          <div className="w-full h-28 lg:h-[40%] flex justify-center items-center rounded-t-[20px] bg-blue-600">
            <h1 className="text-white font-bold uppercase font-sans text-2xl">
              Welcome
            </h1>
          </div>

          <div className="w-full h-auto lg:h-[60%] bg-white rounded-b-[20px] flex flex-col items-center justify-center p-6">
            <form
              className="bg-white p-5 rounded-lg flex flex-col gap-5 w-full"
              onSubmit={handleSubmit}
            >
              <div className="w-full rounded-lg p-[1px] bg-blue-600">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-none focus:outline-none bg-white text-gray-900"
                  required
                />
              </div>

              <div className="w-full rounded-lg p-[1px] bg-blue-600">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-none focus:outline-none bg-white text-gray-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white text-lg rounded-full bg-blue-600 hover:opacity-80 transition flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
