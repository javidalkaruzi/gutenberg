/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createNavigationBlock from './create-navigation-block';

export const DRAFT_POST_ID = 'navigation-post';

export default function useStubPost( query ) {
	const [ stubPostInitialized, setStubPostInitialized ] = useState( false );
	const menuItems = useFetchMenuItems( query );
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { setMenuItemsToClientIdMapping } = useDispatch(
		'core/edit-navigation'
	);
	useEffect( () => {
		if ( menuItems === null ) {
			return;
		}
		const [ navigationBlock, menuItemIdToClientId ] = createNavigationBlock(
			menuItems
		);
		setMenuItemsToClientIdMapping( query, menuItemIdToClientId );

		const post = createStubPost( navigationBlock );
		receiveEntityRecords(
			'root',
			'postType',
			post,
			{ id: DRAFT_POST_ID },
			false
		).then( () => {
			setStubPostInitialized( true );
		} );
	}, [ menuItems === null, query ] );
	return stubPostInitialized;
}

function createStubPost( navigationBlock ) {
	return {
		id: DRAFT_POST_ID,
		slug: DRAFT_POST_ID,
		generated_slug: DRAFT_POST_ID,
		status: 'draft',
		type: 'page',
		blocks: [ navigationBlock ],
	};
}

export function useFetchMenuItems( query ) {
	const { menuItems, isResolving } = useSelect( ( select ) => ( {
		menuItems: select( 'core' ).getMenuItems( query ),
		isResolving: select( 'core/data' ).isResolving(
			'core',
			'getMenuItems',
			[ query ]
		),
	} ) );

	const [ resolvedMenuItems, setResolvedMenuItems ] = useState( null );

	useEffect( () => {
		if ( isResolving || menuItems === null ) {
			return;
		}

		setResolvedMenuItems( menuItems );
	}, [ isResolving, menuItems ] );

	return resolvedMenuItems;
}
