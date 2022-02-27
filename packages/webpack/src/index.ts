import * as webpack from 'webpack'
import { parseAsync, transformFromAstAsync } from '@babel/core';

/**
 * Constexprcss webpack loader.
 *
 * @param this
 * @param code
 */
var listening = false;
var cssOut = ''

export default async function compiledLoader(
	this: any,
	code: string
  ): Promise<void> {
	const callback = this.async();
	if(!listening) {
		this._compiler.hooks.afterDone.tap('@constexprcss', () => {
			
		})
		listening = true;
	}

	if(!code.includes('@constexprcss/react')) {
		return callback(null, code);
	}

	// parse this file
	const ast = await parseAsync( code, {
		filename: this.resourcePath,
		caller: { name: '@constexprcss' },
		rootMode: 'upward-optional'
	} )

	const result = await transformFromAstAsync(ast!, code, {
		babelrc: false,
		configFile: false,
		sourceMaps: true,
		filename: this.resourcePath,
		plugins: [
			['@constexprcss/babel-plugin', {
				onCss: (css: string) => {
					cssOut+=`\n${css}`
				}
			}]
		]		
	})
	const output = result?.code

	return callback(null, output, result?.map ?? undefined);
}
  