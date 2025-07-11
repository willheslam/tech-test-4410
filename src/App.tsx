import "./App.css"

import { useCallback, useEffect, useState } from "react"

import { AgGridReact } from "ag-grid-react"

import type { CellEditRequestEvent, CellFocusedEvent } from "ag-grid-community"
import {
  AllCommunityModule,
  ModuleRegistry,
  themeBalham,
} from "ag-grid-community"

import {
  INPUT_EXPRESSION_UPDATES,
  PUBLISH_EXPRESSION_UPDATES,
} from "./protocol"
import type { ExpressionNode } from "./spreadsheet/expressions"
import { DEMO_HEIGHT, DEMO_WIDTH } from "./spreadsheet/table"

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
const initialRowData = Array.from(
  { length: DEMO_HEIGHT },
  (_, i) =>
    [`${i + 1}`, ...Array.from({ length: DEMO_WIDTH }, () => ``)] as const,
)

const defaultColDef = {
  flex: 1,
}

// TODO: all the quick start examples use a height of 100%
// which shows nothing by default so set it to 100vh for now
const gridStyle = { width: "100%", height: "100vh" }
const inputStyle = { width: "100%" }

const Spreadsheet = () => {
  const [sheetWorker, setSheetWorker] = useState<SharedWorker>()

  const [rowData, setRowData] = useState(initialRowData)

  const [colDefs, setColDefs] = useState(gridColumns)

  const [rawExpressions, setRawExpressions] = useState(
    {} as Record<string, string>,
  )

  const [parsedSheetExpressions, setParsedExpressions] = useState(
    {} as Record<string, ExpressionNode>,
  )

  useEffect(() => {
    const myWorker = new SharedWorker(new URL("./worker.js", import.meta.url), {
      name: "spreadsheet-shared-worker",
    })

    myWorker.onerror = (error) => {
      console.error(error)
    }
    myWorker.port.addEventListener("message", (event) => {
      if (event.data.type === PUBLISH_EXPRESSION_UPDATES) {
        setParsedExpressions(event.data.parsedExpressions)
        setRawExpressions(event.data.rawExpressions)
        setRowData(event.data.rowData)
      }
    })
    myWorker.port.start()

    setSheetWorker(myWorker)
  }, [])

  const [inputText, setInputText] = useState("")
  const [currentCell, setCurrentCell] = useState<string>()

  const handleCellEditRequest = useCallback(
    (event: CellEditRequestEvent) => {
      if (sheetWorker !== undefined && currentCell !== undefined) {
        setRawExpressions((sheetExpressions) => ({
          ...sheetExpressions,
          [currentCell]: event.newValue,
        }))
        setInputText(event.newValue)

        sheetWorker.port.postMessage({
          type: INPUT_EXPRESSION_UPDATES,
          expressions: {
            [currentCell]: event.newValue,
          },
        })
      }
    },
    [sheetWorker, currentCell],
  )

  const handleExpressionInputKeyDown = useCallback(
    (event) => {
      if (currentCell !== undefined && sheetWorker !== undefined) {
        if (event.key === "Enter") {
          sheetWorker.port.postMessage({
            type: INPUT_EXPRESSION_UPDATES,
            expressions: {
              [currentCell]: inputText,
            },
          })

          setRawExpressions((sheetExpressions) => ({
            ...sheetExpressions,
            [currentCell]: inputText,
          }))
        }
      }
    },
    [sheetWorker, currentCell, inputText],
  )

  const handleExpressionInputChange = useCallback((event) => {
    setInputText(event.target.value)
  }, [])

  const handleCellFocused = useCallback(
    (event: CellFocusedEvent) => {
      const key = `${event.column.colDef.headerName}${event.rowIndex + 1}`

      setCurrentCell(key)
      setInputText(rawExpressions[key] ?? "")
    },
    [rawExpressions],
  )

  return (
    <div style={gridStyle}>
      <input
        style={inputStyle}
        onChange={handleExpressionInputChange}
        onKeyDown={handleExpressionInputKeyDown}
        type="text"
        placeholder="type expression here"
        value={inputText}
      ></input>
      <AgGridReact
        onCellFocused={handleCellFocused}
        readOnlyEdit={true}
        onCellEditRequest={handleCellEditRequest}
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
