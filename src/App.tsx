import "./App.css"

import { useState } from "react"

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"

import { themeBalham } from "ag-grid-community"

ModuleRegistry.registerModules([AllCommunityModule])

// Create new GridExample component
const GridExample = () => {
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ])

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "make" },
    { field: "model" },
    { field: "price" },
    { field: "electric" },
  ])

  const defaultColDef = {
    flex: 1,
  }

  // TODO: all the quick start examples use a height of 100%
  // which shows nothing by default so set it to 100vh for now
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <AgGridReact
        theme={themeBalham}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
      />
    </div>
  )
}

const App = () => {
  return (
    <GridExample />
  )
}

export default App
