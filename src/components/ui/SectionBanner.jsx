export default function SectionBanner({ section }) {
  return (
    <div className="bg-gradient-to-r from-navy-50 to-white border border-navy-100 border-l-[3px] border-l-navy-400 rounded-[7px] px-4 py-2.5 mb-5 flex items-center gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0" />
      <span className="text-[12px] text-gray-500">
        Showing subjects exclusively for section &nbsp;
        <strong className="text-navy-700 font-bold">{section}</strong>
      </span>
    </div>
  );
}
