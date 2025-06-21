import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

// 언어 import (highlight.js/lib/languages/...)
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import jsx from 'highlight.js/lib/languages/javascript'; // JSX 따로 없음. JS가 대체
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import ocaml from 'highlight.js/lib/languages/ocaml';
import fsharp from 'highlight.js/lib/languages/fsharp';

// lowlight 인스턴스 생성
const lowlight = createLowlight();

// 언어 등록
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('jsx', jsx); // React 용도
lowlight.register('python', python);
lowlight.register('c', c);
lowlight.register('java', java);
lowlight.register('cpp', cpp);
lowlight.register('rust', rust);
lowlight.register('ocaml', ocaml);
lowlight.register('fsharp', fsharp);

// 확장 생성
export const CustomCodeBlock = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    return {
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
}).configure({
  lowlight,
  defaultLanguage: 'javascript',
});