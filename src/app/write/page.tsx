'use client'
import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { AttachmentsHandles } from './components/Attachments'
import TextEditor from '../../components/TextEditor/TextEditor'
import PostOptionBar from './components/PostOptionBar'
import Attachments, { UploadObject } from './components/Attachments'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { createPost } from '@/lib/api/post'
import { fetchBoardList } from '@/lib/api/board'

export type NameType = 'REGULAR' | 'ANONYMOUS' | 'REALNAME'

export default function Write() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor|null>(null);
  const attachmentsRef = useRef<AttachmentsHandles|null>(null);

  // 1) BoardList API로 user_writable 게시판만 로드
  type ApiBoard = {
    id: number
    ko_name: string
    user_writable: boolean
    topics: Array<{ id: number; ko_name: string }>
  }

  const [boards, setBoards] = useState<ApiBoard[]>([])
  useEffect(() => {
    fetchBoardList()
      .then(data => setBoards(data.filter((b: ApiBoard) => b.user_writable)))
      .catch(console.error)
  }, [])

  const [title, setTitle] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [isSocial, setIsSocial] = useState(false);
  const [isSexual, setIsSexual] = useState(false);
  const [nameType, setNameType] = useState<NameType>('REGULAR');

  const [boardId, setBoardId] = useState<number>(7); // default : 자유게시판
  const [topicId, setTopicId] = useState<string>('');

  // TextEditor가 이미지 업로드 요청 시 호출
  const handleOpenImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 에디터 -> Attachments (업로드) -> 에디터 삽입
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploads = await attachmentsRef.current?.handleUpload(e.target.files);
    const editor = editorRef.current;
    if (!editor || !uploads) return;

    // 서버가 준 URL 을 바로 에디터에 삽입
    uploads.forEach(u => {
      editor
        .chain()
        .focus()
        .attachmentImage({
          src: u.url!,
          title: u.name,
          'data-attachment': u.key,
        })
        .run();
    });

    e.target.value = '';
  };

  // 삭제 시 에디터에서도 지우기
  const handleAttachmentDelete = (file: UploadObject) => {
    const editor = editorRef.current;
    if (!editor) return;

    const { state, view } = editor;
    state.doc.descendants(
      (node: ProseMirrorNode, pos: number) => {
        if (
          node.type.name === 'attachmentImage' &&
          node.attrs['data-attachment'] === file.key
        ) {
          const tr = view.state.tr.delete(pos, pos + node.nodeSize);
          view.dispatch(tr);
        }
      }
    );
  };

  // 게시글 저장 API 호출 핸들러
  const handleSavePost = async () => {
    if (!editorRef.current) return;
    setSaving(true);

    const content = editorRef.current.getHTML();
    const attachmentIds = attachmentsRef.current?.files.map(f => f.key) ?? [];
    const newArticle = {
      title,
      content,
      attachments: attachmentIds,
      parent_board: boardId,
      parent_topic: topicId,
      is_content_sexual: isSexual,
      is_content_social: isSocial,
      name_type: nameType,
    };

    try {
      const result = await createPost({ boardId, newArticle });
      alert(`글이 저장되었습니다 (ID: ${result.id})`);
    } catch (err) {
      console.error(err);
      alert('글 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">게시물 작성하기</p>
        <hr className="border-t border-gray-300 mb-6" />
        <PostOptionBar
          boards={boards}
          defaultBoardId={boardId}           // 부모의 state(boardId) 넘겨주기
          defaultCategoryId={topicId}        // topicId에도 똑같이
          onChangeBoard={(id) => {
            setBoardId(Number(id))
            setTopicId('')
          }}
          // categoryId는 string으로 관리하므로, number → string 변환
          onChangeCategory={(id) => {
            setTopicId(id ? String(id) : '')
          }}
           onChangeAnonymous={(anon) => {
             setNameType(anon ? 'ANONYMOUS' : 'REGULAR')
           }}
          onChangeSocial={(flag) => {
            setIsSocial(flag);
          }}
          onChangeSexual={(flag) => {
            setIsSexual(flag);
          }}
        />

        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.currentTarget.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        />

        <TextEditor
          editable={true}
          onOpenImageUpload={handleOpenImageUpload}
          ref={editorRef}
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />

        <Attachments
          ref={attachmentsRef}
          onDelete={handleAttachmentDelete}
        />

        {/* 저장 버튼 */}
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={handleSavePost}
            className="
              px-4 py-2 bg-white text-[#ed3a3a] rounded-lg border border-spacing-2 border-gray-200
              hover:border-[#ed3a3a] hover:bg-[#ed3a3a] hover:text-white
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            disabled={saving}
          >
            {saving ? '게시글 등록중...' : '게시글 등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
 }
