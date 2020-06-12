export function setMenuItemsToClientIdMapping( query, mapping ) {
	return {
		type: 'SET_MENU_ITEMS_TO_CLIENT_ID_MAPPING',
		query,
		mapping,
	};
}

export function assignMenuItemIdToClientId( query, menuItemId, clientId ) {
	return {
		type: 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID',
		query,
		menuItemId,
		clientId,
	};
}
