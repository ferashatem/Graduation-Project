import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import profile from "../../assets/imgs/profile.png";
import ring from "../../assets/imgs/ring.png";

function ProfileIcon() {
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <div className="relative mx-4 flex items-center gap-4 rounded-2xl bg-white/70 px-4 py-4 text-[#0b2c4a] shadow-sm ring-1 ring-white/60">
      {/* Profile Image */}
      <div className="h-11 w-11 rounded-full bg-white p-1 shadow-sm">
        <img
          className="h-full w-full rounded-full object-cover"
          src={profile}
          alt="Profile"
        />
      </div>

      {/* Username with tooltip */}
      <div className="flex-1 min-w-0 relative group">
        <h1 className="max-w-[100px] truncate text-xs font-semibold sm:text-sm">
          {userName.length > 10 ? `${userName.slice(0, 10)}...` : userName}
        </h1>

        {/* Tooltip */}
        {userName.length > 10 && (
          <span className="absolute bottom-full left-0 z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-[#0b2c4a] px-3 py-1 text-xs text-white shadow-lg group-hover:block">
            {userName}
          </span>
        )}
      </div>

      {/* Notification Bell */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-white/60">
        <img
          className="h-4 w-4 object-contain"
          src={ring}
          alt="Notifications"
        />
      </div>
    </div>
  );
}

export default ProfileIcon;
