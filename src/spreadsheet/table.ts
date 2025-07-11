import { type ExpressionNode, parseExpression } from "./expressions"

export type Table = {
  width: number
  height: number
  data: Float32Array
}

const absurd = (_val: never) => {
  throw new Error("This should never happen!")
}

/**
 * TODO: detect dependency cycles and reject them
 */
export const parseTableExpressions = (
  tableStringExpressions: Record<string, string>,
) => {
  const expressionTrees = Object.entries(tableStringExpressions).map(
    ([key, expression]) => {
      return [key, parseExpression(expression)] as const
    },
  )

  const extractReferences = (node: ExpressionNode): Array<string> =>
    node.type === "operator"
      ? [...extractReferences(node.left), ...extractReferences(node.right)]
      : node.type === "reference"
        ? [node.value]
        : []

  const relationships = expressionTrees.flatMap(([key, node]) =>
    extractReferences(node).map((ref) => ({ source: ref, target: key })),
  )

  return {
    dependents: Object.fromEntries(
      Object.entries(Object.groupBy(relationships, ({ source }) => source)).map(
        ([key, val]: [key: string, val: Array<{ target: string }>]) =>
          [key, val.map(({ target }) => target)] as const,
      ),
    ),
    dependencies: Object.fromEntries(
      Object.entries(Object.groupBy(relationships, ({ target }) => target)).map(
        ([key, val]: [key: string, val: Array<{ source: string }>]) =>
          [key, val.map(({ source }) => source)] as const,
      ),
    ),
    table: Object.fromEntries(expressionTrees),
  }
}

export type TableExpressions = ReturnType<typeof parseTableExpressions>

export const updatePartialTableExpressions = (
  existingTableExpressions: TableExpressions,
  newTableExpressions: TableExpressions,
): TableExpressions => {
  /**
   * Hairy merging of additional (and removed) dep info - here will be bugs
   */
  const updatedDependents = { ...existingTableExpressions.dependents }
  Object.entries(newTableExpressions.dependencies).forEach(([key, newDeps]) => {
    if (!(key in existingTableExpressions.dependencies)) {
      existingTableExpressions.dependencies[key] = newDeps
    }

    existingTableExpressions.dependencies[key].forEach((oldDep) => {
      // dep has been removed
      if (!newDeps.includes(oldDep)) {
        const updatedDependent = updatedDependents[oldDep]
        updatedDependent.splice(updatedDependent.indexOf(key), 1)
        if (updatedDependent.length === 0) {
          delete updatedDependents[oldDep]
        }
      }
    })

    newDeps.forEach((newDep) => {
      if (!(newDep in updatedDependents)) {
        updatedDependents[newDep] = [key]
      }
      if (!updatedDependents[newDep].includes(key)) {
        updatedDependents[newDep].push(key)
      }
    })
  })
  Object.entries(newTableExpressions.dependents).forEach(([key, newDeps]) => {
    if (!(key in updatedDependents)) {
      updatedDependents[key] = newDeps
    }
  })

  return {
    dependents: updatedDependents,
    dependencies: {
      ...existingTableExpressions.dependencies,
      ...newTableExpressions.dependencies,
    },

    table: {
      ...existingTableExpressions.table,
      ...newTableExpressions.table,
    },
  }
}

const codePointA = "A".charCodeAt(0)

// TODO: support bijective base-26
const columnAlphaToNum = (alpha: string) => alpha.charCodeAt(0) - codePointA

export const keyToColumnRow = (
  key: string,
): [column: number, row: number] | undefined => {
  const { alpha, numeric } =
    key.match(/^(?<alpha>[A-Z]+)(?<numeric>\d+)$/)?.groups ?? {}

  if (alpha !== undefined && numeric !== undefined) {
    const column = columnAlphaToNum(alpha)
    const row = Number(numeric) - 1

    return [column, row]
  }
  return undefined
}
export const keyToIndex = (sheet: Table, key: string) => {
  const columnRow = keyToColumnRow(key)

  if (columnRow !== undefined) {
    const [column, row] = columnRow
    if (
      column >= 0 &&
      column < sheet.width &&
      !Number.isNaN(row) &&
      row >= 0 &&
      row < sheet.height
    ) {
      return row * sheet.width + column
    }
  }

  return -1
}

/**
 * Mutates table with the results of a given key's expression
 */
export const compute = (
  tableExpressions: TableExpressions,
  table: Table,
  key: string,
) => {
  const expression = tableExpressions.table[key]
  const index = keyToIndex(table, key)

  const recur = (expression: ExpressionNode): number => {
    switch (expression.type) {
      case "reference":
        return table.data[keyToIndex(table, expression.value)]
      case "operator": {
        const left = recur(expression.left)
        const right = recur(expression.right)

        switch (expression.name) {
          case "+":
            return left + right
          case "-":
            return left - right
          case "*":
            return left * right
          case "/":
            return left / right
          default:
            return absurd(expression.name)
        }
      }
      case "literal":
        return expression.value
      case "unknown":
        return Number.NaN
    }
  }

  const result = recur(expression)

  table.data[index] = result
  return result
}

/**
 * Mutates table with the the dependent results of a set of keys
 */
export const recursivelyComputeDependents = (
  tableExpressions: TableExpressions,
  table: Table,
  keys: Array<string>,
) => {
  let dependents: Array<string> = keys

  // TODO: assumes no cycles
  while (dependents.length > 0) {
    for (const key of dependents) {
      compute(tableExpressions, table, key)
    }
    dependents = dependents.flatMap(
      (key) => tableExpressions.dependents[key] ?? [],
    )
  }

  return table
}

/**
 * Mutates table with the the dependent results of a set of keys
 * Yield the key and result of each mutation
 */
export function* recursivelyComputeDependentsWithResults(
  tableExpressions: TableExpressions,
  table: Table,
  keys: Array<string>,
) {
  let dependents: Array<string> = keys

  // TODO: assumes no cycles
  while (dependents.length > 0) {
    for (const key of dependents) {
      yield [key, compute(tableExpressions, table, key)] as const
    }
    dependents = dependents.flatMap(
      (key) => tableExpressions.dependents[key] ?? [],
    )
  }
}

export const createTable = (width: number, height: number): Table => ({
  width,
  height,
  data: new Float32Array(width * height),
})

// horrible hack for demo purposes
export const DEMO_WIDTH = 12
export const DEMO_HEIGHT = 20

export const createDemoTable = () => {
  return createTable(DEMO_WIDTH, DEMO_HEIGHT)
}
