import { NavLink } from "react-router-dom";

import HomeIcon from "../assets/icons/HomeIcon";
import InputIcon from "../assets/icons/InputIcon";
import AnalyzationIcon from "../assets/icons/AnalyzationIcon";
import RewardIcon from "../assets/icons/RewardIcon";
import MyIcon from "../assets/icons/MyIcon";

type NavItem = {
  to: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

const NAV_LINKS: NavItem[] = [
  { to: "/personal/input", label: "입력", icon: InputIcon },
  { to: "/personal/analyzation", label: "분석", icon: AnalyzationIcon },
  { to: "/personal/home", label: "홈", icon: HomeIcon },
  { to: "/personal/reward", label: "리워드", icon: RewardIcon },
  { to: "/personal/my", label: "마이", icon: MyIcon },
];

export default function Navbar() {
  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-[402px] -translate-x-1/2 border-t border-[var(--color-grey-150)] bg-white px-5 py-3">
      <div className="flex w-full justify-between">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex w-[55px] flex-col items-center gap-1 ${
                isActive
                  ? "text-[var(--color-green)]"
                  : "text-[var(--color-grey-550)] hover:text-[var(--color-green)]"
              }`
            }
          >
            <Icon className="h-6 w-6" />
            <span className="caption1">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
