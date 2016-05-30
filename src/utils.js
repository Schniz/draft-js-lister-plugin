// @flow

import { SelectionState, Modifier, RichUtils, EditorState } from 'draft-js';
import curry from 'curry';

export type PluginsFns = {
	getEditorState : (nothing: void) => any;
	setEditorState : (currentState : any) => any;
};

export function getKeyAndOffset(state : EditorState) {
	const selection = state.getSelection();
	const key = selection.getStartKey();
	const offset = selection.getStartOffset();
	return { key, offset };
}

export function selectRange(key : string, from : number, to : number) {
	return new SelectionState({
		anchorKey: key,
		anchorOffset: from,
		focusKey: key,
		focusOffset: to,
	});
}

export function replaceText(editorState : EditorState, key : string, from : number, to : number, newText : string) {
	const modifiedContents = Modifier.replaceText(
		editorState.getCurrentContent(),
		selectRange(key, from, to),
		newText
	);

	return EditorState.push(
		editorState,
		modifiedContents,
		'replace-text',
	);
}

export function setListBlock(editorState : EditorState, blockTypeToSet : string, key : string, textUntilSpace : string) : EditorState {
	const selection = editorState.getSelection();
	return EditorState.forceSelection(
		RichUtils.toggleBlockType(
			replaceText(
				editorState,
				key,
				0,
				textUntilSpace.length,
				''
			),
			blockTypeToSet
		),
		selection
	);
}

export function isSignOfUnorderedList(text : string) {
	return ['*', '-'].indexOf(text) !== -1;
}

export function isSignOfOrderedList(text : string) {
	return text.match(/^\d+\.$/);
}

export const extractListInBlock : Function = curry(
	function(predicateFn : Function, blockTypeToSet : string, append : string, editorState : EditorState, key : string) : void | EditorState {
		const block = editorState.getCurrentContent().getBlockMap().get(key);
		const blockText = block.getText() + append;
		const blockType = block.getType();
		const textUntilSpace = blockText.slice(0, blockText.indexOf(' '));

		if (predicateFn(textUntilSpace) && blockType !== blockTypeToSet) {
			return setListBlock(editorState, blockTypeToSet, key, textUntilSpace);
		}

		return null;
	}
);

const extractUnorderedListInBlock = extractListInBlock(isSignOfUnorderedList, 'unordered-list-item');
const extractOrderedListInBlock = extractListInBlock(isSignOfOrderedList, 'ordered-list-item');

/**
 * Extracts lists in a given block
 *
 * @param {string} append a string to append to the list (needed in onBeforeInput)
 * @param {EditorState} editorState current editor state
 * @param {string} key block key
 * @returns {void|EditorState} returns an EditorState if it should change the state; otherwise, returns null.
 */
export function extractListsInBlock(append : string, editorState : EditorState, key : string) : void | EditorState {
	const extracters = [extractUnorderedListInBlock, extractOrderedListInBlock].map(e => e(append));
	const hasNewState : void | EditorState = extracters.map(e => e(editorState, key)).filter(Boolean).reduce((acc, current) => {
		return current;
	}, null);
	return hasNewState;
}
