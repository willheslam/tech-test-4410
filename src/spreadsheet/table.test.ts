import { describe, expect, test } from "@jest/globals"

import {
  createTable,
  parseTableExpressions,
  recursivelyComputeDependents,
  updatePartialTableExpressions,
} from "./table.ts"

describe("parsing sheet expressions", () => {
  test("example", () => {
    expect(
      parseTableExpressions({
        A10: "42",
        B100: "A10 + 1",
        C5: "A10 / B100 * 3",
      }),
    ).toMatchInlineSnapshot(`
    {
      "dependencies": {
        "B100": [
          "A10",
        ],
        "C5": [
          "A10",
          "B100",
        ],
      },
      "dependents": {
        "A10": [
          "B100",
          "C5",
        ],
        "B100": [
          "C5",
        ],
      },
      "table": {
        "A10": {
          "type": "literal",
          "value": 42,
        },
        "B100": {
          "left": {
            "type": "reference",
            "value": "A10",
          },
          "name": "+",
          "right": {
            "type": "literal",
            "value": 1,
          },
          "type": "operator",
        },
        "C5": {
          "left": {
            "left": {
              "type": "reference",
              "value": "A10",
            },
            "name": "/",
            "right": {
              "type": "reference",
              "value": "B100",
            },
            "type": "operator",
          },
          "name": "*",
          "right": {
            "type": "literal",
            "value": 3,
          },
          "type": "operator",
        },
      },
    }
  `)
  })
})

describe("updates", () => {
  test("recursivelyComputeDependents", () => {
    const tableExpressions = parseTableExpressions({
      A1: "42",
      B2: "5",
      B4: "A1 + 1",
      A3: "A1 / B4 * 3 - B2",
    })

    const table = createTable(5, 5)

    expect(recursivelyComputeDependents(tableExpressions, table, ["A1", "B2"]))
      .toMatchInlineSnapshot(`
      {
        "data": Float32Array [
          42,
          0,
          0,
          0,
          0,
          0,
          5,
          0,
          0,
          0,
          -2.069767475128174,
          0,
          0,
          0,
          0,
          0,
          43,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ],
        "height": 5,
        "width": 5,
      }
    `)
  })

  test("updatePartialTableExpressions", () => {
    const a = parseTableExpressions({
      A1: "42",
      B1: "1",
      A2: "A1 + B1",
      C1: "B1 / 2",
    })

    expect(a).toMatchInlineSnapshot(`
    {
      "dependencies": {
        "A2": [
          "A1",
          "B1",
        ],
        "C1": [
          "B1",
        ],
      },
      "dependents": {
        "A1": [
          "A2",
        ],
        "B1": [
          "A2",
          "C1",
        ],
      },
      "table": {
        "A1": {
          "type": "literal",
          "value": 42,
        },
        "A2": {
          "left": {
            "type": "reference",
            "value": "A1",
          },
          "name": "+",
          "right": {
            "type": "reference",
            "value": "B1",
          },
          "type": "operator",
        },
        "B1": {
          "type": "literal",
          "value": 1,
        },
        "C1": {
          "left": {
            "type": "reference",
            "value": "B1",
          },
          "name": "/",
          "right": {
            "type": "literal",
            "value": 2,
          },
          "type": "operator",
        },
      },
    }
  `)

    const b = parseTableExpressions({ A2: "B1 + 5" })

    expect(b).toMatchInlineSnapshot(`
    {
      "dependencies": {
        "A2": [
          "B1",
        ],
      },
      "dependents": {
        "B1": [
          "A2",
        ],
      },
      "table": {
        "A2": {
          "left": {
            "type": "reference",
            "value": "B1",
          },
          "name": "+",
          "right": {
            "type": "literal",
            "value": 5,
          },
          "type": "operator",
        },
      },
    }
  `)

    const c = updatePartialTableExpressions(a, b)

    expect(c).toMatchInlineSnapshot(`
    {
      "dependencies": {
        "A2": [
          "B1",
        ],
        "C1": [
          "B1",
        ],
      },
      "dependents": {
        "B1": [
          "A2",
          "C1",
        ],
      },
      "table": {
        "A1": {
          "type": "literal",
          "value": 42,
        },
        "A2": {
          "left": {
            "type": "reference",
            "value": "B1",
          },
          "name": "+",
          "right": {
            "type": "literal",
            "value": 5,
          },
          "type": "operator",
        },
        "B1": {
          "type": "literal",
          "value": 1,
        },
        "C1": {
          "left": {
            "type": "reference",
            "value": "B1",
          },
          "name": "/",
          "right": {
            "type": "literal",
            "value": 2,
          },
          "type": "operator",
        },
      },
    }
  `)
  })

  test("handle expression and literal updates", () => {
    const original = parseTableExpressions({
      A1: "42",
      A2: "A1 + 1",
    })
    const table = createTable(3, 3)

    recursivelyComputeDependents(original, table, ["A1"])

    expect(table).toMatchInlineSnapshot(`
    {
      "data": Float32Array [
        42,
        0,
        0,
        43,
        0,
        0,
        0,
        0,
        0,
      ],
      "height": 3,
      "width": 3,
    }
  `)

    const update = parseTableExpressions({
      A1: "50",
      A3: "10",
      A2: "A1 + A3",
      A4: "A1 + 100",
    })

    const latest = updatePartialTableExpressions(original, update)

    expect(latest).toMatchInlineSnapshot(`
    {
      "dependencies": {
        "A2": [
          "A1",
          "A3",
        ],
        "A4": [
          "A1",
        ],
      },
      "dependents": {
        "A1": [
          "A2",
          "A4",
        ],
        "A3": [
          "A2",
        ],
      },
      "table": {
        "A1": {
          "type": "literal",
          "value": 50,
        },
        "A2": {
          "left": {
            "type": "reference",
            "value": "A1",
          },
          "name": "+",
          "right": {
            "type": "reference",
            "value": "A3",
          },
          "type": "operator",
        },
        "A3": {
          "type": "literal",
          "value": 10,
        },
        "A4": {
          "left": {
            "type": "reference",
            "value": "A1",
          },
          "name": "+",
          "right": {
            "type": "literal",
            "value": 100,
          },
          "type": "operator",
        },
      },
    }
  `)

    recursivelyComputeDependents(latest, table, ["A1", "A3"])

    expect(table).toMatchInlineSnapshot(`
    {
      "data": Float32Array [
        50,
        0,
        0,
        60,
        0,
        0,
        10,
        0,
        0,
      ],
      "height": 3,
      "width": 3,
    }
  `)
  })
})
