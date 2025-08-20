'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'; // useRouter import
import type { Editor } from '@tiptap/react'
import type { AttachmentsHandles } from './components/Attachments'
import TextEditor from '../../components/TextEditor/TextEditor'
import PostOptionBar from './components/PostOptionBar'
import Attachments, { UploadObject } from './components/Attachments'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { createPost, updatePost, fetchPost } from '@/lib/api/post'; // updatePost, fetchPost import
import { fetchBoardList } from '@/lib/api/board'
import { makeMarketMetadata, makePosterMetadata } from '@/lib/utils/article_metadata'
import Calendar from './components/Calendar/Calendar';

export type NameType = 'REGULAR' | 'ANONYMOUS' | 'REALNAME'

export default function Write() {
  const router = useRouter(); // useRouter 훅 사용
  const searchParams = useSearchParams();
  const editPostId = searchParams.get('edit');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const attachmentsRef = useRef<AttachmentsHandles | null>(null);
  const expirePopoverRef = useRef<HTMLDivElement>(null);

  // 1) BoardList API로 user_writable 게시판만 로드
  type ApiBoard = {
    id: number
    ko_name: string
    name_type: number           // 1=Regular, 3=Regular+Anonymous, 4=Realname only
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
  // 장터 전용 상태
  const [isMarket, setIsMarket] = useState(false);
  const [price, setPrice] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 상태
  const [initialContent, setInitialContent] = useState(''); // 수정 시 초기 콘텐츠
  const [initialAttachments, setInitialAttachments] = useState<UploadObject[]>([]); // 수정 시 초기 첨부파일
  const [expireAt, setExpireAt] = useState<Date | null>(null);
  const [expirePopoverOpen, setExpirePopoverOpen] = useState(false);

  const isPosterBoard = boards.find(b => b.id === boardId)?.ko_name === '포스터';
  const today = new Date();

  // 수정 모드일 때 기존 게시물 데이터 로드
  useEffect(() => {
    if (editPostId) {
      setIsEditMode(true);
      fetchPost({ postId: Number(editPostId) }).then(data => {
        setTitle(data.title);
        setInitialContent(data.content); // JSON 문자열 그대로 저장

        // --- 수정된 부분 ---
        // 게시판, 말머리, 가격, 익명/실명, 소셜/성인글 상태 설정
        setBoardId(data.parent_board.id);
        setTopicId(data.parent_topic?.id ? String(data.parent_topic.id) : '');

        // 장터 게시판인 경우 가격 설정
        if (data.parent_board.slug === 'market' && data.metadata?.price) {
          setIsMarket(true);
          setPrice(String(data.metadata.price));
        }

        // 익명/실명 여부 설정
        if (data.name_type === 3) setNameType('ANONYMOUS');
        else if (data.parent_board.name_type === 4) setNameType('REALNAME');
        else setNameType('REGULAR');

        setIsSexual(data.is_content_sexual);
        setIsSocial(data.is_content_social);
        // --- 여기까지 ---

        // 첨부파일 초기화 (편집 모드)
        if (Array.isArray(data.attachments)) {
          const mapped: UploadObject[] = data.attachments.map((att: any) => ({
            key: String(att.id ?? att.pk ?? att.key ?? att.attachment ?? att.file),
            name: att.filename ?? att.name ?? att.file?.split('/').pop() ?? 'attachment',
            type: (att.mimetype ?? att.type ?? 'file').startsWith('image') ? 'image' : 'file',
            uploaded: true,
            url: att.file ?? att.url,
            blobUrl: att.file ?? att.url,
          }));
          setInitialAttachments(mapped);
        }

      }).catch(err => {
        console.error("게시물 로드 실패:", err);
        alert("수정할 게시물을 불러오는 데 실패했습니다.");
      });
    }
  }, [editPostId]);

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

  // 로컬 타임존 기준 YYYY-MM-DD 포맷터
  const formatLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 게시글 저장/수정 API 호출 핸들러
  const handleSavePost = async () => {
    if (!editorRef.current) return;
    const attachmentFiles = attachmentsRef.current?.files ?? [];
    if (isPosterBoard) {
      const imageCount = attachmentFiles.filter(f => f.type === 'image').length;
      if (imageCount < 1) {
        alert('포스터 게시판에는 이미지 첨부가 1개 이상 필요합니다.');
        return;
      }
      if (!expireAt) {
        alert('만료일을 선택해 주세요.');
        return;
      }
    }
    setSaving(true);
    const content = JSON.stringify(editorRef.current.getJSON());
    const metadata =
      isMarket
        ? makeMarketMetadata({ price, currency: 'KRW', state: 'onsale' })
        : isPosterBoard && expireAt
          // 날짜만 문자열로 전달(타임존 영향 제거)
          ? makePosterMetadata({ expire_at: formatLocalYYYYMMDD(expireAt) })
          : undefined;

    try {
      if (isEditMode && editPostId) {
        // 수정 모드
        const articleData = {
          title,
          content,
          attachments: attachmentFiles.map(f => f.key),
          ...(metadata ? { metadata } : {}),
        };
        await updatePost({ postId: Number(editPostId), newArticle: articleData });
        alert('글이 수정되었습니다.');
        router.push(`/post/${editPostId}`); // 수정된 게시글로 이동
      } else {
        // 생성 모드
        const newArticle = {
          title,
          content,
          attachments: attachmentFiles.map(f => f.key),
          parent_board: boardId,
          parent_topic: topicId,
          is_content_sexual: isSexual,
          is_content_social: isSocial,
          name_type: nameType,
          ...(metadata ? { metadata } : {}),
        };
        const result = await createPost({ boardId: boardId!, newArticle });
        alert(`글이 저장되었습니다.`);
        router.push(`/post/${result.id}`); // 생성된 게시글로 이동
      }
    } catch (err) {
      console.error(err);
      alert(isEditMode ? '글 수정에 실패했습니다.' : '글 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 콤마 포매터
  const formatPrice = (s: string) => (s ? new Intl.NumberFormat('ko-KR').format(Number(s)) : '');

  // 팝오버 바깥 클릭 시 닫힘 처리
  useEffect(() => {
    if (!expirePopoverOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        expirePopoverRef.current &&
        !expirePopoverRef.current.contains(e.target as Node)
      ) {
        setExpirePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expirePopoverOpen]);

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">
          {isEditMode ? '게시물 수정하기' : '게시물 작성하기'}
        </p>
        <hr className="border-t border-gray-300 mb-6" />
        <PostOptionBar
          boards={boards}
          defaultBoardId={boardId}
          defaultCategoryId={topicId}
          onChangeBoard={(id) => {
            const bid = Number(id)
            setBoardId(bid)
            setTopicId('')
            // 실명제 게시판(name_type===4)일 땐 REALNAME, 아니면 REGULAR
            const board = boards.find(b => b.id === bid)
            if (board?.name_type === 4) {
              setNameType('REALNAME')
            } else {
              setNameType('REGULAR')
            }
            // 장터 판별: 게시판 이름에 '장터/거래/마켓' 포함 시
            const market = !!board && /장터|거래|마켓/i.test(board.ko_name ?? '')
            setIsMarket(market)
          }}
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
          isEditMode={isEditMode}
          disabled={saving}
        />

        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.currentTarget.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          disabled={saving}
        />

        {isMarket && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-[16px] text-black font-semibold">가격</label>
            <div className="flex items-center gap-1">
              <div className="relative inline-block">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={12} // 표시 문자열(콤마 포함) 길이 여유
                  placeholder="가격을 입력하세요"
                  value={price === '' ? '' : formatPrice(price)}   // 3자리 콤마 표시
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8); // 8자리 제한
                    setPrice(digits);
                  }}
                  className="w-48 border border-gray-300 rounded px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  disabled={saving}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black">
                  ₩
                </span>
              </div>
            </div>
          </div>
        )}

        {isPosterBoard && (
          <div className="mb-4 relative flex items-center gap-3">
            <span className="text-[16px] text-black font-semibold">만료일 :</span>
            <span className="text-sm text-gray-800 font-medium">
              {expireAt ? formatLocalYYYYMMDD(expireAt) : '미설정'}
            </span>
            <button
              type="button"
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 transition"
              onClick={() => setExpirePopoverOpen(o => !o)}
            >
              설정
            </button>
            {expirePopoverOpen && (
              <div
                ref={expirePopoverRef}
                className="absolute left-0 top-full mt-2 z-30 bg-white border border-gray-300 rounded shadow-lg p-4"
              >
                <Calendar
                  size="md"
                  existDates={[today]}
                  eventPeriods={[]}
                  selectedDates={expireAt ? [expireAt] : []}
                  onDateClick={date => {
                    // 선택된 날짜를 로컬 자정으로 고정
                    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const maxDate = new Date();
                    maxDate.setDate(maxDate.getDate() + 60);
                    maxDate.setHours(0, 0, 0, 0);

                    if (selected >= tomorrow && selected <= maxDate) {
                      setExpireAt(selected);
                      setExpirePopoverOpen(false);
                    } else {
                      alert('만료일은 최소 내일, 최대 60일 뒤까지 설정 가능합니다.');
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  만료일은 최소 내일, 최대 60일 뒤까지 선택할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        )}

        <TextEditor
          editable={true}
          onOpenImageUpload={handleOpenImageUpload}
          ref={editorRef}
          content={initialContent}
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
          initialFiles={initialAttachments}
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
            {saving ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '게시글 수정하기' : '게시글 등록하기')}
          </button>
        </div>
      </div>
    </div>
  )
}
