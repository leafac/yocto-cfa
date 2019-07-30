import {
  ArrowFunctionExpression,
  Expression,
  IdentifierName,
  Scope,
  Value
} from "../languages/yocto-javascript";

// TODO: Only include the non-locals in the closure?

type Closure = {
  function: ArrowFunctionExpression;
  environment: Environment;
};

type Environment = Map<IdentifierName, Closure>;

type State = {
  expression: Expression;
  environment: Environment;
};

type Dump = Closure;

export function evaluate(expression: Expression): Value {
  return unload(run(load(expression)));
}

function load(expression: Expression): State {
  return { expression, environment: new Map() };
}

function run(state: State): Dump {
  const { expression, environment } = state;
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return { function: expression, environment };
    case "CallExpression":
      const {
        function: {
          params: [param],
          body
        },
        environment: functionEnvironment
      } = run({ expression: expression.callee, environment });
      const argument = run({
        expression: expression.arguments[0],
        environment
      });
      return run({
        expression: body,
        environment: new Map(functionEnvironment).set(param.name, argument)
      });
    case "Identifier":
      if (!environment.has(expression.name)) {
        throw new EvalError(
          `Identifier ${expression.name} not in scope (this should never happen because the scope is checked when constructing the program)`
        );
      }
      return environment.get(expression.name)!;
  }
}

function unload(dump: Dump): Value {
  const { function: function_, environment } = dump;
  return substituteNonlocals(function_, environment, new Set());

  function substituteNonlocals<T extends Expression>(
    expression: T,
    environment: Environment,
    scope: Scope
  ): T;
  function substituteNonlocals(
    expression: Expression,
    environment: Environment,
    scope: Scope
  ): Expression {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return {
          ...expression,
          body: substituteNonlocals(
            expression.body,
            environment,
            new Set(scope).add(expression.params[0].name)
          )
        };
      case "CallExpression":
        return {
          ...expression,
          callee: substituteNonlocals(expression.callee, environment, scope),
          arguments: [
            substituteNonlocals(expression.arguments[0], environment, scope)
          ]
        };
      case "Identifier":
        if (scope.has(expression.name)) {
          return expression;
        } else if (!environment.has(expression.name)) {
          throw new EvalError(
            `Identifier ${expression.name} not in Environment (this should never happen in a Dump resulting from run)`
          );
        } else {
          return unload(environment.get(expression.name)!);
        }
    }
  }
}
