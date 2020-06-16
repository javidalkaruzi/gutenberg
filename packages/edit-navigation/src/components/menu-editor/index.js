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
import { useDispatch, useSelect } from '@wordpress/data';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const post = useSelect( ( select ) =>
		select( 'core/edit-navigation' ).getNavigationPost( menuId )
	);

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			{ post && (
				<NavigationBlockEditorProvider
					post={ post }
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ onDeleteMenu }
				/>
			) }
		</div>
	);
}

const NavigationBlockEditorProvider = ( {
	post,
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) => {
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ blocks, onInput, onChange ] = useNavigationBlockEditor( post );
	const { saveMenuItems } = useDispatch( 'core/edit-navigation' );
	const save = () => saveMenuItems( post );
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
			<MenuEditorShortcuts saveBlocks={ save } />
			<NavigationStructureArea
				blocks={ blocks }
				initialOpen={ isLargeViewport }
			/>
			<BlockEditorArea
				saveBlocks={ save }
				menuId={ menuId }
				onDeleteMenu={ onDeleteMenu }
			/>
		</BlockEditorProvider>
	);
};
