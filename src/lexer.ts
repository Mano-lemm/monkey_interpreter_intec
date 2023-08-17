import { keywords } from "./maps";
import { TokenType, type token } from "./types";

export class lexer {
  private input = "";
  private pos = 0;
  private readPos = 0;
  private ch = "";

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  public nextToken(): token {
    let rt: token = { type: TokenType.Illegal, literal: "" };
    this.skipWhiteSpace();
    switch (this.ch) {
      case ",":
        rt = { type: TokenType.Comma, literal: "," };
        break;
      case ";":
        rt = { type: TokenType.Semicolon, literal: ";" };
        break;
      case ":":
        rt = { type: TokenType.Colon, literal: ":" };
        break;
      case "[":
        rt = { type: TokenType.LeftSquareBrace, literal: "[" };
        break;
      case "]":
        rt = { type: TokenType.RightSquareBrace, literal: "]" };
        break;
      case "(":
        rt = { type: TokenType.LeftRoundBrace, literal: "(" };
        break;
      case ")":
        rt = { type: TokenType.RightRoundBrace, literal: ")" };
        break;
      case "{":
        rt = { type: TokenType.LeftSquirlyBrace, literal: "{" };
        break;
      case "}":
        rt = { type: TokenType.RightSquirlyBrace, literal: "}" };
        break;
      case "=":
        if (this.peekChar() == "=") {
          rt = { type: TokenType.Equal, literal: "==" };
          this.readChar();
        } else {
          rt = { type: TokenType.Assign, literal: "=" };
        }
        break;
      case "+":
        rt = { type: TokenType.Plus, literal: "+" };
        break;
      case "-":
        rt = { type: TokenType.Minus, literal: "-" };
        break;
      case "!":
        if (this.peekChar() == "=") {
          rt = { type: TokenType.NotEqual, literal: "!=" };
          this.readChar();
        } else {
          rt = { type: TokenType.Bang, literal: "!" };
        }
        break;
      case "*":
        rt = { type: TokenType.Asterisk, literal: "*" };
        break;
      case "/":
        rt = { type: TokenType.Slash, literal: "/" };
        break;
      case "<":
        rt = { type: TokenType.LessThan, literal: "<" };
        break;
      case ">":
        rt = { type: TokenType.GreaterThan, literal: ">" };
        break;
      case "\0":
        rt = { type: TokenType.EOF, literal: "" };
        break;
      default:
        // match letter
        if (this.ch.match(/[a-z]/i) || this.ch.match(/_/)) {
          rt = this.readIdentifier();
        } else if (this.ch.match(/\d/)) {
          rt = this.readIntLiteral();
        } else if (this.ch.match(/"/)) {
          rt = this.readStringLiteral();
        } else {
          rt = { type: TokenType.Illegal, literal: "" };
        }
        return rt;
    }
    this.readChar();
    return rt;
  }

  readStringLiteral(): token {
    let literal = "";
    this.readChar();
    while (!this.ch.match(/"/i) && this.ch != "") {
      literal += this.ch;
      this.readChar();
    }
    if (!this.ch.match(/"/)) {
      return { type: TokenType.Illegal, literal: literal };
    } else {
      this.readChar();
    }
    return { type: TokenType.String, literal: literal };
  }

  private readIdentifier(): token {
    let literal = "";
    while (this.ch.match(/[a-z]/i) || this.ch.match(/_/)) {
      literal += this.ch;
      this.readChar();
    }
    let type = keywords[literal];
    if (type == undefined) {
      type = TokenType.Ident;
    }
    return { type: type, literal: literal };
  }

  private readIntLiteral(): token {
    let literal = "";
    while (this.ch.match(/\d/)) {
      literal += this.ch;
      this.readChar();
    }
    return { type: TokenType.Int, literal: parseInt(literal) };
  }

  private readChar() {
    if (this.pos >= this.input.length) {
      this.ch = "\0";
    } else {
      const xd = this.input[this.readPos];
      this.ch = xd ? xd : " ";
    }
    this.pos = this.readPos;
    this.readPos++;
  }

  private peekChar(): string {
    if (this.pos >= this.input.length) {
      return "\0";
    } else {
      let x = this.input[this.readPos];
      if (x == undefined) {
        x = "\0";
      }
      return x;
    }
  }

  private skipWhiteSpace() {
    while (this.ch.match(/\s/)) {
      this.readChar();
    }
  }
}

// useful for debugging purposes
export function lex(input: string): token[] {
  const tokens: token[] = [];
  const parser = new lexer(input);
  let curTok = parser.nextToken();
  while (curTok.type != TokenType.EOF && curTok.type != TokenType.Illegal) {
    tokens.push(curTok);
    curTok = parser.nextToken();
  }
  tokens.push(curTok);
  return tokens;
}
