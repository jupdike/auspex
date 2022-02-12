import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

import StyledString from './styled-string.js';

export default function View(props) {
  const doc = props._doc;
  console.warn('SIZE:', doc.page.width, doc.page.height);
  console.warn('VIEW props:', props.x, props.y, props.width, props.height, props['font-size']);
  // TODOx do something with props._doc
  //
  //console.warn('VIEW props:', props);
  //process.exit(1);
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
  children.forEach(kid => {
    console.warn('View is calling addStringsToBuilder');
    StyledString.addStringsToBuilder(ssTexts, kid, props._parentProps);
  });
  // TODO now layout the actual ssTexts inside of x y width height
  //
  console.warn('StyleStrings:\n---\n', ssTexts);
  return BrayElem.create('view2', props, ...children);
}
