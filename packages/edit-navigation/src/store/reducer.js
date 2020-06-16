/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

function mappings( state, { type, menuId, ...action } ) {
	if ( type === 'SET_MENU_ITEMS_TO_CLIENT_ID_MAPPING' ) {
		const { mapping } = action;
		const nextState = new EquivalentKeyMap( state );
		nextState.set( menuId, {
			menuItemIdToClientId: mapping,
		} );
		return nextState;
	}

	if ( type === 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID' ) {
		const { menuItemId, clientId } = action;
		const nextState = new EquivalentKeyMap( state );
		nextState.set( menuId, {
			menuItemIdToClientId: {
				...state.get( menuId )?.menuItemIdToClientId,
				[ menuItemId ]: clientId,
			},
		} );
		return nextState;
	}

	return state || new EquivalentKeyMap();
}

function processing( state, { type, menuId, ...rest } ) {
	switch ( type ) {
		case 'START_PROCESSING_MENU_ITEMS':
			state[ menuId ] = {
				...state[ menuId ],
				inProgress: true,
			};
			break;
		case 'FINISH_PROCESSING_MENU_ITEMS':
			state[ menuId ] = {
				...state[ menuId ],
				inProgress: false,
			};
			break;
		case 'ENQUEUE_AFTER_PROCESSING':
			const pendingActions = state[ menuId ]?.pendingActions || [];
			if ( ! pendingActions.includes( rest.action ) ) {
				state[ menuId ] = {
					...state[ menuId ],
					pendingActions: [ ...pendingActions, rest.action ],
				};
			}
			break;
	}

	return state || {};
}

export default combineReducers( {
	mappings,
	processing,
} );
