/**
 * External dependencies
 */
import { invert } from 'lodash';
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
			menuItemIdByClientId: mapping,
			clientIdByMenuItemId: invert( mapping ),
		} );
		return nextState;
	}

	if ( type === 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID' ) {
		const { menuItemId, clientId } = action;
		const menuItemIdByClientId = {
			...state.get( query )?.menuItemIdByClientId,
			[ menuItemId ]: clientId,
		};
		const nextState = new EquivalentKeyMap( state );
		nextState.set( query, {
			menuItemIdByClientId,
			clientIdByMenuItemId: invert( menuItemIdByClientId ),
		} );
		return nextState;
	}

	return state || new EquivalentKeyMap();
}

export default combineReducers( {
	mappings,
} );
