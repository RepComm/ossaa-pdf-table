import { Scanner } from "./scanner.js";
export let TokenType;
(function (TokenType) {
  TokenType[TokenType["IDENTIFIER"] = 0] = "IDENTIFIER";
  TokenType[TokenType["CURLY_BRACKET"] = 1] = "CURLY_BRACKET";
  TokenType[TokenType["PARENTHESIS"] = 2] = "PARENTHESIS";
  TokenType[TokenType["COLON"] = 3] = "COLON";
  TokenType[TokenType["STRING"] = 4] = "STRING";
  TokenType[TokenType["NUMBER"] = 5] = "NUMBER";
  TokenType[TokenType["COMMA"] = 6] = "COMMA";
})(TokenType || (TokenType = {}));
export class Token {
  constructor() {}
  static join(tokens, separator = " ") {
    return tokens.map(token => token.toString()).join(separator);
  }
  is(a, b) {
    if (typeof a === "string") {
      return this.toString() === a;
    } else {
      if (b !== undefined) {
        return this.type === a && this.toString() === b;
      } else {
        return this.type === a;
      }
    }
  }
  toString() {
    return this.src.substring(this.contentStart, this.contentEnd);
  }
  static from(s, o, type) {
    let t = new Token();
    t.type = type;
    t.src = s.src;
    t.contentStart = o.contentStart;
    t.contentEnd = o.contentEnd;
    return t;
  }
}
export class Lexer {
  static lex(src) {
    let result = new Array();
    let s = {
      src,
      offset: 0,
      srcLength: src.length
    };
    let o = {
      contentEnd: 0,
      contentStart: 0,
      successfulReadCount: 0
    };
    while (s.offset < s.srcLength) {
      //      System.out.printf("Offset %d of %d\n", s.offset, s.srcLength);

      Scanner.whitespace(s, o); //ignore whitespace
      if (Scanner.success(o)) Scanner.advance(s, o);
      Scanner.single(s, o, '(');
      if (Scanner.success(o)) {
        Scanner.advance(s, o);
        result.push(Token.from(s, o, TokenType.PARENTHESIS));
        continue;
      }
      Scanner.single(s, o, ')');
      if (Scanner.success(o)) {
        Scanner.advance(s, o);
        result.push(Token.from(s, o, TokenType.PARENTHESIS));
        continue;
      }

      // Scanner.fromTo(s, o, '"', '"');
      // if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.STRING)); continue; }

      Scanner.charset(s, o, "0123456789");
      if (Scanner.success(o)) {
        Scanner.advance(s, o);
        result.push(Token.from(s, o, TokenType.NUMBER));
        continue;
      }
      Scanner.charset(s, o, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',.?:&$!/\\|[]");
      if (Scanner.success(o)) {
        Scanner.advance(s, o);
        result.push(Token.from(s, o, TokenType.IDENTIFIER));
        continue;
      }
      console.log(`end with no match "${s.src.substring(s.offset, s.offset + 10)}"`);
      break;
    }
    return result;
  }
}