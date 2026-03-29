export default function Modal({ title, subtitle, onClose, children, maxWidth = '600px' }) {
  return (
    <div
      className="fixed inset-0 bg-[rgba(10,18,40,0.55)] backdrop-blur-[4px] z-[400] flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white border border-gray-200 rounded-[14px] w-full max-h-[90vh] overflow-y-auto shadow-modal animate-scale-in"
        style={{ maxWidth }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-[2] rounded-t-[14px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[16px] font-bold text-navy-800 font-display">{title}</div>
              {subtitle && <div className="text-[12px] text-gray-400 mt-0.5">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-100 border-none text-gray-500 rounded-[8px] w-[30px] h-[30px] text-[18px] cursor-pointer flex items-center justify-center shrink-0 transition-colors duration-150 hover:bg-gray-200"
            >
              ×
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
