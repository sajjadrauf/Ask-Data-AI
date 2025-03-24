"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DataTableProps {
  data: any[]
}

export function DataTable({ data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Get all column keys from the first row
  const columns = Object.keys(data[0])

  // Filter data based on search term
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Sort data if sortConfig is set
  const sortedData = [...filteredData]
  if (sortConfig) {
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }

  // Handle sort request
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Export data as CSV
  const exportCSV = () => {
    const headers = columns.join(",")
    const rows = sortedData.map((row) => columns.map((col) => `"${row[col]}"`).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "data_export.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={exportCSV} className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>
      <div className="border rounded-md overflow-auto max-h-[600px]">
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80"
                  onClick={() => requestSort(column)}
                >
                  <div className="flex items-center">
                    {column}
                    {sortConfig?.key === column && (
                      <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-4 py-2 text-sm">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {sortedData.length} of {data.length} rows
      </div>
    </div>
  )
}

