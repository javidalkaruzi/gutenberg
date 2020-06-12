/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { flattenBlocks } from './helpers';
import PromiseQueue from './promise-queue';

/**
 * When a new Navigation child block is added, we create a draft menuItem for it because
 * the batch save endpoint expects all the menu items to have a valid id already.
 * PromiseQueue is used in order to
 * 1) limit the amount of requests processed at the same time
 * 2) save the menu only after all requests are finalized
 *
 * @param {Object} query
 * @return {function(*=): void} Function registering it's argument to be called once all menuItems are created.
 */
export default function useCreateMissingMenuItems( query ) {
	const storeSavedMenuItem = useStoreSavedMenuItem( query );
	return useProcessNewBlocks(
		query,
		createDraftMenuItem,
		storeSavedMenuItem
	);
}

function useProcessNewBlocks( query, processClientId, onClientIdProcessed ) {
	const promiseQueueRef = useRef();
	const processedClientIdsRef = useRef();
	useEffect( () => {
		if ( promiseQueueRef.current ) {
			promiseQueueRef.current.halt();
		}
		promiseQueueRef.current = new PromiseQueue( 5 );
		processedClientIdsRef.current = [];
	}, [ query ] );

	const processNewBlocks = useCallback(
		( previousBlocks, newBlocks ) => {
			const promiseQueue = promiseQueueRef.current;
			const processedClientIds = processedClientIdsRef.current;
			const delta = diffBlocks( previousBlocks, newBlocks );
			for ( const { clientId } of delta ) {
				if ( processedClientIds.includes( clientId ) ) {
					continue;
				}
				processedClientIds.push( clientId );
				promiseQueue.enqueue( () =>
					processClientId( clientId ).then( ( result ) => {
						if ( promiseQueue.halted ) {
							return;
						}
						onClientIdProcessed( clientId, result );
					} )
				);
			}
		},
		[ promiseQueueRef.current, processClientId, onClientIdProcessed ]
	);
	const onProcessed = useCallback(
		( callback ) => promiseQueueRef.current.then( callback ),
		[ promiseQueueRef.current ]
	);
	return [ processNewBlocks, onProcessed ];
}

function* diffBlocks( previousBlocks, newBlocks ) {
	const existingClientIds = flattenBlocks( previousBlocks ).map(
		( { clientId } ) => clientId
	);
	for ( const block of flattenBlocks( newBlocks ) ) {
		const { clientId, name } = block;
		// No need to create menuItems for the wrapping navigation block
		if ( name === 'core/navigation' ) {
			continue;
		}
		// Menu item was already created
		if ( existingClientIds.includes( clientId ) ) {
			continue;
		}
		yield block;
	}
}

function useStoreSavedMenuItem( query ) {
	const { assignMenuItemIdToClientId } = useDispatch(
		'core/edit-navigation'
	);
	const { receiveEntityRecords } = useDispatch( 'core' );
	const select = useSelect( ( s ) => s );
	return useCallback(
		( clientId, menuItem ) => {
			assignMenuItemIdToClientId( query, menuItem.id, clientId );
			receiveEntityRecords(
				'root',
				'menuItem',
				[ ...select( 'core' ).getMenuItems( query ), menuItem ],
				query,
				false
			);
		},
		[ query ]
	);
}

function createDraftMenuItem() {
	return apiFetch( {
		path: `/__experimental/menu-items`,
		method: 'POST',
		data: {
			title: 'Placeholder',
			url: 'Placeholder',
			menu_order: 0,
		},
	} );
}
