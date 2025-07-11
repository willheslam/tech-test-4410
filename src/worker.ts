import {
  createDemoTable,
  DEMO_HEIGHT,
  DEMO_WIDTH,
  keyToColumnRow,
  parseTableExpressions,
  recursivelyComputeDependentsWithResults,
  updatePartialTableExpressions,
  type TableExpressions,
} from "./spreadsheet/table"

import {
  INPUT_EXPRESSION_UPDATES,
  PUBLISH_EXPRESSION_UPDATES,
} from "./protocol"

const gridRowData = Array.from(
  { length: DEMO_HEIGHT },
  (_, i) =>
    [`${i + 1}`, ...Array.from({ length: DEMO_WIDTH }, () => ``)] as const,
)

const table = createDemoTable()

let rawExpressions: Record<string, string> = {}
let tableExpressions: TableExpressions = parseTableExpressions({})

const connectedClients: Array<MessagePort> = []
self.onconnect = (e) => {
  const port: MessagePort = e.ports[0]
  connectedClients.push(port)

  // initial sync
  port.postMessage({
    type: PUBLISH_EXPRESSION_UPDATES,
    parsedExpressions: tableExpressions.table,
    rawExpressions,
    rowData: gridRowData,
  })

  port.addEventListener("message", (event) => {
    if (event.data.type === INPUT_EXPRESSION_UPDATES) {
      console.log("UPDATE EVENT", event.data)

      const newExpressions = event.data.expressions
      const newParsedTableExpressions = parseTableExpressions(newExpressions)
      rawExpressions = { ...rawExpressions, ...newExpressions }

      tableExpressions = updatePartialTableExpressions(
        tableExpressions,
        newParsedTableExpressions,
      )

      // this is not beautiful but it gets the job done
      // update react grid-compatible data format
      for (const [key, result] of recursivelyComputeDependentsWithResults(
        tableExpressions,
        table,
        Object.keys(newExpressions),
      )) {
        const columnRow = keyToColumnRow(key)
        if (columnRow !== undefined) {
          const [column, row] = columnRow
          gridRowData[row][column + 1] = `${result}`
        }
      }

      const message = {
        type: PUBLISH_EXPRESSION_UPDATES,
        parsedExpressions: tableExpressions.table,
        rawExpressions,
        rowData: gridRowData,
      }

      connectedClients.forEach((client) => {
        // TODO: how to know when a client has disconnected?
        // reimplementing acks etc?

        try {
          client.postMessage(message)
        } catch (error) {
          // assume an error here means client disconnected
          console.error("Posting update error:", error)
          connectedClients.splice(connectedClients.indexOf(client), 1)
        }
      })
    }
  })

  port.start()
}
