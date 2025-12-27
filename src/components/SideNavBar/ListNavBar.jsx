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
    <div className="flex w-full flex-col px-4 text-sm font-normal text-[#0b2c4a]">
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
                className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  card.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${
                  isParentActive
                    ? "bg-white/85 text-[#0b2c4a] shadow-sm ring-1 ring-white/70"
                    : "text-[#1d3557] hover:bg-white/70 hover:text-[#0b2c4a] hover:shadow-sm"
                }`}
                onClick={() => handleParentClick(card)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={card.icon}
                    alt="icon"
                    className="h-5 w-5 object-contain"
                  />
                  <span className="whitespace-nowrap">{card.title}</span>
                </div>

                {hasChildren && (
                  <IoChevronDown
                    className={`text-[#1d3557] transition-transform duration-200 group-hover:text-[#0b2c4a] ${
                      openDropdown === card.title ? "rotate-180 text-[#0b2c4a]" : ""
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
                <ul className="ml-8 mt-2 flex flex-col gap-1.5">
                  {card.children?.map((child) => {
                    const active = isActiveLink(child.link);
                    return (
                      <li
                        key={child.title}
                        onClick={() => handleChildClick(child)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-[#0b2c4a]/10 text-[#0b2c4a] ring-1 ring-[#0b2c4a]/10"
                            : "text-[#1d3557]/80 hover:bg-white/70 hover:text-[#0b2c4a]"
                        }`}
                      >
                        {child.icon && (
                          <img
                            src={child.icon}
                            alt={child.title}
                            className="h-4 w-4 object-contain"
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
