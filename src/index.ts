
import { exponent, UIBuilder } from "@roguecircuitry/htmless";
import pdfjs from "@bundled-es-modules/pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { parse } from "./eventparser.js";

pdfjs.GlobalWorkerOptions.workerSrc = "./node_modules/@bundled-es-modules/pdfjs-dist/build/pdf.worker.js";

const getDocument: typeof import("pdfjs-dist/types/src/display/api").getDocument = pdfjs.getDocument;

async function pdfToText(src: string) {
  let doc = await getDocument(src).promise;

  console.log("Doc", doc, doc.numPages);

  let result = "";
  for (let i = 1; i < doc.numPages; i++) { //apparently the pages start a 1, because why not
    let page = await doc.getPage(i);

    let textContent = "";

    let texts = await page.getTextContent();
    for (let text of texts.items) {
      textContent += (text as TextItem).str + " ";
    }
    result += textContent;
  }

  return result;
}

async function main() {
  console.log("hello world");

  let ui = new UIBuilder();

  ui.default(exponent);

  ui.create("style")
    .style({
      "body": {
        backgroundColor: "#c4c5c5",
        fontFamily: "courier",
        color: "3e3e3e"
      },
      "#container": {
        flexDirection: "column"
      },
      "#title": {
        textAlign: "center",
        fontSize: "larger"
      },
      "table": {
        flex: "1"
      },
      "#input, #output": {
        flex: "1",
        borderStyle: "dashed",
        borderWidth: "1px",
        borderColor: "black",
        backgroundColor: "#dee2eb",
        borderRadius: "0.5em",
        overflowY: "auto",
        margin: "0.5em",
        maxHeight: "90vh",
        maxWidth: "50vw",
        flexDirection: "column"
      },
      "#upload": {
        maxHeight: "2em",
        alignSelf: "center",
        borderStyle: "dashed",
        borderWidth: "1px",
        borderColor: "black",
        borderRadius: "0.5em",
        backgroundColor: "#dee2eb"
      },
      ".event-header > tr > th": {
        backgroundColor: "#c0c4c9"
      },
      ".event-header > tr > th, .event-header > tr > td": {
        textAlign: "center",
        borderBottomStyle: "dashed",
        borderBottomWidth: "1px",
        borderColor: "#b7b1b1",
        borderLeftStyle: "dashed",
        borderLeftWidth: "1px",
        padding: "0"
      },
      ".event": {
        flexDirection: "column"
      }
    })
    .mount(document.head);

  ui.create("div").id("container").mount(document.body);
  let container = ui.e;

  ui.create("span")
    .id("title")
    .textContent("ossaa-pdf-table")
    .mount(container);

  async function onInputLoaded(src: string) {
    contentInput.src = src;

    let textContent = await pdfToText(src);

    let result = parse(textContent);

    contentOutput.innerHTML = "";


    for (let event of result.events) {
      let eventContainer = ui.create("div").classes("event").mount(contentOutput).e;
      let eventHeader = ui.create("table").classes("event-header").mount(eventContainer).e;

      let eventHeaderTop = ui.create("tr").mount(eventHeader).e;
      ui.create("th").textContent("Event #").mount(eventHeaderTop);
      ui.create("th").textContent("Gender").mount(eventHeaderTop);
      ui.create("th").textContent("Type").mount(eventHeaderTop);

      let row = ui.create("tr").mount(eventHeader).e;
      ui.create("td").textContent(`${event.index}`).mount(row);
      ui.create("td").textContent(event.gender).mount(row);
      ui.create("td").textContent(event.type).mount(row);

      let eventTeams = ui.create("table").classes("teams-header").mount(eventContainer).e;
      let eventTeamsTop = ui.create("tr").mount(eventTeams).e;
      ui.create("th").textContent("#").mount(eventTeamsTop);
      ui.create("th").textContent("Team").mount(eventTeamsTop);
      ui.create("th").textContent("Member").mount(eventTeamsTop);
      ui.create("th").textContent("Seed Time").mount(eventTeamsTop);

      for (let team of event.teams) {
        for (let member of team.members) {
          let row = ui.create("tr").mount(eventTeams).e;
          ui.create("td").textContent(team.index).mount(row);
          ui.create("td").textContent(team.name).mount(row);
          ui.create("td").textContent(member.name).mount(row);
          ui.create("td").textContent(`${team.seedTime}`).mount(row);
        }
      }

    }


    // contentOutput.textContent = textContent;
  }

  let upload = ui.create("input")
    .id("upload")
    .on("change", (evt) => {
      let reader = new FileReader();
      reader.readAsDataURL(upload.files[0]);
      reader.onloadend = (evt) => {
        onInputLoaded(reader.result as string);
      };
    })
    .mount(container).e;

  upload.type = "file";

  let iosep = ui.create("div")
    .mount(container)
    .id("io-sep").e;

  let contentInput = ui.create("iframe")
    .id("input")
    .mount(iosep).e;

  let contentOutput = ui.create("div")
    .id("output")
    .mount(iosep).e;

}

main();
