import { YJS } from "./yocto-javascript";

test("ArrowFunctionExpression", () => {
  expect(YJS`x => x`).toMatchInlineSnapshot(`
    ArrowFunctionExpression {
      "async": false,
      "body": Identifier {
        "name": "x",
        "type": "Identifier",
      },
      "expression": true,
      "generator": false,
      "id": null,
      "params": Array [
        Identifier {
          "name": "x",
          "type": "Identifier",
        },
      ],
      "type": "ArrowFunctionExpression",
    }
  `);
});
