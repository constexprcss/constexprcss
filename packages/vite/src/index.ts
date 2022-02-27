import type { Plugin } from 'vite'
import { parseAsync, transformFromAstAsync } from '@babel/core';
import {promises as fs} from 'fs'

type PluginConfig = {
  outCss?: string,
  framework?: 'react' | 'solidjs'
}

export const toURIComponent = (rule: string): string => {
  const component = encodeURIComponent(rule).replace(/!/g, '%21');

  return component;
};

const lastCssMap: {[key: string]: string} = {}

var cssOut = ''
var resetTimer: undefined | NodeJS.Timeout = undefined
export default (config: PluginConfig = {}): Plugin => {
  return {
    enforce: 'pre',
    transform: async (code, id) => {
    
      if(!id.endsWith('.tsx')) {
        return null
      }

      const ast = await parseAsync( code, {
        filename: id,
        caller: { name: 'compiled' },
        rootMode: 'upward-optional',
        presets: ['@babel/preset-react'],
        parserOpts: {
          plugins: ["jsx", "typescript"]
        },
      } )

      let cssNow = ''
      const result = await transformFromAstAsync(ast!, code, {
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        filename: id,
        plugins: [
          ['@constexprcss/babel-plugin', {
            framework: config?.framework || 'react',
            onCss: (css: string, cssHash: string) => {
              // is the css the theme?
              if(css.includes(':root { /*theme*/')) {
                // remove the theme from oldCss if exists
                cssOut = cssOut.replace(/:root { \/\*theme\*\/[^}]*}/gm, '')
              }
              
              cssOut += css


/*
              // can we find the last content from this file, in our buffer?
              const lastCss = lastCssMap[cssHash]
              const inc = cssOut.includes(lastCss)
              if(lastCss && cssOut.includes(lastCss)) {
                console.log('removed last css..?')
                cssOut = cssOut.replace(lastCss, css)
              } else {
                cssOut+=`\n${css}`
              }
              lastCssMap[cssHash] = css
              //console.log(lastCssMap[cssHash], inc, id, cssHash)*/

              if(config.outCss) {
                fs.writeFile(config.outCss, cssOut)
              }
            }
          }]
        ]		
      })

      

      return {
        'code': result?.code ?? code,
        'map': result?.map ?? null,
      }
    },
    name: 'yeet'
  };
}

function createFilter(include: any, exclude: any) {
  throw new Error('Function not implemented.');
}
