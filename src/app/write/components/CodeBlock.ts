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

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      {
        ...HTMLAttributes,
        class:
          'bg-gray-100 rounded px-4 py-2 overflow-x-auto whitespace-pre-wrap',
      },
      [
        'code',
        {
          class: 'text-pink-500 font-mono text-sm',
        },
        0,
      ],
    ];
  },
});