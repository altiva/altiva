/*

# Module specification:



*/


import { compile_flow } from './compile_flow'


const find_in_tree = function ( element, params ) {

	if ( element.type === 'VariableDeclaration' )
		return element.declarations.forEach( child => find_in_tree( child, params ) )

	if ( element.type === 'VariableDeclarator' ) {

		if ( element.init?.object?.object?.name === 'Al' && element.init?.object?.property?.name === 'component' )
			return params.found[ element.init.property.value ] = true;

		if ( element.init?.body?.body )
			return element.init?.body?.body.forEach( child => find_in_tree( child, params ) )
	}

	let item = element.consequent?.body || element.consequent?.declarations || element.body?.body

	if ( item )
		item.forEach( child => find_in_tree( child, params ) )

	item = element.alternate?.body || element.alternate?.declarations

	if ( item )
		return item.forEach( child => find_in_tree( child, params ) )

}

const subcomponents = async function ( state, next, end ) {

	const component = state.component
	const tree      = state.global.components[ component ].compiled.ast.instance?.content?.body

	// When there isn't a script content and body, just skip
	if (!tree) return next();
	
	const route     = state.route
	const params    = { component, route, state, found: {}, end }

	tree.forEach( element => find_in_tree( element, params ) )

	/* If no subcomponent was found, move forward */
	if ( Object.keys( params.found ).length == 0 )
		return next();

	/* Otherwise, save them on subcomponents property... */
	Object.assign( state.global.components[ component ].subcomponents, params.found )

	/* ...and compile them recursively */
	const subcomponents_flows = []

	for ( let subcomponent in params.found )
		subcomponents_flows.push( compile_flow( subcomponent, route, state.global, state.parent_end ) )

	await Promise.all( subcomponents_flows )

	next();
}

export { subcomponents }