export default function PageHeader({ title, sub, action }) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div className="animate-fade-up">
        <h1 className="text-[22px] font-extrabold text-navy-900 font-display leading-none mb-1">
          {title}
        </h1>
        {sub && <p className="text-[12px] text-gray-400 m-0">{sub}</p>}
      </div>
      {action && <div className="animate-fade-up">{action}</div>}
    </div>
  );
}
