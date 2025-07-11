import { describe, expect, test } from "@jest/globals"

import { parseExpression } from "./expressions.ts"

describe("parsing expressions", () => {
  test("valid expressions", () => {
    expect(parseExpression("A1 + 10")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "reference",
              "value": "A1",
            },
            "name": "+",
            "right": {
              "type": "literal",
              "value": 10,
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("42 + 10")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "literal",
              "value": 42,
            },
            "name": "+",
            "right": {
              "type": "literal",
              "value": 10,
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("5 / 1 / 3 * 10 + 2 - 1")).toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "left": {
                  "left": {
                    "left": {
                      "type": "literal",
                      "value": 5,
                    },
                    "name": "/",
                    "right": {
                      "type": "literal",
                      "value": 1,
                    },
                    "type": "operator",
                  },
                  "name": "/",
                  "right": {
                    "type": "literal",
                    "value": 3,
                  },
                  "type": "operator",
                },
                "name": "*",
                "right": {
                  "type": "literal",
                  "value": 10,
                },
                "type": "operator",
              },
              "name": "+",
              "right": {
                "type": "literal",
                "value": 2,
              },
              "type": "operator",
            },
            "name": "-",
            "right": {
              "type": "literal",
              "value": 1,
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("A1 + B2")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "reference",
              "value": "A1",
            },
            "name": "+",
            "right": {
              "type": "reference",
              "value": "B2",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("A1 + B2 / C3")).toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "type": "reference",
                "value": "A1",
              },
              "name": "+",
              "right": {
                "type": "reference",
                "value": "B2",
              },
              "type": "operator",
            },
            "name": "/",
            "right": {
              "type": "reference",
              "value": "C3",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("A1 + B2 / C3 / D4 * D4 + A1 / A2"))
      .toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "left": {
                  "left": {
                    "left": {
                      "left": {
                        "type": "reference",
                        "value": "A1",
                      },
                      "name": "+",
                      "right": {
                        "type": "reference",
                        "value": "B2",
                      },
                      "type": "operator",
                    },
                    "name": "/",
                    "right": {
                      "type": "reference",
                      "value": "C3",
                    },
                    "type": "operator",
                  },
                  "name": "/",
                  "right": {
                    "type": "reference",
                    "value": "D4",
                  },
                  "type": "operator",
                },
                "name": "*",
                "right": {
                  "type": "reference",
                  "value": "D4",
                },
                "type": "operator",
              },
              "name": "+",
              "right": {
                "type": "reference",
                "value": "A1",
              },
              "type": "operator",
            },
            "name": "/",
            "right": {
              "type": "reference",
              "value": "A2",
            },
            "type": "operator",
          }
      `)
  })

  test("no unary negative convenience", () => {
    expect(parseExpression("-2")).toMatchInlineSnapshot(`
      {
        "left": {
          "type": "unknown",
          "value": "",
        },
        "name": "-",
        "right": {
          "type": "literal",
          "value": 2,
        },
        "type": "operator",
      }
    `)

    expect(parseExpression("0 - 2")).toMatchInlineSnapshot(`
      {
        "left": {
          "type": "literal",
          "value": 0,
        },
        "name": "-",
        "right": {
          "type": "literal",
          "value": 2,
        },
        "type": "operator",
      }
    `)
  })

  test("incomplete expressions", () => {
    expect(parseExpression("")).toMatchInlineSnapshot(`
          {
            "type": "unknown",
            "value": "",
          }
      `)

    expect(parseExpression("   ")).toMatchInlineSnapshot(`
          {
            "type": "unknown",
            "value": "",
          }
      `)

    expect(parseExpression("  + ")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "unknown",
              "value": "",
            },
            "name": "+",
            "right": {
              "type": "unknown",
              "value": "",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("   + B1")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "unknown",
              "value": "",
            },
            "name": "+",
            "right": {
              "type": "reference",
              "value": "B1",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression(" A1 +  ")).toMatchInlineSnapshot(`
          {
            "left": {
              "type": "reference",
              "value": "A1",
            },
            "name": "+",
            "right": {
              "type": "unknown",
              "value": "",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("  B1 + + C2 ")).toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "type": "reference",
                "value": "B1",
              },
              "name": "+",
              "right": {
                "type": "unknown",
                "value": "",
              },
              "type": "operator",
            },
            "name": "+",
            "right": {
              "type": "reference",
              "value": "C2",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("  B1 + + ")).toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "type": "reference",
                "value": "B1",
              },
              "name": "+",
              "right": {
                "type": "unknown",
                "value": "",
              },
              "type": "operator",
            },
            "name": "+",
            "right": {
              "type": "unknown",
              "value": "",
            },
            "type": "operator",
          }
      `)

    expect(parseExpression("  /B1 + + ")).toMatchInlineSnapshot(`
          {
            "left": {
              "left": {
                "left": {
                  "type": "unknown",
                  "value": "",
                },
                "name": "/",
                "right": {
                  "type": "reference",
                  "value": "B1",
                },
                "type": "operator",
              },
              "name": "+",
              "right": {
                "type": "unknown",
                "value": "",
              },
              "type": "operator",
            },
            "name": "+",
            "right": {
              "type": "unknown",
              "value": "",
            },
            "type": "operator",
          }
      `)
  })
})
