// @flow

/**
 * What does it do?
 *
 * When typing `- ` or `* ` it should toggle a unordered list item
 * When typing `1. ` or any number, then period and space - an ordered list item.
 */

import { EditorState, RichUtils, SelectionState, Modifier } from 'draft-js';
import type { PluginsFns } from './utils';
import {
	getKeyAndOffset,
	extractListsInBlock,
	isSignOfUnorderedList,
	isSignOfOrderedList,
} from './utils';
import extractListInBlock from './extractListInBlock';
import removeList from './removeList';

export default () => {


	return {

		handleReturn(e : any, callbacks : PluginsFns) {
			return removeList(callbacks);
		},

		handleBeforeInput(typedChar: string, { getEditorState, setEditorState } : PluginsFns) {
			if (typedChar !== ' ') return false;

			const editorState = getEditorState();
			const { key } = getKeyAndOffset(editorState);
			const newState = extractListsInBlock(' ', editorState, key);

			if (newState) {
				setEditorState(newState);
				return true;
			}

			return false;
		},

		handleKeyCommand(command : string, callbacks : PluginsFns) {
			if (command !== 'backspace') return;
			return removeList(callbacks);
		},

		handlePastedText(text : any, html : any, callbacks : PluginsFns) {
			setTimeout(() => {
				const editorState = callbacks.getEditorState();
				const currentContent = editorState.getCurrentContent();
				const blockMap = currentContent.getBlockMap();
				const newState = blockMap.valueSeq().reduce((acc, currentBlock) => {
					return extractListsInBlock('', acc, currentBlock.key) || acc;
				}, editorState);

				callbacks.setEditorState(newState);
			});
		},

	};

};
