import type { ReactNode } from 'react'

export type DocTableRow = {
  cells: ReactNode[]
  id: string
}

export function DocTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: string[]
  rows: DocTableRow[]
}) {
  return (
    <section aria-label={`${caption} 표`} className="doc-table-scroll">
      <table className="doc-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) =>
                index === 0 ? (
                  <th key={`${row.id}-${columns[index]}`} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={`${row.id}-${columns[index]}`}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
