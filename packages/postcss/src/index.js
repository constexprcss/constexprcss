const { AtRule, Declaration } = require("postcss");
module.exports = (opts = {}) => {
	// Work with options here

	if(!opts?.breakpoints) {
		throw 'invalid breakpoints config(undefined)'
	}

	const breakpointValues = Object.values(opts?.breakpoints)
	if(!breakpointValues || typeof breakpointValues != 'object' || breakpointValues.length < 2) {
		throw `invalid breakpoints config [${breakpointValues}] - need atleast two breakpoints to function`
	}

	return {
		postcssPlugin: "bp",
		AtRule: {
			media: (rule) => {
				for(const breakpointName in opts?.breakpoints) {
					if(rule?.params.includes(`$${breakpointName}`)) {
						rule.params = rule?.params.replace(`$${breakpointName}`, opts?.breakpoints[breakpointName])
					}
				}
			}
		},
		Declaration: function (decl) {
			var value = decl?.value

			if (!value) {
				return;
			}

			if (value.length < 5) {
				return;
			}

			const firstTwo = value.substr(0, 2)
			const lastTwo = value.substr(value.length - 2, value.length - 1)
			
			if(firstTwo != '((' || lastTwo != '))') {
			  return
			}

			
			value = value.substr( 2, value.length - 4 )
			const valueValues = value.split("\n").map((value) => value.trim()).filter((value) => value.length > 0);
			

			if(valueValues.length != breakpointValues.length) {
				console.error(`only [${valueValues.length}]/[${breakpointValues.length}] breakpoints specified.`, value, valueValues)
				return;
			}

			var i=0;
			for(const value of valueValues) {
				const isLastBreakpoint = i == valueValues.length - 1

				let params = ''

				// are we the first breakpoint? 
				if(i==0) {
					params = `only screen and (max-width: ${breakpointValues[i]})`
					//console.log('first...')
				} else if ( i > 0 && !isLastBreakpoint ) {
					// between two points
					params = `only screen and (min-width: ${breakpointValues[i - 1]}) and (max-width: ${breakpointValues[i]})`
				} else {
					// last breakpoint
					params = `only screen and (min-width: ${breakpointValues[i - 1]})`
				}

				//console.log(params, value)

				decl.parent?.push(
					new AtRule({
						name: "media",
						params: params,
						nodes: [new Declaration({ prop: decl.prop, value })],
					})
				);

				i++;
			}

			decl.remove();
		},
	};
};
module.exports.postcss = true;
