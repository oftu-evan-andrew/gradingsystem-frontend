export default function Field({ label, children }) {
  return (
    <div className="mb-[14px]">
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.6px] mb-[6px]">
        {label}
      </label>
      {children}
    </div>
  );
}
