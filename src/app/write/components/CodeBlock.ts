import CodeBlock from '@tiptap/extension-code-block'

export const CustomCodeBlock = CodeBlock.extend({
  addKeyboardShortcuts() {
    return {
      'Shift-Ctrl-\\': () => this.editor.commands.setNode('codeBlock'),

      Tab: () => {
        const { state, dispatch } = this.editor.view
        const { selection } = state
        const { $from } = selection

        const node = $from.node()
        if (node.type.name === this.name) {
          const tr = state.tr.insertText('\t', selection.from, selection.to)
          dispatch(tr)
          return true
        }

        return false
      }
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          return {
            class: attributes.class,
          }
        }
      }
    }
  }
})
