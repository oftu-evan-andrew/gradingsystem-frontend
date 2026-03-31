import Avatar from '../ui/Avatar';
// Logo is embedded as base64 — imported from constants
import { AICS_LOGO } from '../../constants/logo';
import { T } from '../../constants/tokens';

export default function Navbar({ title, role, user, userId, userSub, onToggle, onLogout }) {
  return (
    <nav className="h-[58px] shrink-0 bg-navy-900 flex items-center justify-between px-5 z-50 shadow-nav">
      {/* Left */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggle}
          className="bg-white/[0.06] border border-white/[0.08] text-white/60 rounded-[7px] w-8 h-8 text-[15px] cursor-pointer flex items-center justify-center transition-colors duration-150 hover:bg-white/[0.12]"
        >
          ☰
        </button>
        <div className="flex items-center gap-2.5">
          <img
            src={AICS_LOGO}
            alt="AICS"
            className="w-[30px] h-[30px] rounded-full object-cover"
            style={{ border: `1px solid ${T.gold400}40`, boxShadow: `0 0 10px ${T.gold400}20` }}
          />
          <div>
            <div className="text-[13px] font-bold text-white tracking-[0.3px] font-display leading-none">
              {title}
            </div>
            <div className="text-[10px] text-gold-400 font-medium tracking-[0.5px] mt-px">
              {role === 'professor' ? 'Faculty Portal' : 'Student Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3.5">
        <div className="text-right">
          <div className="text-[13px] font-semibold text-white">{user}</div>
          <div className="text-[10px] text-white/35">
            {userId}{userSub ? ` · ${userSub}` : ''}
          </div>
        </div>
        <Avatar name={user} size={34} />
        <button
          onClick={onLogout}
          className="bg-white/[0.05] border border-white/10 text-white/45 rounded-md px-3 py-[5px] text-[11px] cursor-pointer font-medium transition-all duration-150 hover:bg-white/10 hover:text-white/80"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
