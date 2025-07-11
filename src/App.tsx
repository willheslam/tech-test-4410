import "./App.css"

import { useCallback, useState } from "react"

import { AgGridReact } from "ag-grid-react"

import type { CellEditRequestEvent, CellFocusedEvent } from "ag-grid-community"
import {
  AllCommunityModule,
  ModuleRegistry,
  themeBalham,
} from "ag-grid-community"

import { DEMO_WIDTH } from "./spreadsheet/table"

import { useSpreadsheet, type RowData } from "./spreadsheet/use-spreadsheet"

ModuleRegistry.registerModules([AllCommunityModule])

const getRowId = (row: { data: [rowNumber: number] }) => row.data[0]

const gridColumns = Array.from({ length: DEMO_WIDTH + 1 }, (_, i) => ({
  colId: `${i}`,
  field: `${i}`,
  headerName: i === 0 ? "" : String.fromCharCode(64 + i),
  editable: i > 0,

  cellClass: (params) => {
    if (i > 0 && Number(params.value) < 0) {
      return "negative-warning"
    }
    return ""
  },
}))

const defaultColDef = {
  flex: 1,
}

// TODO: all the quick start examples use a height of 100%
// which shows nothing by default so set it to 100vh for now
const gridStyle = { width: "100%", height: "100vh" }
const inputStyle = { width: "100%" }

const eventToKey = (ev: CellEditRequestEvent | CellFocusedEvent): string =>
  `${ev.column.colDef.headerName}${ev.rowIndex + 1}`

const Grid = ({
  setCurrentCell,
  update,
  setExpressionText,
  rawExpressions,
  rowData,
}: {
  setCurrentCell: (cell: string) => void
  update: (cell: string, expression: string) => void
  setExpressionText: (expression: string) => void
  rawExpressions: Record<string, string>
  rowData: RowData
}) => {
  const handleCellEditRequest = useCallback(
    (event: CellEditRequestEvent) => {
      update(eventToKey(event), event.newValue)
      setExpressionText(event.newValue)
    },
    [update, setExpressionText],
  )

  const handleCellFocused = useCallback(
    (event: CellFocusedEvent) => {
      const key = eventToKey(event)
      setCurrentCell(key)
      setExpressionText(rawExpressions[key] ?? "")
    },
    [setCurrentCell, setExpressionText, rawExpressions],
  )

  return (
    <AgGridReact
      onCellFocused={handleCellFocused}
      readOnlyEdit={true}
      onCellEditRequest={handleCellEditRequest}
      theme={themeBalham}
      rowData={rowData}
      columnDefs={gridColumns}
      defaultColDef={defaultColDef}
      getRowId={getRowId}
    />
  )
}

const ExpressionInput = ({
  update,
  expressionText,
  setExpressionText,
}: {
  update: (expression: string) => void
  expressionText: string
  setExpressionText: (expression: string) => void
}) => {
  const handleExpressionInputKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        update(expressionText)
      }
    },
    [update, expressionText],
  )

  const handleExpressionInputChange = useCallback(
    (event) => {
      setExpressionText(event.target.value)
    },
    [setExpressionText],
  )

  return (
    <input
      style={inputStyle}
      onChange={handleExpressionInputChange}
      onKeyDown={handleExpressionInputKeyDown}
      type="text"
      placeholder="type expression here"
      value={expressionText}
    ></input>
  )
}

const Spreadsheet = () => {
  const [rowData, rawExpressions, update] = useSpreadsheet()

  const [expressionText, setExpressionText] = useState("")
  const [currentCell, setCurrentCell] = useState<string>()

  const updateCurrentCell = useCallback(
    (text: string) => {
      if (currentCell !== undefined) {
        update(currentCell, text)
      }
    },
    [update, currentCell],
  )

  return (
    <div style={gridStyle}>
      <ExpressionInput
        update={updateCurrentCell}
        expressionText={expressionText}
        setExpressionText={setExpressionText}
      />
      <Grid
        setCurrentCell={setCurrentCell}
        update={update}
        setExpressionText={setExpressionText}
        rawExpressions={rawExpressions}
        rowData={rowData}
      />
    </div>
  )
}

const App = () => {
  return <Spreadsheet />
}

export default App
