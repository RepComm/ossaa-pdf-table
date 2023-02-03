import pdfjs from "@bundled-es-modules/pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc = "./node_modules/@bundled-es-modules/pdfjs-dist/build/pdf.worker.js";
const getDocument = pdfjs.getDocument;
/**Sort a PDF doc from left to right, and output in JS Objects/Arrays*/
export async function pdfOptimise(src, mergeHeightThreshold = 1) {
  let result = new Array();
  let doc = await getDocument(src).promise;
  for (let i = 1; i < doc.numPages; i++) {
    //apparently the pages start a 1, because why not
    let docPage = await doc.getPage(i);
    let page = {
      index: i,
      lines: new Array()
    };
    result.push(page);
    let linesMap = new Map();
    function resolveLine(n, threshold) {
      let rounded = Math.round(n);
      let low = rounded - threshold;
      let high = rounded + threshold;
      n = rounded;
      if (linesMap.has(n)) {
        return n;
      } else if (linesMap.has(low)) {
        n = low;
      } else if (linesMap.has(high)) {
        n = high;
      }
      return n;
    }
    function getLine(n) {
      let line = linesMap.get(n);
      if (line === undefined) {
        line = new Array();
        linesMap.set(n, line);
      }
      return line;
    }
    let docTexts = await docPage.getTextContent();
    for (let docText of docTexts.items) {
      let transform = docText.transform;
      if (!docText.str.endsWith(" ")) docText.str += " ";
      let originalY = transform[5];
      let utilizedY = resolveLine(originalY, mergeHeightThreshold);
      let pdftext = {
        rect: {
          x: transform[4],
          y: utilizedY,
          width: docText.width,
          height: docText.height
        },
        content: docText.str
      };
      getLine(pdftext.rect.y).push(pdftext);
    }
    for (let [y, line] of linesMap) {
      line.sort((a, b) => a.rect.x - b.rect.x);
    }
    for (let [y, line] of linesMap) {
      page.lines.push(line);
    }
    page.lines.sort((a, b) => b[0].rect.y - a[0].rect.y);
  }

  //debugging
  // for (let pi = 0; pi<result.length; pi++) {
  //   console.log("Page", pi);

  //   let page = result[pi];
  //   let lines = page.lines;
  //   for (let li = 0; li<lines.length; li++) {
  //     let line = lines[li];

  //     let lineText = "";
  //     for (let text of line) {
  //       lineText += text.content;
  //     }

  //     console.log(" Line:", line[0].rect.y, lineText);
  //   }
  // }

  return result;
}

/**Export the text of a PDF as a string in proper sorted visual order*/
export async function pdfToText(src, pageEnding = undefined) {
  let result = "";
  let pages = await pdfOptimise(src, 1);
  for (let page of pages) {
    for (let line of page.lines) {
      for (let text of line) {
        result += text.content;
      }
      result += " ";
    }
    result += " ";
    if (pageEnding !== undefined) result += pageEnding;
  }
  return result;
}