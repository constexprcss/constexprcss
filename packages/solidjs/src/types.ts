import * as CSS from 'csstype';
/**
 * Typing for the interpolations.
 */
export declare type BasicTemplateInterpolations = string | number;
/**
 * These are all the CSS props that will exist.
 */
export declare type CSSProps = CSS.Properties<string | number>;
export declare type AnyKeyCssProps<TValue> = {
    [key: string]: AnyKeyCssProps<TValue> | CSSProps | string | number | TValue;
};
export declare type CssFunction<TValue = void> = CSSProps | AnyKeyCssProps<TValue> | TemplateStringsArray | string | boolean | undefined;
