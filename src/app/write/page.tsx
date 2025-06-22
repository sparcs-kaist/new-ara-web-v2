'use client';
import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { AttachmentsHandles } from './components/Attachments';
import TextEditor from './components/TextEditor';
import PostOptionBar from './components/PostOptionBar';
import Attachments, { UploadObject } from './components/Attachments';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { createPost } from '@/lib/api/post';

export type NameType = 'REGULAR' | 'ANONYMOUS' | 'REALNAME';

export default function Write() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor|null>(null);
  const attachmentsRef = useRef<AttachmentsHandles|null>(null);

  // 1) boardId state & 이름→ID 맵
  const [boardId, setBoardId] = useState<number>(2);
  const boardIdMap: Record<string, number> = {
    '포탈공지': 1,
    '학생단체': 2,
    '구인구직': 3,
    '장터': 4,
    '입주업체 피드백': 5,
    '자유게시판': 7,
    '운영진 공지': 8,
    '아라 피드백': 10,
    '입주 업체 공지': 11,
    '동아리': 12,
    '부동산': 13,
    '학교에게 전합니다': 14,
    '카이스트 뉴스': 17,
    '외부 업체 홍보': 18,
  };

  const [title, setTitle] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [isSocial, setIsSocial] = useState(false);
  const [isSexual, setIsSexual] = useState(false);
  const [nameType, setNameType] = useState<NameType>('REGULAR');

  // Topic ID 상태 (말머리)
  const [topicId, setTopicId] = useState<string>('');

  // 보드별 말머리 이름→ID 매핑
  const topicMap: Record<number, Record<string, number>> = {
    2: { 총학: 1, 동연: 2, 생자회: 3, 학복위: 4, 새학: 5, 공간위: 6, 협동조합: 7, 원총: 24 },
    3: { 과외: 14, 인턴: 15, 채용: 16, 실험: 17, 기숙사: 18 },
    4: { 부동산: 20, 삽니다: 21, 팝니다: 22 },
    5: { 이벤트: 23 },
    7: { 분실물: 10, 연애: 11, 게임: 12, 돈: 13 },
  };

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
      parent_topic: topicId,   // 말머리 ID 반영
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
          onChangeBoard={(board) => {
            const id = boardIdMap[board.trim()];
            if (id !== undefined) {
              setBoardId(id);
              setTopicId('');  // 보드 변경 시 말머리 초기화
            }
          }}
          onChangeCategory={(category) => {
            const name = category.trim();
            // 말머리 없음 선택 시 빈 문자열
            if (name === '말머리 없음' || name === '') {
              setTopicId('');
            } else {
              const id = topicMap[boardId]?.[name];
              setTopicId(id ? String(id) : '');
            }
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
              px-4 py-2 bg-blue-500 text-white rounded
              hover:bg-blue-600 transition
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            disabled={saving}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
 }
