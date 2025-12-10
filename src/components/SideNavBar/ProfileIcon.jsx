import React, { useEffect, useState } from "react";
import profile from "../../assets/imgs/profile.png";
import ring from "../../assets/imgs/ring.png";

function ProfileIcon() {
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <div className="flex items-center gap-5 px-4 py-4 text-black relative">
      {/* Profile Image */}
      <img
        className="h-11 w-11 rounded-full object-cover text-black"
        src={profile}
        alt="Profile"
      />

      {/* Username with tooltip */}
      <div className="flex-1 min-w-0 relative group">
        <h1 className="text-xs sm:text-base truncate max-w-[100px] cursor-pointer">
          {userName.length > 10 ? `${userName.slice(0, 10)}...` : userName}
        </h1>

        {/* Tooltip */}
        {userName.length > 10 && (
          <span className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-3 py-1 rounded-lg shadow-lg whitespace-nowrap z-10">
            {userName}
          </span>
        )}
      </div>

      {/* Notification Bell */}
      <img
        className="w-4 sm:w-5 object-contain"
        src={ring}
        alt="Notifications"
      />
    </div>
  );
}

export default ProfileIcon;
