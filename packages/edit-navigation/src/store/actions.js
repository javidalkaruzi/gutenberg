/**
 * External dependencies
 */
import { invert, keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { select, getNavigationPost, dispatch, apiFetch } from './controls';
import { uuidv4 } from './utils';

export function setMenuItemsToClientIdMapping( menuId, mapping ) {
	return {
		type: 'SET_MENU_ITEMS_TO_CLIENT_ID_MAPPING',
		menuId,
		mapping,
	};
}

export function assignMenuItemIdToClientId( menuId, menuItemId, clientId ) {
	return {
		type: 'ASSIGN_MENU_ITEM_ID_TO_CLIENT_ID',
		menuId,
		menuItemId,
		clientId,
	};
}

// Hits POST /wp/v2/menu-items once for every Link block that doesn't have an
// associated menu item. (IDK what a good name for this is.)
export const createMissingMenuItems = serializeProcessing( function* (
	menuId
) {
	const query = { menus: menuId, per_page: -1 };
	const post = yield getNavigationPost( menuId );
	const mapping = yield select(
		'core/edit-navigation',
		'getMenuItemIdToClientIdMapping',
		menuId
	);
	const clientIdToMenuId = invert( mapping );

	const stack = [ post.blocks[ 0 ] ];
	while ( stack.length ) {
		const block = stack.pop();
		if ( ! ( block.clientId in clientIdToMenuId ) ) {
			const menuItem = yield apiFetch( {
				path: `/__experimental/menu-items`,
				method: 'POST',
				data: {
					title: 'Placeholder',
					url: 'Placeholder',
					menu_order: 0,
				},
			} );

			yield dispatch(
				'core/edit-navigation',
				'assignMenuItemIdToClientId',
				menuId,
				menuItem.id,
				block.clientId
			);
			const menuItems = yield select( 'core', 'getMenuItems', query );
			yield dispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ ...menuItems, menuItem ],
				query,
				false
			);
		}
		stack.push( ...block.innerBlocks );
	}
} );

export const saveMenuItems = serializeProcessing( function* ( menuId ) {
	const query = { menus: menuId, per_page: -1 };
	const post = yield getNavigationPost( menuId );
	const menuItems = yield select( 'core', 'getMenuItems', query );
	const mapping = yield select(
		'core/edit-navigation',
		'getMenuItemIdToClientIdMapping',
		menuId
	);

	const menuItemsByClientId = mapMenuItemsByClientId( menuItems, mapping );
	try {
		yield* batchSave( query.menus, menuItemsByClientId, post.blocks[ 0 ] );
		yield dispatch(
			'core/notices',
			'createSuccessNotice',
			__( 'Navigation saved.' ),
			{
				type: 'snackbar',
			}
		);
	} catch ( e ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			__( 'There was an error.' ),
			{
				type: 'snackbar',
			}
		);
	}
} );

function mapMenuItemsByClientId( menuItems, clientIdsByMenuId ) {
	const result = {};
	if ( ! menuItems || ! clientIdsByMenuId ) {
		return result;
	}
	for ( const menuItem of menuItems ) {
		const clientId = clientIdsByMenuId[ menuItem.id ];
		if ( clientId ) {
			result[ clientId ] = menuItem;
		}
	}
	return result;
}

function* batchSave( menuId, menuItemsByClientId, navigationBlock ) {
	const { nonce, stylesheet } = yield apiFetch( {
		path: '/__experimental/customizer-nonces/get-save-nonce',
	} );

	// eslint-disable-next-line no-undef
	const body = new FormData();
	body.append( 'wp_customize', 'on' );
	body.append( 'customize_theme', stylesheet );
	body.append( 'nonce', nonce );
	body.append( 'customize_changeset_uuid', uuidv4() );
	body.append( 'customize_autosaved', 'on' );
	body.append( 'customize_changeset_status', 'publish' );
	body.append( 'action', 'customize_save' );
	body.append(
		'customized',
		computeCustomizedAttribute(
			navigationBlock.innerBlocks,
			menuId,
			menuItemsByClientId
		)
	);

	yield apiFetch( {
		url: '/wp-admin/admin-ajax.php',
		method: 'POST',
		body,
	} );
}

function computeCustomizedAttribute( blocks, menuId, menuItemsByClientId ) {
	const blocksList = blocksTreeToFlatList( blocks );
	const dataList = blocksList.map( ( { block, parentId, position } ) =>
		linkBlockToRequestItem( block, parentId, position )
	);

	// Create an object like { "nav_menu_item[12]": {...}} }
	const computeKey = ( item ) => `nav_menu_item[${ item.id }]`;
	const dataObject = keyBy( dataList, computeKey );

	// Deleted menu items should be sent as false, e.g. { "nav_menu_item[13]": false }
	for ( const clientId in menuItemsByClientId ) {
		const key = computeKey( menuItemsByClientId[ clientId ] );
		if ( ! ( key in dataObject ) ) {
			dataObject[ key ] = false;
		}
	}

	return JSON.stringify( dataObject );

	function blocksTreeToFlatList( innerBlocks, parentId = 0 ) {
		return innerBlocks.flatMap( ( block, index ) =>
			[ { block, parentId, position: index + 1 } ].concat(
				blocksTreeToFlatList(
					block.innerBlocks,
					getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	function linkBlockToRequestItem( block, parentId, position ) {
		const menuItem = omit( getMenuItemForBlock( block ), 'menus', 'meta' );
		return {
			...menuItem,
			position,
			title: block.attributes?.label,
			url: block.attributes.url,
			original_title: '',
			classes: ( menuItem.classes || [] ).join( ' ' ),
			xfn: ( menuItem.xfn || [] ).join( ' ' ),
			nav_menu_term_id: menuId,
			menu_item_parent: parentId,
			status: 'publish',
			_invalid: false,
		};
	}

	function getMenuItemForBlock( block ) {
		return omit( menuItemsByClientId[ block.clientId ] || {}, '_links' );
	}
}

function serializeProcessing( callback ) {
	return function* ( menuId ) {
		const isProcessing = yield select(
			'core/edit-navigation',
			'isProcessingMenuItems',
			menuId
		);
		if ( isProcessing ) {
			yield dispatch(
				'core/edit-navigation',
				'enqueueAfterProcessing',
				menuId,
				callback
			);
			return { status: 'pending' };
		}

		yield dispatch(
			'core/edit-navigation',
			'startProcessingMenuItems',
			menuId
		);

		try {
			yield* callback( menuId );
		} finally {
			yield dispatch(
				'core/edit-navigation',
				'finishProcessingMenuItems',
				menuId
			);

			const pendingActions = yield select(
				'core/edit-navigation',
				'getPendingActions',
				menuId
			);
			if ( pendingActions.length ) {
				yield* pendingActions[ 0 ]( menuId );
			}
		}
	};
}

export function startProcessingMenuItems( menuId ) {
	return {
		type: 'START_PROCESSING_MENU_ITEMS',
		menuId,
	};
}

export function finishProcessingMenuItems( menuId ) {
	return {
		type: 'FINISH_PROCESSING_MENU_ITEMS',
		menuId,
	};
}

export function enqueueAfterProcessing( menuId, action ) {
	return {
		type: 'ENQUEUE_AFTER_PROCESSING',
		menuId,
		action,
	};
}
