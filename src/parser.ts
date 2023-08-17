import {
  Identifier,
  LetStatement,
  Program,
  ReturnStatement,
  type Statement,
  ExpressionStatement,
  type Expression,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  BooleanLiteral,
  IfExpression,
  BlockStatement,
  FunctionLiteral,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
} from "./ast";
import { type lexer } from "./lexer";
import { precedences } from "./maps";
import {
  TokenType,
  type infixParseFn,
  operationOrder,
  type prefixParseFn,
  type token,
} from "./types";

export class Parser {
  private lexer: lexer;
  public errors: string[] = [];
  private curToken: token;
  private peekToken: token;
  /* 
  these functions are required to be wrapped
  this is because if not, they are instantiated before
  "this" is defined and they hold on to "undefined"
  as the value for "this" 
  */
  private prefixParseFns: Map<TokenType, prefixParseFn> = new Map([
    [
      TokenType.Ident,
      () => {
        const ident = new Identifier();
        ident.token = this.curToken;
        ident.val = String(this.curToken.literal);
        return ident as Expression;
      },
    ],
    [
      TokenType.Int,
      () => {
        return new IntegerLiteral(
          this.curToken,
          typeof this.curToken.literal === "number"
            ? this.curToken.literal
            : this.curToken.literal.includes(".")
            ? parseFloat(this.curToken.literal)
            : parseInt(this.curToken.literal)
        ) as Expression;
      },
    ],
    [
      TokenType.String,
      () => {
        return new StringLiteral(this.curToken, String(this.curToken.literal));
      },
    ],
    [
      TokenType.Minus,
      () => {
        return this.parsePrefixExpression();
      },
    ],
    [
      TokenType.Bang,
      () => {
        return this.parsePrefixExpression();
      },
    ],
    [
      TokenType.True,
      () => {
        return this.parseBoolean();
      },
    ],
    [
      TokenType.False,
      () => {
        return this.parseBoolean();
      },
    ],
    [
      TokenType.LeftRoundBrace,
      () => {
        return this.parseGroupedExpression();
      },
    ],
    [
      TokenType.If,
      () => {
        return this.parseIfExpression();
      },
    ],
    [
      TokenType.Function,
      () => {
        return this.parseFunctionLiteral();
      },
    ],
    [
      TokenType.LeftSquareBrace,
      () => {
        return this.parseArrayLiteral();
      },
    ],
    [
      TokenType.LeftSquirlyBrace,
      () => {
        return this.parseHashLiteral();
      },
    ],
  ]);
  private infixParseFns: Map<TokenType, infixParseFn> = new Map([
    [
      TokenType.Plus,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.Minus,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.Slash,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.Asterisk,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.Equal,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.NotEqual,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.LessThan,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.GreaterThan,
      (expr: Expression) => {
        return this.parseInfixExpression(expr);
      },
    ],
    [
      TokenType.LeftRoundBrace,
      (expr: Expression) => {
        return this.parseCallExpression(expr);
      },
    ],
    [
      TokenType.LeftSquareBrace,
      (expr: Expression) => {
        return this.parseIndexExpression(expr);
      },
    ],
  ]);

  constructor(l: lexer) {
    this.lexer = l;
    this.curToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();
  }

  private nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  public parseProgram(): Program {
    const program = new Program();

    while (this.curToken.type != TokenType.EOF) {
      const statement = this.parseStatement();
      if (statement != undefined) {
        program.statements.push(statement);
      }
      this.nextToken();
    }

    return program;
  }

  private parseStatement(): Statement | undefined {
    switch (this.curToken.type) {
      case TokenType.Let:
        return this.parseLetStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseLetStatement(): Statement | undefined {
    const statement = new LetStatement();
    statement.token = this.curToken;
    if (!this.expectPeek(TokenType.Ident)) {
      return undefined;
    }
    statement.name.token = this.curToken;
    statement.name.val = String(this.curToken.literal);

    if (!this.expectPeek(TokenType.Assign)) {
      return undefined;
    }
    this.nextToken();
    statement.val = this.parseExpression(operationOrder.LOWEST);
    while (!this.curTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }

    return statement;
  }

  private parseReturnStatement(): Statement | undefined {
    const statement = new ReturnStatement(this.curToken, undefined);

    this.nextToken();

    statement.rval = this.parseExpression(operationOrder.LOWEST);

    while (!this.curTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }

    return statement;
  }

  private parseExpressionStatement(): ExpressionStatement | undefined {
    const stmt = new ExpressionStatement(
      this.curToken,
      this.parseExpression(operationOrder.LOWEST)
    );

    if (this.peekTokenIs(TokenType.Semicolon)) {
      this.nextToken();
    }

    return stmt;
  }

  private parseExpression(order: operationOrder): Expression | undefined {
    if (!this.prefixParseFns.has(this.curToken.type)) {
      this.errors.push(
        `no prefix parse function found for ${String(this.curToken.literal)}`
      );
      return undefined;
    }
    let leftExpr = (
      this.prefixParseFns.get(this.curToken.type) as prefixParseFn
    )();

    while (
      !this.peekTokenIs(TokenType.Semicolon) &&
      order.valueOf() < this.peekPrecedence().valueOf()
    ) {
      const infix = this.infixParseFns.get(this.peekToken.type);

      if (infix == undefined) {
        return leftExpr;
      }

      this.nextToken();
      leftExpr = infix(leftExpr);
    }
    return leftExpr;
  }

  private parsePrefixExpression(): Expression {
    const lastToken = this.curToken;
    this.nextToken();
    const expr = new PrefixExpression(
      lastToken,
      String(lastToken.literal),
      this.parseExpression(operationOrder.PREFIX)
    );
    return expr;
  }

  private parseInfixExpression(expr: Expression): Expression {
    const cur = this.curToken;
    const precedence = this.curPrecendece();
    this.nextToken();
    return new InfixExpression(
      cur,
      expr,
      String(cur.literal),
      this.parseExpression(precedence)
    );
  }

  private parseIfExpression(): Expression {
    const cur = this.curToken;
    if (!this.expectPeek(TokenType.LeftRoundBrace)) {
      this.errors.push(`Expected \"(\", got ${String(this.peekToken.literal)}`);
      return new Identifier();
    }
    this.nextToken();
    const cond = this.parseExpression(operationOrder.LOWEST);
    if (cond == undefined) {
      this.errors.push(`Expected expression, got undefined`);
      return new Identifier();
    }
    if (!this.expectPeek(TokenType.RightRoundBrace)) {
      this.errors.push(`Expected \")\", got ${String(this.peekToken.literal)}`);
      return new Identifier();
    }
    if (!this.expectPeek(TokenType.LeftSquirlyBrace)) {
      this.errors.push(`Expected \"{\", got ${String(this.peekToken.literal)}`);
      return new Identifier();
    }
    const consequence = this.parseBlockStatement();
    if (this.peekTokenIs(TokenType.Else)) {
      this.nextToken();
      if (!this.expectPeek(TokenType.LeftSquirlyBrace)) {
        this.errors.push(`Expected "{", got ${String(this.peekToken.literal)}`);
        return new IfExpression(cur, cond, consequence, undefined);
      }
      const alternative = this.parseBlockStatement();
      return new IfExpression(cur, cond, consequence, alternative);
    }
    return new IfExpression(cur, cond, consequence, undefined);
  }

  private parseFunctionLiteral(): Expression {
    const cur = this.curToken;
    if (!this.expectPeek(TokenType.LeftRoundBrace)) {
      this.errors.push(
        `Expecting "(", got ${String(this.peekToken.literal)} instead`
      );
      return new Identifier();
    }
    const params: Identifier[] = this.parseFunctionParameters();
    if (!this.expectPeek(TokenType.LeftSquirlyBrace)) {
      this.errors.push(
        `Expecting "{", got ${String(this.peekToken.literal)} instead`
      );
      return new Identifier();
    }
    const literal: BlockStatement = this.parseBlockStatement();
    return new FunctionLiteral(cur, params, literal);
  }

  private parseBlockStatement(): BlockStatement {
    const block = new BlockStatement(this.curToken, []);
    this.nextToken();
    while (
      !this.curTokenIs(TokenType.RightSquirlyBrace) &&
      !this.curTokenIs(TokenType.EOF)
    ) {
      const stmt = this.parseStatement();
      if (stmt != undefined) {
        block.statements.push(stmt);
      }
      this.nextToken();
    }
    return block;
  }

  private parseFunctionParameters(): Identifier[] {
    const idents: Identifier[] = [];

    if (this.peekTokenIs(TokenType.RightRoundBrace)) {
      this.nextToken();
      return idents;
    }
    this.nextToken();
    let ident = new Identifier();
    ident.token = this.curToken;
    ident.val = String(this.curToken.literal);
    idents.push(ident);

    while (this.peekTokenIs(TokenType.Comma)) {
      this.nextToken(); // go to comma
      this.nextToken(); // move to ident
      ident = new Identifier();
      ident.token = this.curToken;
      ident.val = String(this.curToken.literal);
      idents.push(ident);
    }

    if (!this.expectPeek(TokenType.RightRoundBrace)) {
      this.errors.push(
        `Expected ")", got ${String(this.curToken.literal)} instead`
      );
      return [];
    }
    return idents;
  }

  private parseGroupedExpression(): Expression {
    this.nextToken();

    const exp = this.parseExpression(operationOrder.LOWEST);

    if (!this.expectPeek(TokenType.RightRoundBrace) || exp == undefined) {
      this.errors.push(
        `Exprected \")\", got ${String(this.peekToken.literal)}`
      );
      return new Identifier();
    }

    return exp;
  }

  private parseCallExpression(expr: Expression): Expression {
    return new CallExpression(
      this.curToken,
      expr,
      this.parseExpressionList(TokenType.RightRoundBrace)
    );
  }

  private parseExpressionList(end: TokenType): Expression[] {
    const args: Expression[] = [];
    if (this.peekTokenIs(end)) {
      this.nextToken();
      return args;
    }
    this.nextToken();
    const arg = this.parseExpression(operationOrder.LOWEST);
    if (arg != undefined) {
      args.push(arg);
    }

    while (this.peekTokenIs(TokenType.Comma)) {
      this.nextToken();
      this.nextToken();
      const arg = this.parseExpression(operationOrder.LOWEST);
      if (arg != undefined) {
        args.push(arg);
      }
    }

    if (!this.expectPeek(end)) {
      return [];
    }
    return args;
  }

  private parseArrayLiteral(): Expression {
    const cur = this.curToken;
    const el = this.parseExpressionList(TokenType.RightSquareBrace);
    return new ArrayLiteral(cur, el);
  }

  private parseIndexExpression(expr: Expression): Expression {
    const cur = this.curToken;
    const left = expr;
    this.nextToken();
    const index = this.parseExpression(operationOrder.LOWEST);
    if (!this.expectPeek(TokenType.RightSquareBrace) || index == undefined) {
      console.log("fuck");
      return new Identifier();
    }
    return new IndexExpression(cur, left, index);
  }

  private parseHashLiteral(): Expression {
    const cur = this.curToken;
    const pairs = new Map<Expression, Expression>();
    while (!this.peekTokenIs(TokenType.RightSquirlyBrace)) {
      this.nextToken();
      const key = this.parseExpression(operationOrder.LOWEST);
      if (!this.expectPeek(TokenType.Colon) || key == undefined) {
        console.log("uwu");
        return new Identifier();
      }
      this.nextToken();
      const val = this.parseExpression(operationOrder.LOWEST);
      if (val == undefined) {
        console.log("omo");
        return new Identifier();
      }
      pairs.set(key, val);
      if (
        !this.peekTokenIs(TokenType.RightSquirlyBrace) &&
        !this.expectPeek(TokenType.Comma)
      ) {
        console.log("po");
        return new Identifier();
      }
    }
    if (!this.expectPeek(TokenType.RightSquirlyBrace)) {
      console.log("fuck");
      return new Identifier();
    }
    return new HashLiteral(cur, pairs);
  }

  private parseBoolean(): Expression {
    return new BooleanLiteral(this.curToken, this.curTokenIs(TokenType.True));
  }

  private curTokenIs(t: TokenType): boolean {
    return this.curToken.type == t;
  }

  private peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type == t;
  }

  private expectPeek(t: TokenType): boolean {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    }
    this.peekTypeError(t);
    return false;
  }

  private peekTypeError(t: TokenType) {
    this.errors.push(
      `Expecting token of type ${t}, got token of type ${this.peekToken.type}.`
    );
  }

  private peekPrecedence(): operationOrder {
    const precedence = precedences.get(this.peekToken.type);
    if (precedence != undefined) {
      return precedence;
    }
    return operationOrder.LOWEST;
  }

  private curPrecendece(): operationOrder {
    const precedence = precedences.get(this.curToken.type);
    if (precedence != undefined) {
      return precedence;
    }
    return operationOrder.LOWEST;
  }
}
