'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  mobileHidden?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  mobileCardRender?: (item: T) => ReactNode;
}

/**
 * Responsive table that switches to card layout on mobile
 */
export default function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  emptyIcon,
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-primary">
            <tr>
              {columns.filter(c => !c.mobileHidden).map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-accent">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-dark-primary/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.filter(c => !c.mobileHidden).map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-4 py-3 whitespace-nowrap ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-dark-primary border border-dark-accent rounded-xl p-4 ${
              onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
          >
            {mobileCardRender ? (
              mobileCardRender(item)
            ) : (
              <div className="space-y-2">
                {columns.slice(0, 4).map((column) => (
                  <div key={String(column.key)} className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">{column.header}</span>
                    <span className="text-white text-sm">
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] ?? '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

