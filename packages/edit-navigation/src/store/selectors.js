/**
 * Returns a block's name given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {Object} state    Editor state.
 * @param query
 * @param {string} clientId Block client ID.
 * @return {string} Block name.
 */
export function getMenuItemId( state, query, clientId ) {
	return state.mappings?.get( query )?.menuItemIdByClientId[ clientId ];
}
/**
 * Returns a block's name given its client ID, or null if no block exists with
 * the client ID.
 *
 * @param {Object} state    Editor state.
 * @param {string} clientId Block client ID.
 * @param query
 * @return {string} Block name.
 */
export function getMenuItemIdsByClientId( state, query ) {
	return state.mappings?.get( query )?.menuItemIdByClientId;
}

export function getClientIdsByMenuId( state, query ) {
	return state.mappings?.get( query )?.clientIdByMenuItemId;
}
