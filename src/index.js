// @flow

/**
 * What does it do?
 *
 * When typing `- ` or `* ` it should toggle a unordered list item
 * When typing `1. ` or any number, then period and space - an ordered list item.
 */

import { EditorState, RichUtils, SelectionState, Modifier } from 'draft-js';
import { curry, identity } from 'ramda';

type PluginsFns = {
	getEditorState : (nothing: void) => any;
	setEditorState : (currentState : any) => any;
};

function replaceText(editorState : EditorState, key : string, from : number, to : number, newText : string) {
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

function setListBlock(editorState : EditorState, blockTypeToSet : string, key : string, textUntilSpace : string) : EditorState {
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

const extractListInBlock : Function = curry(
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

function getKeyAndOffset(state: any) {
	const selection = state.getSelection();
	const key = selection.getStartKey();
	const offset = selection.getStartOffset();
	return { key, offset };
}

function selectRange(key : string, from : number, to : number) {
	return new SelectionState({
		anchorKey: key,
		anchorOffset: from,
		focusKey: key,
		focusOffset: to,
	});
}

function isSignOfUnorderedList(text) {
	return ['*', '-'].indexOf(text) !== -1;
}

function isSignOfOrderedList(text) {
	return text.match(/^\d+\.$/);
}


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
function extractListsInBlock(append : string, editorState : EditorState, key : string) : void | EditorState {
	const extracters = [extractOrderedListInBlock, extractUnorderedListInBlock].map(e => e(append));
	const hasNewState : void | EditorState = extracters.map(e => e(editorState, key)).filter(identity).reduce((acc, current) => {
		return current;
	}, null);
	return hasNewState;
}

function removeList({ getEditorState, setEditorState } : PluginsFns) {
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

export default {

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
