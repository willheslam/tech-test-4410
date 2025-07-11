import "./App.css"

import { useState } from "react"

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"

import { themeBalham } from "ag-grid-community"

ModuleRegistry.registerModules([AllCommunityModule])

const getRowId = (row: { data: [rowNumber: number] }) => row.data[0]

const columns = 20
const rows = 30

const gridColumns = Array.from({ length: columns + 1 }, (_, i) => ({
  colId: `${i}`,
  field: `${i}`,
  headerName: i === 0 ? "" : String.fromCharCode(64 + i),
}))
const initialRowData = Array.from(
  { length: rows },
  (_, i) =>
    [
      `${i + 1}`,
      ...Array.from({ length: columns }, () =>
        Math.floor(100.0 * Math.random()),
      ),
    ] as const,
)

const defaultColDef = {
  flex: 1,
}

// TODO: all the quick start examples use a height of 100%
// which shows nothing by default so set it to 100vh for now
const gridStyle = { width: "100%", height: "100vh" }

const Spreadsheet = () => {
  const [rowData, setRowData] = useState(initialRowData)

  const [colDefs, setColDefs] = useState(gridColumns)

  return (
    <div style={gridStyle}>
      <AgGridReact
        theme={themeBalham}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
      />
    </div>
  )
}

const App = () => {
  return <Spreadsheet />
}

export default App
