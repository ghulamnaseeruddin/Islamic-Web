import Link from "next/link";

/** A highlighted note box (like the "Looking to chat?" box in Claude's docs). */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl border border-line bg-surface px-4 py-3 text-[15px] leading-7 [&_p]:m-0">
      {children}
    </div>
  );
}

export function DocTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="bg-soft">
            {head.map((h) => (
              <th key={h} className="border-b border-line px-4 py-2.5 text-sm font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-3 leading-7 ${i < rows.length - 1 ? "border-b border-line" : ""} ${j === 0 ? "font-medium" : "text-muted"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand underline underline-offset-2 hover:opacity-80">
      {children}
    </Link>
  );
}
