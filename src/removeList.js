// @flow

import { RichUtils } from 'draft-js';
import type { PluginsFns } from './utils';
import { getKeyAndOffset } from './utils';

export default function removeList({ getEditorState, setEditorState } : PluginsFns) {
	const editorState = getEditorState();
	const { key, offset } = getKeyAndOffset(editorState);
	const block = editorState.getCurrentContent().getBlockMap().get(key);
	if (offset !== 0 || ['ordered-list-item', 'unordered-list-item'].indexOf(block.getType()) === -1) {
		return;
	}

	const newState = RichUtils.toggleBlockType(
		editorState,
		block.getType(),
	);

	setEditorState(newState);
	return true;
}

