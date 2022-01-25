import PDFDocument from 'pdfkit';
import fs from 'fs';

import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const h = new Hypher(english);
function hyphenateText(x) {
  return h.hyphenateText(x);
}

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus.  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl.';

const text = hyphenateText('Chords and scales are built from intervals, or two pitches played in sequence or simultaneously. Depending how you count, there are only half a dozen to a few dozen intervals that make up the 12-tone system. Learn about 5-TET, 7-TET, 10-TET, 12-TET (our normal scale), and 24-TET.');

// split into pairs of [word, sep]
function splitter(str) {
  let wordBuilder = [];
  let sepBuilder = [];
  let inSep = true;
  let chix = 0;
  let ret = [];
  // yield pairs if they are not both empty
  function yieldPair(word, sep) {
    if (!(word === '' && sep === '')) {
      ret.push([word, sep]);
    }
  }
  do {
    const ch = str[chix];
    if (inSep) {
      if (ch.match(splitterRegex)) {
        sepBuilder.push(ch);
        chix++;
      } else {
        yieldPair(wordBuilder.join(''), sepBuilder.join(''));
        wordBuilder = [];
        sepBuilder = [];
        inSep = false;
      }
    } else {
      // in word
      if (ch.match(splitterRegex)) {
        inSep = true;
      } else {
        wordBuilder.push(ch);
        chix++;
      }
    }
  } while (chix < str.length);
  yieldPair(wordBuilder.join(''), sepBuilder.join(''));
  return ret;
}

const shy = '\u00AD'; // soft hyphen
const splitterRegex = new RegExp('[ \u00AD\n-]+', 'g'); // TODO allow em and en dashes
const oneOrMoreShy = new RegExp('\u00AD+', 'g'); // one or more soft hyphens
// does not handle pagination...
function myTextWrapWalker(doc, str, x, y, width, height, onWord, onLine) {
  const spaceWidth = doc.widthOfString(' ', {});
  const hyphenWidth = doc.widthOfString('-', {});
  const lineHeight = doc.heightOfString('Why?', {}); // TODO account for line-spacing 1.2x or 1.3x or whatever
  console.warn('spaceWidth = ', spaceWidth);

  const pairs = splitter(str);
  let dx = 0;
  let dy = 0;
  let wix = 0;
  const wordWidths = pairs.map(pair => doc.widthOfString(pair[0], {}));
  while (wix < pairs.length) {
    let word = pairs[wix][0];
    let seps = pairs[wix][1];
    let nextWordWidth = 0;
    if (wix < pairs.length - 1) {
      nextWordWidth = wordWidths[wix + 1];
    }
    let isShy = false;
    if (seps.match(oneOrMoreShy)) {
      isShy = true;
      seps = '-';
    }
    const sepWid = doc.widthOfString(seps, {});
    const wid = wordWidths[wix];
    if (isShy && dx + wid + sepWid + nextWordWidth + hyphenWidth < width) {
      // next chunk of this word plus a hyphen will fit, so we know we this piece of text will fit and will not need a hyphen
      onWord(x + dx, y + dy, word);
      dx += wid;
      wix++;
    } else if (isShy && dx + wid + hyphenWidth < width) {
      // next chunk will not fit, but we will, with our hyphen
      onWord(x + dx, y + dy, word + '-');
      dx += wid + hyphenWidth;
      wix++;
    } else if (!isShy && dx + wid + sepWid < width) {
      // normal case for non-soft-hyphens (potentially, with a trailing hyphen or dash)
      onWord(x + dx, y + dy, word + seps);
      dx += wid + sepWid;
      wix++;
    } else if (!isShy && dx + wid < width) {
      onWord(x + dx, y + dy, word);
      dx += wid;
      wix++;
    } else {
      dx = 0;
      dy += lineHeight;
      onLine();
    }
  }
  return [dy, dy + lineHeight];
}

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('./build/test.pdf')); // write to PDF
// add stuff to PDF here using methods described below...
doc.fontSize(30);
// doc.text(`This text is left aligned. ${lorem}`, 160, 160, {
//   lineBreak: false,
//   align: 'left'
// });
const bigWid = 8.5*72;
const half = bigWid / 2.0;
const margin = 0.5 * (bigWid - half);

// TODO A. alignment: left, right, justify (get a full line, then typeset it as a single string)
// TODO         NOTE: even left alignment requires typesetting each entire line all at once,
//                    so soft hyphens do not mess with kerning!
// TODO B changing styles (italic, bold, whatever), in the middle of a line/paragraph.
let [y1, y2] = myTextWrapWalker(doc, text, margin, margin, half, 20000,
  (x, y, word) => {
    console.warn('yielded WORD:', word);
    doc.text(word, x, y, {lineBreak: false, align: 'left'});
  }, () => {
    // nothing to do
    console.warn('yielded BREAK');
  });
console.warn(y1, y2);
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
