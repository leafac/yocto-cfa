import { YJS } from "./yocto-javascript";

test("ArrowFunctionExpression", () => {
  expect(YJS`x => x`).toMatchInlineSnapshot(`
    Object {
      "body": Object {
        "name": "x",
        "type": "Identifier",
      },
      "params": Array [
        Object {
          "name": "x",
          "type": "Identifier",
        },
      ],
      "type": "ArrowFunctionExpression",
    }
  `);
});

test("CallExpression", () => {
  expect(YJS`(x => x)(y => y)`).toMatchInlineSnapshot(`
    Object {
      "arguments": Array [
        Object {
          "body": Object {
            "name": "y",
            "type": "Identifier",
          },
          "params": Array [
            Object {
              "name": "y",
              "type": "Identifier",
            },
          ],
          "type": "ArrowFunctionExpression",
        },
      ],
      "callee": Object {
        "body": Object {
          "name": "x",
          "type": "Identifier",
        },
        "params": Array [
          Object {
            "name": "x",
            "type": "Identifier",
          },
        ],
        "type": "ArrowFunctionExpression",
      },
      "type": "CallExpression",
    }
  `);
});

test.each([[() => YJS``], [() => YJS`(x => x); (x => x)`]])(
  "A Program must include exactly one Statement",
  program => {
    expect(program).toThrow(
      new SyntaxError("A Program must include exactly one Statement")
    );
  }
);

test("The Statement in a Program must be an ExpressionStatement", () => {
  expect(() => YJS`const x = (y => y)`).toThrow(
    new SyntaxError("Unrecognized node of type VariableDeclaration")
  );
});

test.each([[() => YJS`() => x`], [() => YJS`(x, y) => x`]])(
  "An ArrowFunctionExpression must include exactly one param",
  program => {
    expect(program).toThrow(
      new SyntaxError(
        "An ArrowFunctionExpression must include exactly one param"
      )
    );
  }
);

test("The param in an ArrowFunctionExpression must be an Identifier", () => {
  expect(() => YJS`({x}) => x`).toThrow(
    new SyntaxError(
      "The param in an ArrowFunctionExpression must be an Identifier"
    )
  );
});

test.each([[() => YJS`f => f()`], [() => YJS`f => f(f, f)`]])(
  "A CallExpression must include exactly one argument",
  program => {
    expect(program).toThrow(
      new SyntaxError("A CallExpression must include exactly one argument")
    );
  }
);

test.each([
  [() => YJS`y`],
  [() => YJS`x => y`],
  [() => YJS`f => f(y)`],
  [() => YJS`(y => y)(y)`]
])("Identifiers must be in scope", program => {
  expect(program).toThrow(new SyntaxError("Identifier y not in scope"));
});

test("Programs may be generated programmatically with interpolation", () => {
  expect(YJS`${"x"} => x`).toMatchInlineSnapshot(`
    Object {
      "body": Object {
        "name": "x",
        "type": "Identifier",
      },
      "params": Array [
        Object {
          "name": "x",
          "type": "Identifier",
        },
      ],
      "type": "ArrowFunctionExpression",
    }
  `);
});

test("Parsing errors are reported to the programmer", () => {
  expect(() => YJS`x =>`).toThrow(new Error("Line 1: Unexpected end of input"));
});
