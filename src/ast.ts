import { TokenType, type token } from "./types.ts";

export interface Node {
  tokenLiteral(): string;
  String(): string;
}

export interface Statement extends Node {
  statement(): void;
}

export interface Expression extends Node {
  expression(): void;
}

export class Program implements Node {
  public statements: Statement[] = [];

  public String(): string {
    let r = "";

    for (const stmt of this.statements) {
      r += stmt.String();
    }

    return r;
  }
  tokenLiteral(): string {
    throw new Error("Method not implemented.");
  }
}

export class LetStatement implements Statement {
  // constructor(public Token: token, public name: Identifier, public val: Expression) {}
  String(): string {
    return `${this.token.literal} ${this.name.String()} = ${
      this.val !== undefined ? this.val.String() : ""
    };`;
  }
  statement() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  public token: token = { type: TokenType.Let, literal: "" };
  public name: Identifier = new Identifier();
  public val: Expression | undefined;
}

export class ReturnStatement implements Statement {
  constructor(public Token: token, public rval: Expression | undefined) {}
  String(): string {
    return `${this.Token.literal} ${
      this.rval !== undefined ? this.rval.String() : ""
    };`;
  }
  statement() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.Token.literal);
  }
}

export class ExpressionStatement implements Statement {
  constructor(public Token: token, public expr: Expression | undefined) {}
  String(): string {
    return `${this.expr !== undefined ? this.expr.String() : ""}`;
  }
  statement() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.Token.literal);
  }
}

export class BlockStatement implements Statement {
  constructor(public token: token, public statements: Statement[]) {}
  statement() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    let str = "";
    this.statements.forEach((e) => {
      str += e.String();
    });
    return str;
  }
}

export class Identifier implements Expression {
  String(): string {
    return this.val;
  }
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  public token: token = { type: TokenType.Ident, literal: "" };
  public val = "";
}

export class StringLiteral implements Expression {
  constructor(public token: token, public val: string) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `"${this.val}"`;
  }
}

export class IntegerLiteral implements Expression {
  constructor(public token: token, public val: number) {}
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return this.tokenLiteral();
  }
}

export class BooleanLiteral implements Expression {
  constructor(public token: token, public val: boolean) {}
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return String(this.token.literal);
  }
}

export class PrefixExpression implements Expression {
  constructor(
    public token: token,
    public operator: string,
    public right: Expression | undefined
  ) {}
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `(${this.operator}${
      this.right != undefined ? this.right.String() : ""
    })`;
  }
}

export class InfixExpression implements Expression {
  constructor(
    public token: token,
    public left: Expression,
    public oper: string,
    public right: Expression | undefined
  ) {}
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `(${this.left.String()} ${this.oper} ${
      this.right != undefined ? this.right.String() : ""
    })`;
  }
}

export class IfExpression implements Expression {
  constructor(
    public token: token,
    public condition: Expression,
    public consequence: BlockStatement,
    public alternative: BlockStatement | undefined
  ) {}
  expression() {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    let str = `if${this.condition.String()} ${this.consequence.String()}`;
    if (this.alternative != undefined) {
      str += `else ${this.alternative.String()}`;
    }
    return str;
  }
}

export class FunctionLiteral implements Expression {
  constructor(
    public token: token,
    public parameters: Identifier[],
    public body: BlockStatement
  ) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    const params: string[] = [];

    this.parameters.forEach((e) => {
      params.push(e.String());
    });

    return `${this.tokenLiteral()} (${params.join(
      ", "
    )}) ${this.body.String()}`;
  }
}

export class CallExpression implements Expression {
  constructor(
    public token: token,
    public func: Expression,
    public args: Expression[]
  ) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `${this.func.String()}(${this.args
      .map((e) => e.String())
      .join(", ")})`;
  }
}

export class ArrayLiteral implements Expression {
  constructor(public token: token, public elements: Expression[]) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `[${this.elements.map((e) => e.String()).join(", ")}]`;
  }
}

export class IndexExpression implements Expression {
  constructor(
    public token: token,
    public left: Expression,
    public index: Expression
  ) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `(${this.left.String()}[${this.index.String()}])`;
  }
}

export class HashLiteral implements Expression {
  constructor(public token: token, public pairs: Map<Expression, Expression>) {}
  expression(): void {
    throw new Error("Method not implemented.");
  }
  tokenLiteral(): string {
    return String(this.token.literal);
  }
  String(): string {
    return `{${Array.from(this.pairs)
      .map((pair) => `${pair[0].String()}: ${pair[1].String()}`)
      .join(", ")}}`;
  }
}
