/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { KIND, POST_TYPE, buildNavigationPostId } from './utils';

export function getPendingActions( state, menuId ) {
	return state.processing[ menuId ]?.pendingActions || [];
}

export function isProcessingMenuItems( state, menuId ) {
	return state.processing[ menuId ]?.inProgress;
}

export function getMenuItemIdToClientIdMapping( state, menuId ) {
	return state.mappings?.get( menuId )?.menuItemIdToClientId;
}

export const getNavigationPost = createRegistrySelector(
	( select ) => ( state, menuId ) => {
		return select( 'core' ).getEditedEntityRecord(
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId )
		);
	}
);
