import {
  type Expression,
  ExpressionStatement,
  Identifier,
  LetStatement,
  Program,
  IntegerLiteral,
  ReturnStatement,
  PrefixExpression,
  InfixExpression,
  IfExpression,
  FunctionLiteral,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
  BooleanLiteral,
  Statement,
} from "./ast";
import { lexer } from "./lexer";
import { Parser } from "./parser";
import { TokenType } from "./types";
import {
  checkParserErrors,
  testInfixExpression,
  testLiteral,
} from "./test-helper";

function testLet() {
  const tests = [
    { input: "let x = 5;", expectedIdent: "x", expectedVal: 5 },
    { input: "let y = true;", expectedIdent: "y", expectedVal: true },
    { input: 'let foobar = "y";', expectedIdent: "foobar", expectedVal: "y" },
  ];

  for (const test of tests) {
    const l = new lexer(test.input);
    const p = new Parser(l);
    const program = p.parseProgram();

    if (checkParserErrors(p)) {
      continue;
    }

    if (program.statements.length != 1) {
      console.error(
        `program doesn't contain 1 statement. len(prog)=${program.statements.length}`
      );
      continue;
    }

    if (!(program.statements[0] instanceof LetStatement)) {
      console.error(
        `Expected expression of type LetStatement, got ${
          (program.statements[0] as LetStatement).constructor.name
        } instead.`
      );
      continue;
    }

    const stmt = program.statements[0];
    if (!testLiteral(stmt.name, test.expectedIdent)) {
      continue;
    }
    if (stmt.val == undefined) {
      console.error(`Expected a stmt.val, got undefined instead.`);
      continue;
    }
    !testLiteral(stmt.val, test.expectedVal);
  }
}

function testReturn() {
  const input = `return 5;
  return 10;
  return 993322;`;
  const resultValues = [5, 10, 993322];

  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();

  if (checkParserErrors(p)) {
    return;
  }

  if (prog.statements.length != 3) {
    console.error(`Expecting 3 statements, got ${prog.statements.length}`);
    return;
  }
  prog.statements.forEach((statement, idx) => {
    if (!(statement instanceof ReturnStatement)) {
      console.error(
        `statement is not a ReturnStatement, got ${statement.constructor.name} instead.`
      );
      return;
    }
    if (statement.tokenLiteral() != "return") {
      console.error(
        `statement.tokenLiteral() != \"return\", got ${statement.tokenLiteral()} instead.`
      );
    }
    if (statement.rval == undefined) {
      console.error(`Expected a statement.val, got undefined instead.`);
      return;
    }
    testLiteral(statement.rval, resultValues[idx] as number);
  });
}

function testString() {
  const prog = new Program();
  const letStmt = new LetStatement();
  letStmt.token = { type: TokenType.Let, literal: "let" };
  const ident1 = new Identifier();
  ident1.token = { type: TokenType.Ident, literal: "myVar" };
  ident1.val = "myVar";
  letStmt.name = ident1;
  const ident = new Identifier();
  ident.token = { type: TokenType.Ident, literal: "anotherVar" };
  ident.val = "anotherVar";
  letStmt.val = ident;
  prog.statements = [letStmt];

  if (prog.String() != "let myVar = anotherVar;") {
    console.error(`prog.String() wrong:
    expected: \"let myVar = anotherVar;\"
    got     : \"${prog.String()}\"`);
  }
}

function testIdentifierExpr() {
  const input = "foobar;";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();

  checkParserErrors(p);

  if (prog.statements.length != 1) {
    console.error(
      `program doesn't have 1 statement, got ${prog.statements.length} statements instead.`
    );
  }

  const stmt = prog.statements[0];
  if (!(stmt instanceof ExpressionStatement)) {
    console.error(
      `Statement is not an ExpressionStatement, got a ${
        (prog.statements[0] as Statement).constructor.name
      } instead.`
    );
  }

  const exp: Expression | undefined = (stmt as ExpressionStatement).expr;
  if (!(exp instanceof Identifier)) {
    console.error(`expression is not `);
  }

  const ident: Identifier = exp as Identifier;

  if (ident.val != "foobar") {
    console.error(`ident.val is not \"foobar\", got ${ident.val}`);
  }
  if (ident.tokenLiteral() != "foobar") {
    console.error(
      `ident.tokenLiteral() not\"foobar\", got ${ident.tokenLiteral()}`
    );
  }
}

function testIntegerLiteralExpression() {
  const input = "5;";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();

  checkParserErrors(p);

  if (prog.statements.length != 1) {
    console.error(
      `program doesn't have 1 statement, got ${prog.statements.length} statements instead.`
    );
  }

  const stmt = prog.statements[0];
  if (!(stmt instanceof ExpressionStatement)) {
    console.error(
      `Statement is not an ExpressionStatement, got a ${typeof prog
        .statements[0]} instead.`
    );
  }

  const exp: Expression | undefined = (stmt as ExpressionStatement).expr;
  if (!(exp instanceof IntegerLiteral)) {
    console.error(
      `expression is not an IntegerLiteral, got ${typeof exp} instead.`
    );
  }

  const ident: IntegerLiteral = exp as IntegerLiteral;

  if (ident.val != 5) {
    console.error(`ident.val is not 5, got ${ident.val}`);
  }
  if (ident.tokenLiteral() != "5") {
    console.error(
      `ident.tokenLiteral() not \"5\", got \"${ident.tokenLiteral()}\"`
    );
  }
}

function testParsingPrefixExpressions() {
  const input: { input: string; operator: string; expr: number | boolean }[] = [
    { input: "!5;", operator: "!", expr: 5 },
    { input: "-15", operator: "-", expr: 15 },
    { input: "!true;", operator: "!", expr: true },
    { input: "!false;", operator: "!", expr: false },
  ];

  for (const test of input) {
    const l = new lexer(test.input);
    const p = new Parser(l);
    const prog = p.parseProgram();

    checkParserErrors(p);

    if (prog.statements.length != 1) {
      console.error(
        `len(prog.statements) != 1, got ${prog.statements.length} instead.`
      );
      continue;
    }

    if (!(prog.statements[0] instanceof ExpressionStatement)) {
      console.error(
        `statement is not an ExpressionStatement, got ${
          (prog.statements[0] as Statement).constructor.name
        } instead.`
      );
      continue;
    }

    if (!(prog.statements[0].expr instanceof PrefixExpression)) {
      console.error(
        `statement is not an PrefixExpression, got ${prog.statements[0].constructor.name} instead.`
      );
      continue;
    }

    const exp = prog.statements[0].expr;

    if (exp.operator != test.operator) {
      console.error(
        `exp.operator != \"${test.operator}\", got ${exp.operator} instead.`
      );
    }

    if (exp.right == undefined) {
      console.error("xdddd");
      continue;
    }

    testLiteral(exp.right, test.expr);
  }
}

function testParsingInfixExpressions() {
  const tests: (
    | {
        input: string;
        leftVal: number;
        op: string;
        rightVal: number;
      }
    | {
        input: string;
        leftVal: boolean;
        op: string;
        rightVal: boolean;
      }
  )[] = [
    { input: "5 + 5;", leftVal: 5, op: "+", rightVal: 5 },
    { input: "5 - 5;", leftVal: 5, op: "-", rightVal: 5 },
    { input: "5 * 5;", leftVal: 5, op: "*", rightVal: 5 },
    { input: "5 / 5;", leftVal: 5, op: "/", rightVal: 5 },
    { input: "5 > 5;", leftVal: 5, op: ">", rightVal: 5 },
    { input: "5 < 5;", leftVal: 5, op: "<", rightVal: 5 },
    { input: "5 == 5;", leftVal: 5, op: "==", rightVal: 5 },
    { input: "5 != 5;", leftVal: 5, op: "!=", rightVal: 5 },
    { input: "true == true", leftVal: true, op: "==", rightVal: true },
    { input: "true != false", leftVal: true, op: "!=", rightVal: false },
    { input: "false == false", leftVal: false, op: "==", rightVal: false },
  ];

  tests.forEach((e) => {
    const l = new lexer(e.input);
    const p = new Parser(l);
    const prog = p.parseProgram();

    checkParserErrors(p);

    if (prog.statements.length != 1) {
      console.error(
        `len(prog.statements) != 1, got ${prog.statements.length} instead.`
      );
      return;
    }

    if (!(prog.statements[0] instanceof ExpressionStatement)) {
      console.error(
        `statement is not an ExpressionStatement, got ${
          (prog.statements[0] as Statement).constructor.name
        } instead.`
      );
      return;
    }

    if (!(prog.statements[0].expr instanceof InfixExpression)) {
      console.error(
        `statement is not an InfixExpression, got ${prog.statements[0].constructor.name} instead.`
      );
      return;
    }

    const exp = prog.statements[0].expr;

    if (!testLiteral(exp.left, e.leftVal)) {
      return;
    }

    if (exp.oper != e.op) {
      console.error(`exp.operator != \"${e.op}\", got ${exp.oper} instead.`);
    }

    if (exp.right == undefined) {
      console.error("right is undefined");
      return;
    }

    testLiteral(exp.right, e.rightVal);
  });
}

function testOperatorPrecendenceParsing() {
  const tests: { input: string; expected: string }[] = [
    { input: "-a * b", expected: "((-a) * b)" },
    { input: "!-a", expected: "(!(-a))" },
    { input: "a + b + c", expected: "((a + b) + c)" },
    { input: "a + b - c", expected: "((a + b) - c)" },
    { input: "a * b * c", expected: "((a * b) * c)" },
    { input: "a * b / c", expected: "((a * b) / c)" },
    { input: "a + b / c", expected: "(a + (b / c))" },
    {
      input: "a + b * c + d / e - f",
      expected: "(((a + (b * c)) + (d / e)) - f)",
    },
    { input: "3 + 4; -5 * 5", expected: "(3 + 4)((-5) * 5)" },
    { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
    { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
    {
      input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
      expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
    },
    {
      input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
      expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
    },
    { input: "true", expected: "true" },
    { input: "false", expected: "false" },
    { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
    { input: "3 < 5 == true", expected: "((3 < 5) == true)" },
    { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
    { input: "(5 + 5) * 2", expected: "((5 + 5) * 2)" },
    { input: "2 / (5 + 5)", expected: "(2 / (5 + 5))" },
    { input: "-(5 + 5)", expected: "(-(5 + 5))" },
    { input: "!(true == true)", expected: "(!(true == true))" },
    { input: "a + add(b * c) + d", expected: "((a + add((b * c))) + d)" },
    {
      input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
      expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
    },
    {
      input: "add(a + b + c * d / f + g)",
      expected: "add((((a + b) + ((c * d) / f)) + g))",
    },
    {
      input: "a * [1, 2, 3, 4][b * c] * d",
      expected: "((a * ([1, 2, 3, 4][(b * c)])) * d)",
    },
    {
      input: "add(a * b[2], b[1], 2 * [1, 2][1])",
      expected: "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))",
    },
  ];

  tests.forEach((test) => {
    const l = new lexer(test.input);
    const p = new Parser(l);
    const prog = p.parseProgram();

    checkParserErrors(p);

    if (prog.String() != test.expected) {
      console.error(`${test.input} did not parse correctly`);
      console.error(`\texpected:${test.expected}`);
      console.error(`\treal    :${prog.String()}`);
    }
  });
}

function testIfExpressions() {
  const input = "if (x < y ) { x }";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }

  if (prog.statements.length != 1) {
    console.error(
      `len(program.statements) != 1, got ${prog.statements.length} instead.`
    );
    return;
  }

  if (!(prog.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `prog.statements[0] is not an ExpressionStatement, got ${
        (prog.statements[0] as Statement).constructor.name
      } instead.`
    );
    return;
  }

  const stmt = prog.statements[0];

  if (!(stmt.expr instanceof IfExpression)) {
    console.error(
      `stmt.expr is not of type IfExpression, got ${stmt.constructor.name} instead.`
    );
    return;
  }

  const exp = stmt.expr;

  if (!testInfixExpression(exp.condition, "x", "<", "y")) {
    return;
  }

  if (exp.alternative != undefined) {
    console.error(
      `exp.alt was not nill, got ${JSON.stringify(exp.alternative)} instead.`
    );
    return;
  }
}

function testParsingIfElseExpression() {
  const input = "if (x < y) { x } else { y }";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();

  if (checkParserErrors(p)) {
    return;
  }

  if (prog.statements.length != 1) {
    console.error(
      `len(program.statements) != 1, got ${prog.statements.length} instead.`
    );
    return;
  }

  let stmt = prog.statements[0] as ExpressionStatement;

  if (!(stmt.expr instanceof IfExpression)) {
    console.error(
      `stmt.expr is not of type IfExpression, got ${stmt.constructor.name} instead.`
    );
    return;
  }

  const exp = stmt.expr;

  if (!testInfixExpression(exp.condition, "x", "<", "y")) {
    return;
  }

  if (exp.alternative == undefined) {
    console.error(`exp.alternative is undefined`);
    return;
  }

  if (exp.alternative.statements.length != 1) {
    console.error(
      `alt.statements.len != 1, got ${exp.alternative.statement.length} instead.`
    );
    return;
  }

  if (!(exp.alternative.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `alt.statements[0] is not of type ExpressionStatement, got ${
        (exp.alternative.statements[0] as Statement).constructor.name
      } instead.`
    );
    return;
  }

  stmt = exp.alternative.statements[0];

  if (!(stmt.expr instanceof Identifier)) {
    console.error(
      `alt.expr is not of type Identifier, got ${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      } instead.`
    );
    return;
  }

  if (!testLiteral(stmt.expr, "y")) {
    console.error(
      `alt.expr.literal is not \"y\", got ${stmt.expr.token.literal} instead.`
    );
    return;
  }
}

function testFunctionLiteralParsing() {
  const input = "fn(x, y) { x + y; }";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();

  if (checkParserErrors(p)) {
    return;
  }

  if (prog.statements.length != 1) {
    console.error(
      `len(program.statements) != 1, got ${prog.statements.length} instead.`
    );
    return;
  }

  if (!(prog.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `prog.statements[0] is not ExpressionStatement, got ${
        (prog.statements[0] as Statement).constructor.name
      } instead.`
    );
    return;
  }
  const statement = prog.statements[0];

  if (!(statement.expr instanceof FunctionLiteral)) {
    console.error(
      `prog.statements[0] is not ExpressionStatement, got ${prog.statements[0].constructor.name} instead.`
    );
    return;
  }
  const func = statement.expr;

  if (func.parameters.length != 2) {
    console.error(
      `func.parameters.length != 2, got ${func.parameters.length} instead.`
    );
    return;
  }
  testLiteral(func.parameters[0] as Identifier, "x");
  testLiteral(func.parameters[1] as Identifier, "y");

  if (func.body.statements.length != 1) {
    console.error(
      `func.body.statements.length != 1, got ${func.body.statements.length} instead.`
    );
    return;
  }

  if (!(func.body.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `func.body.statements[0] is not ExpressionStatement, got ${
        (func.body.statements[0] as Statement).constructor.name
      } instead.`
    );
    return;
  }

  const bodyStmt = func.body.statements[0];
  if (bodyStmt.expr == undefined) {
    console.error(`bodyStmt.expr is not Expression, got undefined instead.`);
    return;
  }
  testInfixExpression(bodyStmt.expr, "x", "+", "y");
}

function testFunctionParameterParsing() {
  const tests: { input: string; expected: string[] }[] = [
    { input: "fn(){}", expected: [] },
    { input: "fn(x) {}", expected: ["x"] },
    { input: "fn(x, y, z) {}", expected: ["x", "y", "z"] },
  ];

  for (const test of tests) {
    const l = new lexer(test.input);
    const p = new Parser(l);
    const prog = p.parseProgram();
    if (checkParserErrors(p)) {
      continue;
    }

    if (!(prog.statements[0] instanceof ExpressionStatement)) {
      console.error(
        `Expected ExpressionStatement, got ${
          (prog.statements[0] as Statement).constructor.name
        } instead`
      );
      continue;
    }

    if (!(prog.statements[0].expr instanceof FunctionLiteral)) {
      console.error(
        `Expected FunctionLiteral, got ${
          prog.statements[0].expr == undefined
            ? "undefined"
            : prog.statements[0].expr.constructor.name
        } instead`
      );
      continue;
    }

    // lovely
    prog.statements[0].expr.parameters.forEach((ident, idx) => {
      testLiteral(ident, test.expected[idx] as string);
    });
  }
}

function testCallExpressionParsing() {
  const input = "add(1, 2 * 3, 4 + 5);";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }

  if (prog.statements.length != 1) {
    console.error(
      `prog.statements.len != 1, got ${prog.statements.length} instead.`
    );
    return;
  }

  if (!(prog.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `Expected ExpressionStatement, got ${
        (prog.statements[0] as Statement).constructor.name
      } instead`
    );
    return;
  }

  if (!(prog.statements[0].expr instanceof CallExpression)) {
    console.error(
      `Expected CallExpression, got ${
        prog.statements[0].expr == undefined
          ? "undefined"
          : prog.statements[0].expr.constructor.name
      } instead`
    );
    return;
  }

  const expr = prog.statements[0].expr;

  if (!testLiteral(expr.func, "add")) {
    return;
  }

  if (expr.args.length != 3) {
    console.error(
      `Expected expr.args.length == 3, got ${expr.args.length} instead.`
    );
  }
  testLiteral(expr.args[0] as Expression, 1);
  testInfixExpression(expr.args[1] as Expression, 2, "*", 3);
  testInfixExpression(expr.args[2] as Expression, 4, "+", 5);
}

function testStringLiteralExpression() {
  const input = `"hello world";`;
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();
  checkParserErrors(p);

  const exp = (prog.statements[0] as ExpressionStatement).expr;
  if (exp == undefined) {
    return;
  }
  if (!(exp instanceof StringLiteral)) {
    console.error(`exp not Stringliteral. got=${exp?.constructor.name}`);
    return;
  }

  if (exp.val != "hello world") {
    console.error(`literal.val not "${input}". got=${exp.val}`);
  }
}

function testParsingArrayLiterals() {
  const input = "[1, 2 * 2, 3 + 3]";
  const l = new lexer(input);
  const p = new Parser(l);
  const prog = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }

  const stmt = prog.statements[0] as ExpressionStatement;
  if (stmt instanceof ArrayLiteral) {
    console.error(
      `exp not ast.ArrayLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const array = stmt.expr as ArrayLiteral;
  if (array.elements.length != 3) {
    console.error(`len(array.Elements) not 3. got=${array.elements.length}`);
    return;
  }
  testLiteral(array.elements[0] as Expression, 1);
  testInfixExpression(array.elements[1] as Expression, 2, "*", 2);
  testInfixExpression(array.elements[2] as Expression, 3, "+", 3);
}

function testParsingIndexExpressions() {
  const input = "myArray[1 + 1]";

  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof IndexExpression)) {
    console.error(
      `exp not IndexExpression. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const indexExp = stmt.expr;
  if (!testLiteral(indexExp.left, "myArray")) {
    console.error("xd");
    return;
  }
  if (!testInfixExpression(indexExp.index, 1, "+", 1)) {
    console.error("xd");
  }
}

function testParsingHashLiteralBooleanKeys() {
  const input = `{true: 1, false: 2}`;
  const expected = new Map<boolean, number>([
    [true, 1],
    [false, 2],
  ]);
  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof HashLiteral)) {
    console.error(
      `exp not HashLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const hash = stmt.expr;
  for (const real of hash.pairs) {
    const key = real[0];
    const val = real[1];
    if (!(key instanceof BooleanLiteral)) {
      console.error(
        `key is not BooleanLiteral. got=${
          key == undefined ? "undefined" : key.constructor.name
        }`
      );
      continue;
    }
    const exp = expected.get(key.val);
    if (val == undefined || exp == undefined) {
      console.error(`val is undefined`);
      continue;
    }
    testLiteral(val, exp);
  }
}

function testParsingHashLiteralIntegerKeys() {
  const input = `{1: 1, 2: 2, 3: 3}`;
  const expected = new Map<number, number>([
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof HashLiteral)) {
    console.error(
      `exp not HashLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const hash = stmt.expr;
  for (const real of hash.pairs) {
    const key = real[0];
    const val = real[1];
    if (!(key instanceof IntegerLiteral)) {
      console.error(
        `key is not IntegerLiteral. got=${
          key == undefined ? "undefined" : key.constructor.name
        }`
      );
      continue;
    }
    const exp = expected.get(key.val);
    if (val == undefined || exp == undefined) {
      console.error(`val is undefined`);
      continue;
    }
    testLiteral(val, exp);
  }
}

function testParsingHashLiteralStringKeys() {
  const input = `{"one": 1, "two": 2, "three": 3}`;
  const expected = new Map<string, number>([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);
  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof HashLiteral)) {
    console.error(
      `exp not HashLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const hash = stmt.expr;
  for (const real of hash.pairs) {
    const key = real[0];
    const val = real[1];
    if (!(key instanceof StringLiteral)) {
      console.error(
        `key is not StringLiteral. got=${
          key == undefined ? "undefined" : key.constructor.name
        }`
      );
      continue;
    }
    const exp = expected.get(key.val);
    if (val == undefined || exp == undefined) {
      console.error(`val is undefined`);
      continue;
    }
    testLiteral(val, exp);
  }
}

function testParsingEmptyHashLiteral() {
  const input = `{}`;
  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof HashLiteral)) {
    console.error(
      `exp not HashLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const hash = stmt.expr;
  if (hash.pairs.size != 0) {
    console.error(`Pairs has wrong size. got=${hash.pairs.size}`);
  }
}

function testParsingHashLiteralsWithExpressions() {
  const input = `{"one": 0 + 1, "two": 10 - 8, "three": 15 / 5}`;
  const expected = new Map<string, (e: Expression) => boolean>([
    ["one", (e: Expression) => testInfixExpression(e, 0, "+", 1)],
    ["two", (e: Expression) => testInfixExpression(e, 10, "-", 8)],
    ["three", (e: Expression) => testInfixExpression(e, 15, "/", 5)],
  ]);
  const l = new lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  if (checkParserErrors(p)) {
    return;
  }
  if (!(program.statements[0] instanceof ExpressionStatement)) {
    console.error(
      `exp not ExpressionStatement. got=${
        (program.statements[0] as Statement).constructor.name
      }`
    );
    return;
  }
  const stmt = program.statements[0];
  if (!(stmt.expr instanceof HashLiteral)) {
    console.error(
      `exp not HashLiteral. got=${
        stmt.expr == undefined ? "undefined" : stmt.expr.constructor.name
      }`
    );
    return;
  }
  const hash = stmt.expr;
  if (hash.pairs.size != 3) {
    console.error(`Pairs has wrong size. got=${hash.pairs.size}`);
  }
  for (const [key, value] of hash.pairs) {
    if (!(key instanceof StringLiteral)) {
      console.error(`key is not StringLiteral. got=${key.constructor.name}`);
      continue;
    }
    const tf = expected.get(key.val);
    if (tf == undefined) {
      console.error("amogus");
      continue;
    }
    tf(value);
  }
}

testLet();
testReturn();
testString();
testIdentifierExpr();
testIntegerLiteralExpression();
testParsingPrefixExpressions();
testParsingInfixExpressions();
testOperatorPrecendenceParsing();
testIfExpressions();
testParsingIfElseExpression();
testFunctionLiteralParsing();
testFunctionParameterParsing();
testCallExpressionParsing();
testStringLiteralExpression();
testParsingArrayLiterals();
testParsingIndexExpressions();
testParsingHashLiteralIntegerKeys();
testParsingHashLiteralBooleanKeys();
testParsingHashLiteralStringKeys();
testParsingEmptyHashLiteral();
testParsingHashLiteralsWithExpressions();
