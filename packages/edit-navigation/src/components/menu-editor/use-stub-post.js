/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createNavigationBlock from './create-navigation-block';

export default function useStubPost( query ) {
	const [ postId, setPostId ] = useState( false );
	const menuItems = useFetchMenuItems( query );
	const { receiveEntityRecords } = useDispatch( 'core' );
	const { setMenuItemsToClientIdMapping } = useDispatch(
		'core/edit-navigation'
	);
	useEffect( () => {
		setPostId( null );
		if ( menuItems === null ) {
			return;
		}
		const [ navigationBlock, menuItemIdToClientId ] = createNavigationBlock(
			menuItems
		);
		setMenuItemsToClientIdMapping( query, menuItemIdToClientId );

		const post = createStubPost( query.menus, navigationBlock );
		const entityStored = receiveEntityRecords(
			'root',
			'postType',
			post,
			{ id: post.id },
			false
		);
		entityStored.then( () => {
			setPostId( post.id );
		} );
	}, [ menuItems === null, query ] );
	return postId;
}

function createStubPost( menuId, navigationBlock ) {
	const POST_ID = `navigation-post-${ menuId }`;
	return {
		id: POST_ID,
		slug: POST_ID,
		generated_slug: POST_ID,
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
