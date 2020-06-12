/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

function mappings( state, { type, query, ...action } ) {
	if ( type === 'SET_MENU_ITEMS_TO_CLIENT_ID_MAPPING' ) {
		const { mapping } = action;
		const nextState = new EquivalentKeyMap( state );
		nextState.set( query, {
			menuItemIdToClientId: mapping,
		} );
		return nextState;
	}

	if ( type === 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID' ) {
		const { menuItemId, clientId } = action;
		const nextState = new EquivalentKeyMap( state );
		nextState.set( query, {
			menuItemIdToClientId: {
				...state.get( query )?.menuItemIdToClientId,
				[ menuItemId ]: clientId,
			},
		} );
		return nextState;
	}

	return state || new EquivalentKeyMap();
}

export default combineReducers( {
	mappings,
} );
