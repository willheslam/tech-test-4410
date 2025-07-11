type Operation = "+" | "-" | "*" | "/"
type OperatorNode = {
  type: "operator"
  name: Operation
  left: ExpressionNode
  right: ExpressionNode
}

export type ExpressionNode =
  | OperatorNode
  | { type: "reference"; value: string }
  | { type: "literal"; value: number }
  | { type: "unknown"; value: string }

const createValue = (expr: string): ExpressionNode =>
  expr.match(/^[A-Z]+\d+$/)
    ? { type: "reference", value: expr }
    : expr.length > 0 && !isNaN(Number(expr))
      ? { type: "literal", value: Number(expr) }
      : { type: "unknown", value: expr }

const createOperator = (
  expr: Operation,
  left: ExpressionNode,
  right: ExpressionNode,
): ExpressionNode => ({
  type: "operator",
  name: expr,
  left,
  right,
})

/**
 * Parse expression into right associative binary operator tree
 */
export const parseExpression = (expression: string) => {
  const matches = [...expression.matchAll(/(\+|-|\*|\/|$)/g)].map(
    ({ index }) => index,
  )

  return matches.reduce(
    (stack, index, i) =>
      i === 0
        ? [...stack, createValue(expression.slice(0, index).trim())]
        : [
            ...stack.slice(0, -1),
            createOperator(
              expression[matches[i - 1]] as Operation, // assumes regex above is correct
              stack.at(-1)!,
              createValue(expression.slice(matches[i - 1] + 1, index).trim()),
            ),
          ],
    [] as Array<ExpressionNode>,
  )[0]
}
