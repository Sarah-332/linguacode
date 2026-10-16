'use client';

import { diffLines, Change } from 'diff';
import { useMemo } from 'react';

interface CodeDiffProps {
  original: string;
  refactored: string;
}

export default function CodeDiff({ original, refactored }: CodeDiffProps) {
  const diffLinesResult = useMemo(() => {
    return diffLines(original, refactored);
  }, [original, refactored]);

  return (
    <div className="overflow-x-auto rounded border border-gray-700 bg-slate-950 font-mono text-sm leading-relaxed">
      <table className="w-full border-collapse">
        <tbody>
          {diffLinesResult.map((part: Change, idx: number) => {
            const lines = part.value.split('\n').slice(0, -1);
            const lineStyle = part.added
              ? 'bg-green-950/60 text-green-300 border-green-800'
              : part.removed
              ? 'bg-red-950/60 text-red-300 border-red-800'
              : 'bg-slate-900 text-slate-300 border-slate-800';

            const prefix = part.added ? '+' : part.removed ? '-' : ' ';

            return lines.map((line, lineIdx) => (
              <tr key={`${idx}-${lineIdx}`} className={`border-b ${lineStyle}`}>
                <td className="select-none w-10 px-2 text-right text-gray-500 border-r border-inherit">
                  {prefix}
                </td>
                <td className="px-3 py-0.5 whitespace-pre">{line}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}