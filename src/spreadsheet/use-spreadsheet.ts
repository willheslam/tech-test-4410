import { useCallback, useEffect, useState } from "react"

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community"

import {
  INPUT_EXPRESSION_UPDATES,
  PUBLISH_EXPRESSION_UPDATES,
} from "../protocol"
import type { ExpressionNode } from "./expressions"
import { DEMO_HEIGHT, DEMO_WIDTH } from "./table"

ModuleRegistry.registerModules([AllCommunityModule])

const initialRowData = Array.from(
  { length: DEMO_HEIGHT },
  (_, i) =>
    [`${i + 1}`, ...Array.from({ length: DEMO_WIDTH }, () => ``)] as const,
)

export type RowData = typeof initialRowData

export const useSpreadsheet = () => {
  const [rowData, setRowData] = useState(initialRowData)

  const [rawExpressions, setRawExpressions] = useState(
    {} as Record<string, string>,
  )
  const [parsedSheetExpressions, setParsedExpressions] = useState(
    {} as Record<string, ExpressionNode>,
  )

  const [sheetWorker, setSheetWorker] = useState<SharedWorker>()

  useEffect(() => {
    const myWorker = new SharedWorker(
      new URL("../worker.js", import.meta.url),
      {
        name: "spreadsheet-shared-worker",
      },
    )

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
