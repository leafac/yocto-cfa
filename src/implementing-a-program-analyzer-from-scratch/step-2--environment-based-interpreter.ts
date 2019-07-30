import {
  ArrowFunctionExpression,
  Environment,
  Expression,
  IdentifierName,
  Value
} from "../languages/yocto-javascript";

type Closure = {
  function: ArrowFunctionExpression;
  closureEnvironment: ClosureEnvironment;
};

type ClosureEnvironment = Map<IdentifierName, Closure>;

type State = {
  expression: Expression;
  closureEnvironment: ClosureEnvironment;
};

type Dump = Closure;

export function evaluate(expression: Expression): Value {
  return unload(run(load(expression)));
}

function load(expression: Expression): State {
  return { expression, closureEnvironment: new Map() };
}

function run(state: State): Dump {
  const { expression, closureEnvironment } = state;
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return { function: expression, closureEnvironment };
    case "CallExpression":
      const {
        function: {
          params: [param],
          body
        },
        closureEnvironment: calleeClosureEnvironment
      } = run({ expression: expression.callee, closureEnvironment });
      const argument = run({
        expression: expression.arguments[0],
        closureEnvironment
      });
      return run({
        expression: body,
        closureEnvironment: new Map(calleeClosureEnvironment).set(
          param.name,
          argument
        )
      });
    case "Identifier":
      return closureEnvironment.get(expression.name)!;
  }
}

function unload(dump: Dump): Value {
  return substituteNonlocals(dump);
}

function substituteNonlocals(closure: Closure): ArrowFunctionExpression {
  const { function: function_, closureEnvironment } = closure;
  return traverse(function_, new Set()) as ArrowFunctionExpression;

  function traverse(
    expression: Expression,
    environment: Environment
  ): Expression {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return {
          ...expression,
          body: traverse(
            expression.body,
            new Set(environment).add(expression.params[0].name)
          )
        };
      case "CallExpression":
        return {
          ...expression,
          callee: traverse(expression.callee, environment),
          arguments: [traverse(expression.arguments[0], environment)]
        };
      case "Identifier":
        return environment.has(expression.name)
          ? expression
          : substituteNonlocals(closureEnvironment.get(expression.name)!);
    }
  }
}
