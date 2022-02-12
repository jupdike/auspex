import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

import StyledString from './styled-string.js';

// for debugging
function printProps(props) {
  if (BrayElem.isArray(props)) {
    console.warn('[');
    let show = false;
    props.forEach(x => {
      if (show) {
        console.warn(',');
      }
      show = true;
      printProps(x)
    });
    console.warn(']');
    return;
  }
  if (!props) {
    console.warn('PROPS is NULL or UNDEFINED');
  }
  for (var k in props) {
    if (!props.hasOwnProperty(k)) {
      continue;
    }
    if (k.startsWith('_') || k === 'children') {
      continue;
    }
    console.warn(k+':', props[k]);
  }
}

export default function View(props) {
  const doc = props._doc;
  console.warn('SIZE:', doc.page.width, doc.page.height);
  console.warn('VIEW props:', props.x, props.y, props.width, props.height, props['font-size']);
  // TODOx do something with props._doc
  //
  // console.warn('VIEW props:');
  // printProps(props);
  // process.exit(1);
  const children = BrayElem.childrenWithoutWhitespaceStrings(props.children);
  children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      throw new AuspexArgumentException("Auspex <view> elements can only contain tags as children, not strings. Wrap text in a <text> tag.");
    }
  });
  // children.forEach(kid => {
  // TODO fancier layouts mixing Text and View tags ... complicated!
  // });
  const texts = children.filter(kid => kid.props._oldTagName === 'text');
  console.warn('TEXTS:', texts.length);
  // flatten the lists of texts and create flat list of StyledString objects
  let ssTexts = [];
  const viewProps = BrayElem.pushFront(props._parentProps, props);
  children.forEach(kid => {
    console.warn('View is calling addStringsToBuilder');
    StyledString.addStringsToBuilder(ssTexts, kid, viewProps);
  });
  console.warn('StyleStrings:\n---\n', ssTexts);
  // TODO now layout the actual ssTexts inside of x y width height
  //

  return BrayElem.create('view2', props, ...children);
}
