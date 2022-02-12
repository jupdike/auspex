import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';

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

export default class StyledString {
  constructor(str, styleObj) {
    this.str = str;
    this.style = styleObj;
  }
  static _getStyles(props) {
    let ret = {};
  // TODO make an exhaustive list
    console.warn('\nGET STYLE props:');
    printProps(props);
    ret.backgroundColor =
                BrayElem.propOrStyleOrDefault(props, 'backgroundColor', null) ||
                BrayElem.propOrStyleOrDefault(props, 'background-color',  'transparent');
    ret.fontSize = +(
                BrayElem.propOrStyleOrDefault(props, 'fontSize', null) ||
                BrayElem.propOrStyleOrDefault(props, 'font-size',  12) );
    ret.color = BrayElem.propOrStyleOrDefault(props, 'color',            'black');
    return ret;
  }
  static addStringsToBuilder(ssTexts, one, parentProps) {
    if (BrayElem.isString(one)) {
      console.warn('PUSHING a String');
      ssTexts.push(new StyledString(one, StyledString._getStyles(parentProps)));
      return;
    }
    console.warn('a Text tag');
    one.props.children.forEach(kid => {
      const twoProps = BrayElem.pushFront(parentProps, one.props);
      //console.warn('\nTWO props:');
      //printProps(twoProps);
      // if (BrayElem.isString(kid)) {
      //   addStringsToBuilder(ssTexts, kid, parentProps);
      //   return;
      // }
      StyledString.addStringsToBuilder(ssTexts, kid, twoProps);
    });
  }

}
