import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
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

const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'react',
  'python',
  'java',
  'c',
  'cpp',
  'rust',
  'ocaml',
  'fsharp',
];

const CustomComponent = (props: any) => {
  const currentLang = props.node.attrs.language || 'javascript';

  return (
    <NodeViewWrapper as="div" className="relative group">
      <select
        value={currentLang}
        onChange={(e) =>
          props.updateAttributes({ language: e.target.value })
        }
        className="absolute left-2 top-2 z-10 text-xs 
        rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity 
        bg-transparent border-none shadow-none
        focus:outline-none focus:border-none"
      >
        {CODE_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CustomComponent);
  },
}).configure({
  lowlight,
});