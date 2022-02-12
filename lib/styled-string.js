import { BrayElem } from 'bray';
import AuspexArgumentException from './exceptions.js';
import hyphenateText from './hyphenate.js';

export default class StyledString {
  constructor(str, styleObj) {
    this.str = str;
    this.style = styleObj;
    // hyphenation actually occurs here
    if (this.style.hyphens === 'auto') { // null or 'none' for false
      this.str = hyphenateText(this.str);
    }
  }
  static _getStyles(props) {
    let ret = {};
  // TODO make an exhaustive list
    //console.warn('\nGET STYLE props:');
    //printProps(props);
    ret.backgroundColor =
                  BrayElem.propOrStyleOrDefault(props, 'backgroundColor', null) ||
                  BrayElem.propOrStyleOrDefault(props, 'background-color', 'transparent');
    ret.fontSize = +(
                  BrayElem.propOrStyleOrDefault(props, 'fontSize', null) ||
                  BrayElem.propOrStyleOrDefault(props, 'font-size', 12) );
    ret.fontFamily =
                  BrayElem.propOrStyleOrDefault(props, 'fontFamily', null) ||
                  BrayElem.propOrStyleOrDefault(props, 'font-family', 'Helvetica');
    ret.color   = BrayElem.propOrStyleOrDefault(props, 'color', 'black');
    ret.hyphens = BrayElem.propOrStyleOrDefault(props, 'hyphens', null);
    return ret;
  }
  static addStringsToBuilder(ssTexts, one, parentProps) {
    if (BrayElem.isString(one)) {
      //console.warn('PUSHING a String');
      ssTexts.push(new StyledString(one, StyledString._getStyles(parentProps)));
      return;
    }
    //console.warn('a Text tag');
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
