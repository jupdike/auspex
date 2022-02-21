import { BrayElem } from 'bray';
import StyledString from './styled-string.js';

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

function docWidthOfString(doc, str, opts) {
  if (str === '\t' && opts) {
    console.warn('TAB! this has a width of:', opts.textIndent);
    return opts.textIndent;
  }
  return doc.widthOfString(str, opts);
}

const shy = '\u00AD'; // soft hyphen
const splitterRegex = new RegExp('[ \u00AD\t\n-]+', 'g'); // TODO allow em and en dashes
const oneOrMoreShy = new RegExp('\u00AD+', 'g'); // one or more soft hyphens
const whitespace = new RegExp('[ \n]+', 'g');
// does not handle pagination...
function myTextWrapWalker(doc, parOpts, stylesStringsArr, x, y, width, height, onStyleChange, onWord, onLine) {
  let lineHeight = 0;
  // TODO use parOpts.lineHeight
  let dx = 0;
  let dy = 0;
  stylesStringsArr.forEach(ab => {
    const opts = ab.style;
    let str = ab.str;

    // let stylesStringsArr2 = stylesStringsArr;
    // if (stylesStringsArr[0].style.textIndent) {
    //   stylesStringsArr2 = BrayElem.pushFront(stylesStringsArr, new StyledString('\t', stylesStringsArr[0].style));
    // }
    // console.warn('StylesStrings2:\n---\n', stylesStringsArr2);
    if (opts.textIndent) {
      str = '\t' + str;
      console.warn('STR:\n'+str+'|\n---');
    }
    onStyleChange(opts);

    const spaceWidth = docWidthOfString(doc, ' ', opts);
    const hyphenWidth = docWidthOfString(doc, '-', opts);
    lineHeight = lineHeight || doc.heightOfString('Why?', opts/* TODO merged with parOpts.lineHeight */); // TODO account for line-spacing 1.2x or 1.3x or whatever, but only parOpts can change line-spacing! (and only first font size will effect lineHeight)

    const pairs = splitter(str);
    let wix = 0;
    const wordWidths = pairs.map(pair => docWidthOfString(doc, pair[0], opts));
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
      const sepWid = docWidthOfString(doc, seps, opts);
      const wid = wordWidths[wix];
      if (isShy && dx + wid + sepWid + nextWordWidth + hyphenWidth < width) {
        // next chunk of this word plus a hyphen will fit, so we know we this piece of text will fit and will not need a hyphen
        onWord(dx, dy, word, opts);
        dx += wid;
        wix++;
      } else if (isShy && dx + wid + sepWid + nextWordWidth < width) {
        // next chunk of this word w/o a hyphen will fit, so we know we this piece of text will fit and will not need a hyphen
        onWord(dx, dy, word, opts);
        dx += wid;
        wix++;
      } else if (isShy && dx + wid + hyphenWidth < width) {
        // next chunk will not fit, but we will, with our hyphen
        onWord(dx, dy, word + '-', opts);
        dx += wid + hyphenWidth;
        wix++;
      }
      else if (!isShy && word === '' && dx + sepWid < width) {
        // TODO
        console.warn('EMPTY WORD, with leading space, sepWid =', sepWid);
        dx += sepWid;
        onWord(dx, dy, '', opts);
        wix++;
      }
      else if (!isShy && dx + wid + sepWid < width) {
        if (word === '') {
          //console.warn('EMPTY WORD, sepWid =', sepWid);
          throw new Exception("NOPE! should not happen, LayoutLines!");
        }
        // normal case for non-soft-hyphens (potentially, with a trailing hyphen or dash)
        onWord(dx, dy, word + seps, opts);
        dx += wid + sepWid;
        wix++;
      } else if (!isShy && dx + wid < width) {
        onWord(dx, dy, word, opts);
        dx += wid;
        wix++;
      } else {
        dx = 0;
        dy += lineHeight;
        onLine();
      }
    }
    onLine();
  });
  return [dy, dy + lineHeight];
}

function docText(doc, str, x, y, opts) {
  //console.warn('DOC TEXT:', str, x, y);
  doc.text(str, x, y, opts);
}

// TODO font size 20 test has a few bugs:
// 1. entire line should not be the same style
// 2. one hyphen is in the wrong spot, not at the end of the line ... (nor-mal)
export function layoutLines(doc, parOpts, stylesStringsArr, x, y, width, height) {
  console.warn('x y:', x, y);
  parOpts = parOpts || { align: 'left', justify: false };
  let isJustified = parOpts.justify; // boolean!
  let align = parOpts.align;
  let lastLineBuilder = [];
  let lastDX = -1337;
  let lastDY = -1337;
  let lastStyleOpts = null;
  function styler(opts) {
    if (opts && opts.fontFamily) {
      //console.warn('* CHANGE font to:', opts.fontFamily);
      doc.font(opts.fontFamily);
    }
    if (opts && opts.color) {
      //console.warn('* CHANGE color to:', opts.color);
      doc.fillColor(opts.color);
    }
  }
  function myYieldOneLine(isVeryLastLine) {
    if (lastLineBuilder.length < 1) {
      return;
    }
    let testTxt = lastLineBuilder.map(x => x.str).join('').trim();
    console.warn('testTxt:', testTxt);
    if (testTxt === '') {
      lastLineBuilder = [];
      return;
    }
    const noInnerWhitespace = testTxt.match(whitespace) ? false : true;
    styler(lastStyleOpts);
    if (!isJustified || isVeryLastLine || noInnerWhitespace) {
      // ragged edge
      let padX = 0;
      if (align === 'right') {
        padX = width - docWidthOfString(doc, txt.trimEnd(), {});
      } else if (align === 'center') {
        padX = 0.5 * (width - docWidthOfString(doc, txt.trimEnd(), {}));
      }
      lastLineBuilder.forEach(ab => {
        const txt = ab.str;
        styler(ab.style);
        docText(doc, txt, x + lastDX + padX, y + lastDY, {lineBreak: false, align: 'left'});
      });
      lastLineBuilder = [];
    } else {
      //console.warn('justify!');
      // justified: left, right, or center! (and we are not the last line, so just fill the full width!)

      let totalFilledSpace = 0;
      lastLineBuilder.forEach(ab => {
        const txt = ab.str;
        const words = txt.trim().split(' ');
        styler(ab.style);
        //docText(doc, txt, x + lastDX + padX, y + lastDY, {lineBreak: false, align: 'left'});
        words.forEach(word => { totalFilledSpace += docWidthOfString(doc, word, ab.style); })
      });

      let neededSpace = width - totalFilledSpace;
      // must have more than one word; that is what the whitespace check is, above
      const denom = testTxt.split(' ').length - 1;
      console.warn(testTxt+'| denom:', denom);
      let interWordSpace = neededSpace / denom;
      let dx = 0;
      lastLineBuilder.forEach(ab => {
        styler(ab.style);
        //console.warn('HERE|||' + ab.str + '|||');
        const pairs = ab.str === '' ? [] : splitter(ab.str);
        //console.warn('SPLITTER RETURNED:', pairs);
        pairs.forEach(pair => {
          const wordOnly = pair[0];
          const sep = pair[1];
          let word = wordOnly;
          if (sep !== ' ') {
            word += sep;
          }
          const wordWidth = docWidthOfString(doc, word, ab.style);
          docText(doc, word, x + dx + lastDX, y + lastDY, {lineBreak: false, align: 'left'});
          dx += wordWidth;
          if (dx !== 0 && sep === ' ') {
            //console.warn(word, 'INTERWORD SPACE');
            dx += interWordSpace;
          }
        });
      });

      lastLineBuilder = [];
    }
  }
  let [dy1, dy2] = myTextWrapWalker(doc, parOpts, stylesStringsArr, x, y, width, height,
    styler,
    // TODO a problem with leading space here! Hmmm... for paragraphs and for the bug itself!
    // TODO the leading space gets eaten here!
    (dx, dy, word, style) => {
      //console.warn('yielded WORD:', word);
      //doc.text(word, x, y, {lineBreak: false, align: 'left'});
      lastLineBuilder.push(new StyledString(word, style));
      lastDX = lastDX < 0 ? dx : lastDX;
      lastDY = dy;
      lastStyleOpts = style;
    },
    () => {
      //console.warn('yielded BREAK');
      myYieldOneLine(false);
      lastDX = -1337;
    });
  myYieldOneLine(true);
  return [dy1, dy2];
}


// const textsList = [[text, {font: 'Helvetica'}], [text2, {font: 'Helvetica-Oblique'}]];
// doc.rect(margin, margin, half, 900).stroke();
// //layoutLines(doc, {lineHeight: 1.2, align: 'left', justify: true}, textsList, margin, margin, half, 900);
