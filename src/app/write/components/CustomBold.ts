// components/CustomBold.ts
import { Mark } from '@tiptap/core'

export const CustomBold = Mark.create({
  name: 'bold',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { tag: 'strong' },
      { tag: 'b', getAttrs: node => (node as HTMLElement).style.fontWeight !== 'normal' && null },
      { style: 'font-weight', getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['strong', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      toggleBold:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleBold(),
    };
  },

  addAttributes() {
    return {
      style: {
        default: null,
        renderHTML: attributes => {
          return {
            style: attributes.style || null,
          };
        },
      },
    };
  },
});
