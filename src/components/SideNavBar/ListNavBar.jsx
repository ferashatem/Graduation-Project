import React, { useEffect, useMemo, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";

function ListNavBar({ isMobile, closeMenu, navItems = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cards = Array.isArray(navItems) ? navItems : [];

  const initialOpenTitle = useMemo(() => {
    const match = cards.find(
      (c) =>
        Array.isArray(c.children) &&
        c.children.some(
          (ch) =>
            location.pathname.endsWith("/" + ch.link) ||
            location.pathname.includes("/" + ch.link + "/")
        )
    );
    return match?.title ?? null;
  }, [cards, location.pathname]);

  const [openDropdown, setOpenDropdown] = useState(initialOpenTitle);

  useEffect(() => {
    setOpenDropdown(initialOpenTitle);
  }, [initialOpenTitle]);

  const isActiveLink = (link) =>
    location.pathname.endsWith("/" + link) ||
    location.pathname.includes("/" + link + "/");

  const handleParentClick = (card) => {
    if (card.disabled) return;
    if (card.children?.length) {
      setOpenDropdown((prev) => (prev === card.title ? null : card.title));
    } else if (card.link) {
      navigate(card.link);
      if (isMobile && closeMenu) closeMenu();
    }
  };

  const handleChildClick = (child) => {
    navigate(child.link);
    if (isMobile && closeMenu) closeMenu();
  };

  return (
    <div className="w-full px-4 text-white font-sans font-normal text-base flex flex-col">
      <ul className="flex flex-col gap-2">
        {cards.map((card, index) => {
          const hasChildren =
            Array.isArray(card.children) && card.children.length > 0;
          const isParentActive =
            (!hasChildren && card.link && isActiveLink(card.link)) ||
            (hasChildren && card.children.some((ch) => isActiveLink(ch.link)));

          return (
            <li key={index} className="w-full">
              {/* Parent row */}
              <div
                className={`flex items-center justify-between w-full h-[48px] px-4 rounded-md transition-all duration-1000 text-sm ${
                  card.disabled ? "cursor-not-allowed" : "cursor-pointer"
                } ${
                  isParentActive ? "bg-[#303030]/35" : "hover:bg-[#303030]"
                }`}
                onClick={() => handleParentClick(card)}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={card.icon}
                    alt="icon"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-white group-hover:text-white whitespace-nowrap">
                    {card.title}
                  </span>
                </div>

                {hasChildren && (
                  <IoChevronDown
                    className={`text-white transition-transform duration-200 ${
                      openDropdown === card.title ? "rotate-180" : ""
                    }`}
                    size={16}
                  />
                )}
              </div>

              {/* Children with animation */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  openDropdown === card.title ? "max-h-40" : "max-h-0"
                }`}
              >
                <ul className="mt-1 ml-10 flex flex-col gap-1">
                  {card.children?.map((child) => {
                    const active = isActiveLink(child.link);
                    return (
                      <li
                        key={child.title}
                        onClick={() => handleChildClick(child)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition ${
                          active
                            ? "bg-white/15 text-white"
                            : "text-white/90 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {child.icon && (
                          <img
                            src={child.icon}
                            alt={child.title}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span>{child.title}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ListNavBar;
