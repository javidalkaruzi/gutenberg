/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MenuEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';
import useNavigationBlockEditor from './use-navigation-block-editor';
import useStubPost from './use-stub-post';
import { useMemo } from '@wordpress/element';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );
	const stubPostReady = useStubPost( query );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			{ stubPostReady && (
				<NavigationBlockEditorProvider
					query={ query }
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ onDeleteMenu }
				/>
			) }
		</div>
	);
}

const NavigationBlockEditorProvider = ( {
	query,
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) => {
	const isLargeViewport = useViewportMatch( 'medium' );
	const [
		blocks,
		onInput,
		onChange,
		saveMenuItems,
	] = useNavigationBlockEditor( query );
	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ {
				...blockEditorSettings,
				templateLock: 'all',
				hasFixedToolbar: true,
			} }
		>
			<BlockEditorKeyboardShortcuts />
			<MenuEditorShortcuts saveBlocks={ saveMenuItems } />
			<NavigationStructureArea
				blocks={ blocks }
				initialOpen={ isLargeViewport }
			/>
			<BlockEditorArea
				saveBlocks={ saveMenuItems }
				menuId={ menuId }
				onDeleteMenu={ onDeleteMenu }
			/>
		</BlockEditorProvider>
	);
};
