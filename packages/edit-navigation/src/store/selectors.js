export function getClientIdsByMenuId( state, query ) {
	return state.mappings?.get( query )?.clientIdByMenuItemId;
}
