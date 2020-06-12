export function getMenuItemIdToClientIdMapping( state, query ) {
	return state.mappings?.get( query )?.menuItemIdToClientId;
}
