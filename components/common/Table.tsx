
import React from 'react';

interface TableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
}

const Table = <T extends unknown>({ headers, data, renderRow }: TableProps<T>) => {
  return (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-brand-dark">
                <tr>
                    {headers.map((header) => (
                        <th key={header} scope="col" className="px-4 py-3 font-semibold">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map(renderRow)
                ) : (
                    <tr>
                        <td colSpan={headers.length} className="text-center p-8 text-gray-500">
                            No data available.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );
};

export default Table;
