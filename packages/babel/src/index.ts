import { declare } from "@babel/helper-plugin-utils";
// @ts-ignore
import jsxSyntax from '@babel/plugin-syntax-jsx';
import { ImportSpecifier } from "typescript";

import generate from '@babel/generator'
import template from '@babel/template'

import * as t from '@babel/types';
import { hash } from "./utils";
import { generateVarName } from "./themeGenerator";

// @ts-ignore
const plugin: any = declare((api) => {
	api.assertVersion(7);

	return {
		name: "nuiga",
		inherits: jsxSyntax,
		visitor: {
			CallExpression(path, state) {
				// get the function being called
				const callee = path.get('callee');

				// get function name
				// @ts-ignore
				const calleeName = callee?.node?.name;
				// check if the function being called is makeTheme
				if (calleeName !== 'makeTheme') {
					return
				}

				const code = generate(path.node.arguments[0]).code

				// TODO!: This is not a secure way to do this.
				const obj = new Function(`return ${code}`)()

				// loop through each object in the theme, and generate the keys / css var names
				function loop(obj: any, prefix: string = '', originalPrefix: string = '', onFind: (key: string, value: any) => void) {
					for (const key in obj) {
						if (typeof obj[key] === 'object') {
							loop(obj[key], `${key}`, originalPrefix, onFind)
						} else {
							onFind(`${originalPrefix}.${prefix}.${key}`, obj[key])
						}
					}
				}

				let css = ':root { /*theme*/\n'
				loop(obj, '', 'theme', (key, value) => {
					const hashKey = hash(key)
					css += `${generateVarName(key)}: ${value};\n`
				})
				css += '}\n'

				// @ts-ignore
				if(this?.opts?.onCss) {
					// @ts-ignore
					this.opts.onCss(css, hash(css));
				}
			},
			ImportDeclaration(path, state) {
				if (path.node.source.value !== '@constexprcss/react' && path.node.source.value !== '@constexprcss/solidjs') {
					return;
				}

				state.imported = path.get('specifiers').some((specifier: any) => {
					return specifier.node?.imported?.name == 'styled'
				})
			},
			TaggedTemplateExpression(path, state) {
				
				// libary not included in the file, we're clearly not using constexprcss

				if (!state.imported) {
					return
				}

				const node = path.node
				// @ts-ignore
				const tagName = node?.tag?.property?.name;

				var timeNow = Date.now()
				// get raw css
				const _rawCss = generate(node?.quasi).code;
				let css = _rawCss.substring(1, _rawCss.length - 1)
				const cssHash = hash(css)

				//var css = node?.quasi?.quasis.map((q) => q?.value?.raw).join('')
				if(!css) {
					console.error('invalid cssnode.')
					return;
				}

				// find theme interceptions
				const varInterceptions = css.matchAll(/\$\{(.*?)}/gm) || []
				for(const match of varInterceptions) {
					// replace var with hash, css value
					const replaceString = `var(${generateVarName(match[1])})`
					css = css.replace(match[0], replaceString)
				}

				// Handle interpolated vars.
				let interpolatedVars: string[] = []
				if(node?.typeParameters?.params) {
					for(const param of node?.typeParameters?.params) {
						if(param.type != 'TSTypeLiteral') {
							console.error('we only support TSTypeLiteral as prop interface. Example: styled.div<{width: number, height: number}>`width: $width; height: $height;`')
							continue 
						}

						const signatures = param?.members.filter(member=>member.type == 'TSPropertySignature')
						for(const memberSig of signatures) {
							interpolatedVars.push(
								//@ts-ignore
								memberSig.key.name
							)
						}
					}
				}



				const interpolatedIfClasses: string[] = []
				// replace interpolated vars
				for(const iVar of interpolatedVars) {
					css = css.replace(`(${iVar})`, `var(--${cssHash + hash(iVar)})`)

					// does ::var exist?
					if(css.includes(`::${iVar}`)) {
						interpolatedIfClasses.push(`${iVar}`)
						css = css.replace(`::${iVar}`, `&.${hash(iVar)}`)
					}
				}

				var optionalClassNames = ''
				if(interpolatedIfClasses.length) {
					optionalClassNames += interpolatedIfClasses.map(_var => `\$\{props?.${_var} ? "${hash(_var)} " : " " \}`).join('')
				}

				let ast: t.Node

				// @ts-ignore
				const framework: 'react' | 'solidjs' = this?.opts?.framework ?? "react"
				if(framework == 'react') {
					
					const refComponent = template(`
						React.forwardRef(( props, ref ) => (
							<${tagName}
								ref={ref} 
								className={\`${cssHash} ${optionalClassNames}\`}
								{...props} 
								{...{style: {
									${
										interpolatedVars.map(iVar => `'--${cssHash + hash(iVar)}': props.${iVar}`).join(', ')
									}
									${interpolatedVars?.length ? ',' : ''} 
									...props.style
								}}}
							/>
						))
					`, {
						plugins: ['jsx']
					})	

					ast = refComponent() as t.Node
				}
				else if(framework == 'solidjs') {
					const refComponent = template(`
						(props) => <${tagName} 
						className={\`${cssHash} ${optionalClassNames}\`}
						{...props} 
						{...{style: {
							${
								interpolatedVars.map(iVar => `'--${cssHash + hash(iVar)}': props.${iVar}`).join(', ')
							}
							${interpolatedVars?.length ? ',' : ''} 
							...props.style
						}}}
						/>
					`, {
						plugins: ['jsx']
					})	

					ast = refComponent() as t.Node
				} else {
					throw 'invalid framework..'
				}

				path.replaceWith(ast)

				css = `.${cssHash} {${css}}`

				// @ts-ignore
				if(this?.opts?.onCss) {
					// @ts-ignore
					this.opts.onCss(css, cssHash);
				}
			}
		},
	};
});

export default plugin