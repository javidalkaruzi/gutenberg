/**
 * WordPress dependencies
 */
import { default as triggerApiFetch } from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';

/**
 * Trigger an API Fetch request.
 *
 * @param {Object} request API Fetch Request Object.
 * @return {Object} control descriptor.
 */
export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

/**
 * Calls a selector using the current state.
 *
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( selectorName, ...args ) {
	return {
		type: 'SELECT',
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry select that has a
 * resolver.
 *
 * @param {string}  selectorName
 * @param {Array}   args  Arguments for the select.
 *
 * @return {Object} control descriptor.
 */
export function resolveSelect( selectorName, ...args ) {
	return {
		type: 'RESOLVE_SELECT',
		selectorName,
		args,
	};
}

export function dispatch( actionName, ...args ) {
	return {
		type: 'DISPATCH',
		actionName,
		args,
	};
}

const controls = {
	API_FETCH( { request } ) {
		return triggerApiFetch( request );
	},

	SELECT: createRegistryControl(
		( registry ) => ( { selectorName, args } ) => {
			const [ registryName, resolvedSelectorName ] = resolveRegistryName(
				selectorName
			);
			return registry
				.select( registryName )
				[ resolvedSelectorName ]( ...args );
		}
	),

	DISPATCH: createRegistryControl(
		( registry ) => ( { actionName, args } ) => {
			const [ registryName, resolvedActionName ] = resolveRegistryName(
				actionName
			);
			return registry
				.dispatch( registryName )
				[ resolvedActionName ]( ...args );
		}
	),

	RESOLVE_SELECT: createRegistryControl(
		( registry ) => ( { selectorName, args } ) => {
			return registry
				.__experimentalResolveSelect( 'core' )
				[ selectorName ]( ...args );
		}
	),
};

export default controls;

const resolveRegistryName = ( selectorName ) => {
	if ( ! selectorName.includes( '/' ) ) {
		return [ 'core', selectorName ];
	}
	const parts = selectorName.split( '/' );
	return [
		parts.slice( 0, parts.length - 1 ).join( '/' ),
		parts[ parts.length - 1 ],
	];
};
