import { Lexer, TokenType } from "./lexer.js";
export class EventParser {
  constructor() {}
  read(future = 0) {
    if (this.offset + future > this.tokens.length) throw `Cannot read, offset ${this.offset} > tokens.length ${this.tokens.length}`;
    return this.tokens[this.offset + future];
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
          // console.log("Continuation of", results[results.length-1]);
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
          if (this.read().is(")")) {
            this.next();
          }

          //Freestyle (but not Freestyle Relay)
          if (type.endsWith("Freestyle") && this.read().is("Name")) {
            this.next(); //Name
            this.next(); //Year
            this.next(); //School
            this.next(); //Seed
            this.next(); //Time
          } else if (this.read().is("Team")) {
            this.next(); //Team
            this.next(); //Relay
            this.next(); //Seed
            this.next(); //Time
          }

          let teams = new Array();
          while (this.hasNext && !this.read().is("Event")) {
            let _index = this.read().toString();
            this.next();
            let name = "";
            for (let i = 0; i < 10; i++) {
              if (this.read().is("A")) break;
              name += this.read().toString() + " ";
              this.next();
            }
            this.next(); //A

            let seedTime = "";
            seedTime += this.read().toString(); //#
            seedTime += this.read().toString(); //:
            seedTime += this.read().toString(); //#
            seedTime += this.read().toString(); //:
            seedTime += this.read().toString(); //#

            while (this.hasNext && !this.read().is(TokenType.NUMBER) && !this.read(1).is(")")) {
              this.next();
            }
            let members = new Array();
            while (this.hasNext && this.read().is(TokenType.NUMBER) && this.read(1).is(")")) {
              this.next();
              this.next();
              let member = {
                name: "",
                index: 0,
                seedTime: 0
              };
              while (this.hasNext && !this.read().is(TokenType.NUMBER) && !this.read(1).is(")")) {
                // console.log(this.read().toString());
                member.name += this.read().toString() + " ";
                this.next();
              }
              members.push(member);
              console.log(members);
            }
            teams.push({
              seedTime,
              name,
              index: _index,
              members
            });
          }
          results.push({
            index,
            gender,
            distance,
            type,
            teams
          });
        }
        if (lastEvtOffset !== -1 && evtOffset !== -1) {}
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