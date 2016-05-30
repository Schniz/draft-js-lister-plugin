## draft-js-lister-plugin
Adds support for automatic `ul` and `ol` in your `draft-js-plugins` `<Editor />`!

![kaki](docs/demo.gif)

## Support
- Starting a line with `-` or `*` and space afterwards, creates a new `ul`.
- Starting a line with a `<NUMBER>.<SPACE>` creates a new `ol`.
- Pasting from text editors works too

## Installation :hamburger:
```bash
npm install --save draft-js-lister-plugin
```

## Usage:

```js
import React from 'react';
import Editor from 'draft-js-plugins-editor';
import createListerPlugin from 'draft-js-lister-plugin';

const listerPlugin = createListerPlugin();

const MyEditor = ({ editorState, onChange }) => (
  <div>
    <Editor
      editorState={ editorState }
      onChange={ onChange }
      plugins={ [listerPlugin] }
    />
    <EmojiSuggestions />
  </div>
);

export default MyEditor;
```
