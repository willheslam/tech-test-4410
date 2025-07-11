import "./App.css"

import { useState, useCallback, useEffect } from "react"

import { AgGridReact } from "ag-grid-react"

import {
  AllCommunityModule,
  ModuleRegistry,
  themeBalham,
} from "ag-grid-community"
import type {
  CellValueChangedEvent,
  CellEditRequestEvent,
} from "ag-grid-community"

import { UPDATE } from "./protocol"

ModuleRegistry.registerModules([AllCommunityModule])

const getRowId = (row: { data: [rowNumber: number] }) => row.data[0]

const columns = 20
const rows = 30

const gridColumns = Array.from({ length: columns + 1 }, (_, i) => ({
  colId: `${i}`,
  field: `${i}`,
  headerName: i === 0 ? "" : String.fromCharCode(64 + i),
  editable: true,

  // TODO: will this be useful for colocating numeric results and string expressions?
  // where to show text expressions?
  // valueGetter: params => {
  //     return params.data.name;
  // },
  // valueSetter: params => {
  //     params.data.name = params.newValue;
  //     return true;
  // }
}))
const initialRowData = Array.from(
  { length: rows },
  (_, i) =>
    [
      `${i + 1}`,
      ...Array.from(
        { length: columns },
        () => `${Math.floor(100.0 * Math.random())}`,
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
  const [sheetWorker, setSheetWorker] = useState<SharedWorker>()

  useEffect(() => {
    const myWorker = new SharedWorker(new URL("./worker.js", import.meta.url), {
      name: "spreadsheet-shared-worker",
    })

    myWorker.onerror = (error) => {
      console.error(error)
      debugger
    }
    myWorker.port.addEventListener("message", (event) => {
      console.log("EVENT", event)
    })
    myWorker.port.start()

    setSheetWorker(myWorker)
  }, [])
  const [rowData, setRowData] = useState(initialRowData)

  const [colDefs, setColDefs] = useState(gridColumns)

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {},
    [],
  )

  const handleCellEditRequest = useCallback(
    (event: CellEditRequestEvent) => {
      console.log("edit request", event)
      if (sheetWorker !== undefined) {
        sheetWorker.port.postMessage({
          type: UPDATE,
          row: event.data[0],
          column: event.colDef.headerName,
          newValue: event.newValue,
        })
      }
    },
    [sheetWorker],
  )

  return (
    <div style={gridStyle}>
      <AgGridReact
        readOnlyEdit={true}
        onCellEditRequest={handleCellEditRequest}
        theme={themeBalham}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        onCellValueChanged={handleCellValueChanged}
      />
    </div>
  )
}

const App = () => {
  return <Spreadsheet />
}

export default App
