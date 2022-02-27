import { Component } from 'solid-js';
import { CssFunction, BasicTemplateInterpolations } from './types';

export interface FunctionIterpolation<TProps> {
  (props: TProps): string | number | undefined;
}

/**
 * Typing for the CSS object.
 */
export type CssObject<TProps> = CssFunction<FunctionIterpolation<TProps>>;

/**
 * Extra props added to the output Styled Component.
 */
export interface StyledProps {
  as?: keyof JSX.IntrinsicElements;
}

export type Interpolations<TProps extends unknown> = (
  | BasicTemplateInterpolations
  | FunctionIterpolation<TProps>
  | CssObject<TProps>
  | CssObject<TProps>[]
)[];

/**
 * This allows us to take the generic `TTag` (that will be a valid `DOM` tag) and then use it to
 * define correct props based on it from `JSX.IntrinsicElements`, while also injecting our own
 * props from `StyledProps`.
 */
export interface StyledFunctionFromTag<TTag extends keyof JSX.IntrinsicElements> {
  <TProps extends unknown>(
    // Allows either string or object (`` or ({}))
    css: TemplateStringsArray,
    ...interpoltations: Interpolations<TProps>
  ): Component<TProps & JSX.IntrinsicElements[TTag] & StyledProps>;
}

export interface StyledFunctionFromComponent<TInheritedProps extends unknown> {
  <TProps extends unknown>(
    // Allows either string or object (`` or ({}))
    css: TemplateStringsArray,
    ...interpoltations: Interpolations<TProps>
  ): Component<TProps & StyledProps & TInheritedProps>;
}

export type StyledComponentMap = {
  // This creates the DOM element types for `styled.blah`, e.g. `span`, `div`, `h1`, etc.
  [Tag in keyof JSX.IntrinsicElements]: StyledFunctionFromTag<Tag>;
};

export interface StyledComponentInstantiator extends StyledComponentMap {
  /**
   * Typing to enable consumers to compose components, e.g: `styled(Component)`
   */
  <TInheritedProps extends unknown>(
    Component: Component<TInheritedProps>
  ): StyledFunctionFromComponent<TInheritedProps>;
}

export const styled: StyledComponentInstantiator = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      return () => {
        // Blow up if the transformer isn't turned on.
        // This code won't ever be executed when setup correctly.
        console.error('webpack not run?', target, prop, receiver)
      };
    },
  }
) as any;

export const makeTheme = <T extends {}>(theme: T): T => { 
  console.log('initializing theme')
  return theme
};
