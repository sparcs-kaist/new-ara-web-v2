// components/CodeBlock.ts
import CodeBlock from '@tiptap/extension-code-block';

export const CustomCodeBlock = CodeBlock.extend({
  addKeyboardShortcuts() {
    return {
      'Shift-Ctrl-\\': () => this.editor.commands.setNode('codeBlock'),
      Tab: () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.node();
        if (node.type.name === this.name) {
          dispatch(state.tr.insertText('\t', selection.from, selection.to));
          return true;
        }
        return false;
      },
    };
  },
});