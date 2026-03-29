import EmptyState from './EmptyState';

export default function DataTable({ columns, rows, onEdit, onDelete }) {
  if (!rows.length) return <EmptyState text="No records found." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            {columns.map(c => (
              <th
                key={c.key}
                className="px-[14px] py-[10px] text-left font-semibold text-gray-500 text-[11px] uppercase tracking-[0.6px] whitespace-nowrap bg-gray-50"
              >
                {c.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-[14px] py-[10px] text-right bg-gray-50" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="table-row border-b border-gray-100">
              {columns.map(c => (
                <td
                  key={c.key}
                  className="px-[14px] py-[11px] text-gray-700 transition-colors duration-100"
                  style={{ whiteSpace: c.wrap ? 'normal' : 'nowrap' }}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-[14px] py-[11px] text-right">
                  <div className="flex gap-1.5 justify-end">
                    {onEdit && (
                      <button className="btn-default !px-2.5 !py-1 !text-[11px]" onClick={() => onEdit(row)}>
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button className="btn-danger !px-2.5 !py-1 !text-[11px]" onClick={() => onDelete(row)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
