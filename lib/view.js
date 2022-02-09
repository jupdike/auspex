import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

export default function View(props) {
  const children = BrayElem.childrenWithoutWhitespaceStrings(props.children);
  children.forEach(kid => {
    if (BrayElem.isString(kid)) {
      throw new AuspexArgumentException("Auspex <view> elements can only contain tags, not strings. Wrap text in a <text> tag.");
    }
  });
  // TODOx
  //
  //
  return BrayElem.create('view2', props, ...children);
}
