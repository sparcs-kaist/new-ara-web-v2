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

  // node를 사용하지 않을 때 구조분해 할당에서 _로 이름만 바꿔주면 됩니다.
  renderHTML({ node: _, HTMLAttributes }) {
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