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

const useSpreadsheetWorker = () => {
  const [rowData, setRowData] = useState(initialRowData)

  const [rawExpressions, setRawExpressions] = useState(
    {} as Record<string, string>,
  )
  const [parsedSheetExpressions, setParsedExpressions] = useState(
    {} as Record<string, ExpressionNode>,
  )

  const [sheetWorker, setSheetWorker] = useState<SharedWorker>()

  useEffect(() => {
    const myWorker = new SharedWorker(new URL("./worker.js", import.meta.url), {
      name: "spreadsheet-shared-worker",
    })

    myWorker.onerror = (error) => {
      console.error(error)
    }
    const listener = (event) => {
      if (event.data.type === PUBLISH_EXPRESSION_UPDATES) {
        setParsedExpressions(event.data.parsedExpressions)
        setRawExpressions(event.data.rawExpressions)
        setRowData(event.data.rowData)
      }
    }

    myWorker.port.addEventListener("message", listener)
    myWorker.port.start()

    setSheetWorker(myWorker)

    return () => {
      myWorker.port.close()
      myWorker.removeEventListener("message", listener)
      setSheetWorker(undefined)
    }
  }, [])

  const update = useCallback(
    (currentCell: string, text: string) => {
      if (sheetWorker !== undefined) {
        sheetWorker.port.postMessage({
          type: INPUT_EXPRESSION_UPDATES,
          expressions: {
            [currentCell]: text,
          },
        })

        setRawExpressions((sheetExpressions) => ({
          ...sheetExpressions,
          [currentCell]: text,
        }))
      }
    },
    [sheetWorker],
  )

  return [rowData, rawExpressions, update] as const
}

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
  rowData: typeof initialRowData
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
  const [rowData, rawExpressions, update] = useSpreadsheetWorker()

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
