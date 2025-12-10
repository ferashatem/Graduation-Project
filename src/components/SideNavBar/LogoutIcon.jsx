import React, { useState } from "react";
import lougout from "../../assets/imgs/logout.png";
import { useNavigate } from "react-router-dom";
import { app } from "../../firebase";
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
        className="w-[100%] h-16 flex justify-center items-center gap-3 cursor-pointer bg-[#303030] hover:bg-opacity-90 text-white"
        onClick={() => setShowConfirm(true)}
      >
        <img className="h-6 w-6" src={lougout} alt="Logout" />
        <span className="text-sm font-medium">Logout</span>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-[400px] border-2 bg-white rounded-[22px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 text-center">
              <h3 className="text-[#2972B9] text-xl font-semibold">Logout?</h3>
              <p className="text-black text-base">
                Are you sure you want to logout of this <br /> session?
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-6 flex-wrap">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-white px-6 py-2 border-2 rounded-lg text-[#0D1321] text-xs uppercase border-[#0D1321] hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#0D1321] px-6 py-2 border-2 rounded-lg text-xs uppercase text-white hover:bg-red-600"
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
