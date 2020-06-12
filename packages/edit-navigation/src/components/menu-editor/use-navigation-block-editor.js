/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useCreateMissingMenuItems from './use-create-missing-menu-items';
import batchSave from './batch-save';

export default function useNavigationBlockEditor( query, postId ) {
	const [ createMissingMenuItems, onCreated ] = useCreateMissingMenuItems(
		query
	);
	const saveMenuItems = useSaveMenuItems( query );
	const save = () => onCreated( () => saveMenuItems( blocks ) );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'postType',
		{ id: postId }
	);
	const onProviderChange = useCallback(
		( updatedBlocks ) => {
			onChange( updatedBlocks );
			createMissingMenuItems( blocks, updatedBlocks );
		},
		[ blocks, onChange, createMissingMenuItems ]
	);

	return [ blocks, onInput, onProviderChange, save ];
}

export function useSaveMenuItems( query ) {
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);
	const select = useSelect( ( s ) => s );
	const saveBlocks = async ( blocks ) => {
		const menuItemsByClientId = mapMenuItemsByClientId(
			select( 'core' ).getMenuItems( query ),
			select( 'core/edit-navigation' ).getMenuItemIdToClientIdMapping(
				query
			)
		);

		const result = await batchSave(
			query.menus,
			menuItemsByClientId,
			blocks[ 0 ]
		);

		if ( result.success ) {
			createSuccessNotice( __( 'Navigation saved.' ), {
				type: 'snackbar',
			} );
		} else {
			createErrorNotice( __( 'There was an error.' ), {
				type: 'snackbar',
			} );
		}
	};

	return saveBlocks;
}

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
