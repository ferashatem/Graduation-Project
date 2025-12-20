import React, { useState } from "react";
import lougout from "../../assets/imgs/logout.png";
import { useNavigate } from "react-router-dom";
import { app } from "../../firebase/firebaseConfig";
import { getAuth, signOut } from "firebase/auth";

// ✅ Initialize Firebase Auth
export const auth = getAuth(app);

function LogoutIcon() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
    setShowConfirm(false);
  };

  return (
    <>
      {/* Logout Button */}
      <div
        className="mx-4 flex h-12 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl"
        onClick={() => setShowConfirm(true)}
      >
        <img className="h-6 w-6" src={lougout} alt="Logout" />
        <span>Logout</span>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-3xl bg-white/90 p-6 shadow-2xl ring-1 ring-white/70 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 text-center">
              <h3 className="text-xl font-semibold text-[#0b2c4a]">
                Logout?
              </h3>
              <p className="text-base text-[#1d3557]/80">
                Are you sure you want to logout of this <br /> session?
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-6 flex-wrap">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-2xl border border-[#0b2c4a]/20 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0b2c4a] transition hover:bg-[#0b2c4a]/5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-gradient-to-r from-[#0b2c4a] via-[#1d5fa3] to-[#0b2c4a] px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition hover:translate-y-[-1px] hover:shadow-lg"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LogoutIcon;
