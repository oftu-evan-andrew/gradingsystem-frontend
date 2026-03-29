import { T } from '../../constants/tokens';

export default function AdminSidebar({ items, activePage, onNav, collapsed, footer }) {
  return (
    <aside
      className="shrink-0 bg-navy-800 flex flex-col border-r border-white/[0.04] overflow-hidden transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ width: collapsed ? '56px' : '210px' }}
    >
      <div className="py-3 flex-1">
        {items.map(item => (
          <button
            key={item.id}
            className={`sidebar-btn${activePage === item.id ? ' sidebar-btn-active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span
              className="w-[7px] h-[7px] rounded-full shrink-0 transition-all duration-150"
              style={{
                background: activePage === item.id ? T.gold400 : 'rgba(255,255,255,0.18)',
                boxShadow: activePage === item.id ? `0 0 6px ${T.gold400}80` : 'none',
              }}
            />
            {!collapsed && <span className="overflow-hidden text-ellipsis">{item.label}</span>}
          </button>
        ))}
      </div>

      {!collapsed && footer && (
        <div className="px-4 py-[14px] border-t border-white/[0.06]">
          <div className="text-[10px] text-white/[0.18] leading-relaxed tracking-[0.2px]">
            {footer}
          </div>
        </div>
      )}
    </aside>
  );
}
