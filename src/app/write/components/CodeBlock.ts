// components/CodeBlock.ts
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';

// lowlight 인스턴스 생성
const lowlight = createLowlight();

// 원하는 언어 등록
lowlight.register('javascript', javascript);
lowlight.register('python', python);

export const CustomCodeBlock = CodeBlockLowlight.configure({
  lowlight,
});