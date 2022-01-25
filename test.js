import PDFDocument from 'pdfkit';
import fs from 'fs';

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus.  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl.';

const text = 'Chords and scales are built from intervals, or two pitches played in sequence or simultaneously. Depending how you count, there are only half a dozen to a few dozen intervals that make up the 12-tone system.';

const shy = '\u00AD';
const splitterRegex = new RegExp('[ \u00AD\n-]+', 'g');
// does not handle pagination...
function myTextWrapWalker(doc, str, x, y, width, height, onWord, onLine) {
  const spaceWidth = doc.widthOfString(' ', {});
  const lineHeight = doc.heightOfString('Why?', {}); // TODO account for line-spacing
  console.warn('spaceWidth = ', spaceWidth);
  const words = str.split(splitterRegex);
  let dx = 0;
  let dy = 0;
  let wix = 0;
  while (wix < words.length) {
    let word = words[wix];
    //console.warn('word:', word);
    const wid = doc.widthOfString(word, {});
    if (dx + wid + spaceWidth < width) {
      onWord(x + dx, y + dy, word + ' ');
      dx += wid + spaceWidth;
      wix++;
    } else if (dx + wid < width) {
      onWord(x + dx, y + dy, word);
      dx += wid;
      wix++;
    } else {
      dx = 0;
      dy += lineHeight;
      onLine();
    }
  }
}

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('./build/test.pdf')); // write to PDF
// add stuff to PDF here using methods described below...
doc.fontSize(12);
// doc.text(`This text is left aligned. ${lorem}`, 160, 160, {
//   lineBreak: false,
//   align: 'left'
// });
const bigWid = 8.5*72;
const half = bigWid / 2.0;
const margin = 0.5 * (bigWid - half);
myTextWrapWalker(doc, text, margin, margin, half, 20000,
  (x, y, word) => {
    console.warn('yielded WORD:', word);
    doc.text(word, x, y, {lineBreak: false, align: 'left'});
  }, () => {
    // nothing to do
    console.warn('yielded BREAK');
  });
// finalize the PDF and end the stream
doc.end();

// PUBL XML input language
// TODO <document>
//    - tag to set PDF metadata, contain page maters or page pair masters
// TODO <page> template tag of some kind, or <pp> for page pairs
// Content tags, that get laid out in the page or pp containers:
//   - all tags with style attribute (dictionary or flattened string with k:v; k:v as expected)
//   - <view>
//      allows zero or more children that are <view/>, <image/>, or <text/> tags, no strings as direct children
//   - <text>
//      allows zero or more children that are <text/> or raw strings (actual content), no views or images as children
//   - <image> (image view)
//      layed out like a view, but displays as an image
//      a. has `src` attribute OR
//      b. only has one child, which is an <svg> tag (and SVG tags as children of that)
//     <a> for links and anchors
