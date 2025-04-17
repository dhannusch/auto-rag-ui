import React, { useState } from 'react';

interface SearchResult {
  file_id: string;
  filename: string;
  score: number;
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface RegularSearchResultsProps {
  results: {
    object: string;
    search_query: string;
    data: SearchResult[];
    has_more: boolean;
    next_page: string | null;
  };
}

export const RegularSearchResults: React.FC<RegularSearchResultsProps> = ({ results }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            <th scope="col" className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              File name
            </th>
            <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Score
            </th>
            <th scope="col" className="w-[70%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Content
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {results.data.map((result) => {
            const isExpanded = expandedRows.has(result.file_id);
            const contentText = result.content.map(item => item.text).join(' ');
            const shouldTruncate = contentText.length > 300;
            const displayText = shouldTruncate && !isExpanded 
              ? contentText.slice(0, 300) + '...'
              : contentText;

            return (
              <tr key={result.file_id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="px-4 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <div className="break-words" title={result.filename}>
                    {result.filename}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
                  {result.score.toFixed(3)}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 dark:text-slate-300 break-words">
                    <p className="whitespace-pre-wrap my-0">{displayText}</p>
                    {shouldTruncate && (
                      <button
                        type="button"
                        onClick={() => toggleRow(result.file_id)}
                        className="mt-2 text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 