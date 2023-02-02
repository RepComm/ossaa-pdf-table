import { Lexer, TokenType } from "./lexer.js";
export class EventParser {
  constructor() {}
  read() {
    if (this.offset > this.tokens.length) throw `Cannot read, offset ${this.offset} > tokens.length ${this.tokens.length}`;
    return this.tokens[this.offset];
  }
  next() {
    this.offset++;
  }
  expected(v) {
    throw `Error at ${this.offset}, expected ${v}, got ${this.read().toString()}`;
  }
  get hasNext() {
    return this.offset < this.tokens.length;
  }
  findEventSections() {
    let results = new Array();
    let lastEvtOffset = -1;
    let evtOffset = -1;
    while (this.hasNext) {
      if (this.read().is(TokenType.IDENTIFIER, "Event")) {
        lastEvtOffset = evtOffset;
        evtOffset = this.offset;
        this.next();
        let index = this.read().toString();
        this.next();
        if (this.read().is("...")) {
          console.log("Continuation of", results[results.length - 1]);
          this.next();
          if (this.read().is("(")) {
            this.next();
          }
        } else {
          let gender = this.read().toString();
          this.next();
          let distance = this.read().toString();
          this.next();
          if (this.read().is("Yard")) this.next();
          let t = this.read();
          let type = t.toString();
          this.next();
          t = this.read();
          if (t.is("Relay")) {
            type += " " + t.toString();
            this.next();
          }
          results.push({
            index,
            gender,
            type,
            teams: []
          });
        }
        if (lastEvtOffset !== -1 && evtOffset !== -1) {}
      } else if (this.read().is(TokenType.IDENTIFIER, "Team")) {
        let school = "";
        results[results.length - 1].teams.push({
          name: school,
          members: []
        });
      }
      this.next();
    }
    return results;
  }
  parse(tokens) {
    this.tokens = tokens;
    this.offset = 0;
    let result = {
      events: undefined
    };
    let output = "";
    for (let token of tokens) {
      output += ` [${token.type} : ${token.toString()}]`;
    }

    // console.log(output);

    result.events = this.findEventSections();
    return result;
  }
}
export function parse(src) {
  let tokens = Lexer.lex(src);
  let parser = new EventParser();
  return parser.parse(tokens);
}