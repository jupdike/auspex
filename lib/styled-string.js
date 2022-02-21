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
  static _getStyles(props, isFirst) {
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
    ret.textIndent = +(
                  BrayElem.propOrStyleOrDefault(props, 'textIndent', null) ||
                  BrayElem.propOrStyleOrDefault(props, 'text-indent', 0) );
    if (isFirst) {
      let firstTextIndent = +(
                    BrayElem.propOrStyleOrDefault(props, 'first-text-indent', null) ||
                    BrayElem.propOrStyleOrDefault(props, 'first-text-indent', 0) );
      ret.textIndent = (firstTextIndent !== null) ? 0 : ret.textIndent;
    }
    ret.color   = BrayElem.propOrStyleOrDefault(props, 'color', 'black');
    ret.hyphens = BrayElem.propOrStyleOrDefault(props, 'hyphens', null);
    return ret;
  }
  static arrayFromBrayElem(elem, viewProps, isFirst) {
    let ssTexts = [];
    elem.props.children.forEach(kid => {
      StyledString.addStringsToBuilder(ssTexts, kid, viewProps, isFirst);
    });
    return ssTexts;
  }
  static addStringsToBuilder(ssTexts, one, parentProps, isFirst) {
    if (BrayElem.isString(one)) {
      //console.warn('PUSHING a String');
      let styles = StyledString._getStyles(parentProps, isFirst);
      ssTexts.push(new StyledString(one, styles));
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
      StyledString.addStringsToBuilder(ssTexts, kid, twoProps, isFirst);
    });
  }

}
