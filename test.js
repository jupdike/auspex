import PDFDocument from 'pdfkit';
import fs from 'fs';

import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const h = new Hypher(english);
function hyphenateText(x) {
  return h.hyphenateText(x);
}

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus.  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl.';

const text = hyphenateText('Chords and scales are built from intervals, or two pitches played in sequence or simultaneously. Depending how you count, there are only half a dozen to a few dozen intervals that make up the 12-tone system.');

const text2 = hyphenateText(' Learn about 5-TET, 7-TET, 10-TET, 12-TET (our normal scale), and 24-TET.');

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
const whitespace = new RegExp('[ \n]+', 'g');
// does not handle pagination...
function myTextWrapWalker(doc, parOpts, textsList, x, y, width, height, onStyleChange, onWord, onLine) {
  let lineHeight = 0;
  // TODO use parOpts.lineHeight
  let dx = 0;
  let dy = 0;
  textsList.forEach(ab => {
    const str = ab[0];
    const opts = ab[1];
    onStyleChange(opts);

    const spaceWidth = doc.widthOfString(' ', opts);
    const hyphenWidth = doc.widthOfString('-', opts);
    lineHeight = lineHeight || doc.heightOfString('Why?', opts/* TODO merged with parOpts.lineHeight */); // TODO account for line-spacing 1.2x or 1.3x or whatever, but only parOpts can change line-spacing! (and only first font size will effect lineHeight)

    const pairs = splitter(str);
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
      if (seps.match(whitespace)) {
        seps = ' '; // replace multiple spaces or newlines or combination with just a single space
      }
      const sepWid = doc.widthOfString(seps, {});
      const wid = wordWidths[wix];
      if (isShy && dx + wid + sepWid + nextWordWidth + hyphenWidth < width) {
        // next chunk of this word plus a hyphen will fit, so we know we this piece of text will fit and will not need a hyphen
        onWord(dx, dy, word);
        dx += wid;
        wix++;
      } else if (isShy && dx + wid + hyphenWidth < width) {
        // next chunk will not fit, but we will, with our hyphen
        onWord(dx, dy, word + '-');
        dx += wid + hyphenWidth;
        wix++;
      } else if (!isShy && dx + wid + sepWid < width) {
        // normal case for non-soft-hyphens (potentially, with a trailing hyphen or dash)
        onWord(dx, dy, word + seps);
        dx += wid + sepWid;
        wix++;
      } else if (!isShy && dx + wid < width) {
        onWord(dx, dy, word);
        dx += wid;
        wix++;
      } else {
        dx = 0;
        dy += lineHeight;
        onLine();
      }
    }
  });
  return [dy, dy + lineHeight];
}

// TODO font size 20 test has a few bugs:
// 1. entire line should not be the same style
// 2. one hyphen is in the wrong spot, not at the end of the line ... (nor-mal)
function layoutLines(doc, parOpts, textsList, x, y, width, height) {
  parOpts = parOpts || { align: 'left', justify: false };
  let isJustified = parOpts.justify; // boolean!
  let align = parOpts.align;
  let lastLineBuilder = [];
  let lastDX = -999;
  let lastDY = -999;
  function myYieldOneLine(isVeryLastLine) {
    if (lastLineBuilder.length < 1) {
      return;
    }
    let txt = lastLineBuilder.join('');
    //console.warn('txt:', txt, lastX, lastY);
    if (txt === '') {
      lastLineBuilder = [];
      return;
    }
    const noInnerWhitespace = txt.trim().match(whitespace) ? false : true;
    if (!isJustified || isVeryLastLine || noInnerWhitespace) {
      // ragged edge
      let padX = 0;
      if (align === 'right') {
        padX = width - doc.widthOfString(txt.trimEnd(), {});
      } else if (align === 'center') {
        padX = 0.5 * (width - doc.widthOfString(txt.trimEnd(), {}));
      }
      doc.text(txt, x + lastDX + padX, y + lastDY, {lineBreak: false, align: 'left'});
      lastLineBuilder = [];
    } else {
      //console.warn('justify!');
      // justified: left, right, or center! (and we are not the last line, so just fill the full width!)
      const words = txt.trim().split(' ');
      let totalFilledSpace = 0;
      words.forEach(word => { totalFilledSpace += doc.widthOfString(word, {}); })
      let neededSpace = width - totalFilledSpace;
      // must have more than one word; that is what the whitespace check is, above
      const denom = words.length - 1;
      //console.warn(txt, 'denom:', denom);
      let interWordSpace = neededSpace / denom;
      let dx = 0;
      words.forEach(word => {
        const wordWidth = doc.widthOfString(word, {});
        if (dx !== 0) {
          dx += interWordSpace;
        }
        doc.text(word, x + dx + lastDX, y + lastDY, {lineBreak: false, align: 'left'});
        dx += wordWidth;
      });
      lastLineBuilder = [];
    }
  }
  let [dy1, dy2] = myTextWrapWalker(doc, parOpts, textsList, x, y, width, height,
    (opts) => {
      if (opts.font) {
        console.warn('changing font to:', opts.font);
        doc.font(opts.font);
      }
    },
    (dx, dy, word) => {
      //console.warn('yielded WORD:', word);
      //doc.text(word, x, y, {lineBreak: false, align: 'left'});
      lastLineBuilder.push(word);
      lastDX = lastDX < 0 ? dx : lastDX;
      lastDY = dy;
    },
    () => {
      //console.warn('yielded BREAK');
      myYieldOneLine(false);
      lastDX = -999;
    });
  myYieldOneLine(true);
  console.warn(dy1, dy2);
}

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('./build/test.pdf')); // write to PDF

const bigWid = 8.5*72;
const half = bigWid / 2.0;
const margin = 0.5 * (bigWid - half);
doc.fontSize(20);

const textsList = [[text, {font: 'Helvetica'}], [text2, {font: 'Helvetica-Oblique'}]];
doc.rect(margin, margin, half, 900).stroke();
layoutLines(doc, {lineHeight: 1.2, align: 'center', justify: true}, textsList, margin, margin, half, 900);
// finalize the PDF and end the stream
doc.end();

// PUBL XML input language
// TODO <document>
//    - tag to set PDF metadata, contain page maters or page pair masters
// TODO <page> template tag of some kind, or <pp> for page pairs
// Content tags, that get laid out in the page or pp containers:
//   - all tags with style attribute (dictionary or flattened string with k:v; k:v as expected)
//   - <view>
//        allows zero or more children that are <view/>, <image/>, or <text/> tags, no strings as direct children
//   - <text>
//        allows zero or more children that are <text/> or raw strings (actual content), no views or images as children
//   - <image> (image view)
//        laid out like a view, but displays an image
//        a. has `src` attribute and no children (PNG, JPG, whatever PDF supports) OR
//        b. only has one child, which is an <svg> tag (and SVG tags as children of that)
//     <a> for links and anchors
