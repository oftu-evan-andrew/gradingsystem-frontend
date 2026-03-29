export default function EmptyState({ text }) {
  return (
    <div className="py-10 text-center text-gray-400 text-[13px] border-[1.5px] border-dashed border-gray-200 rounded-[10px] bg-gray-50">
      <div className="text-[20px] mb-2 opacity-40">—</div>
      {text}
    </div>
  );
}
