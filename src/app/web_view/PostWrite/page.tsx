'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import TextEditor from '@/components/TextEditor/TextEditor';
import { createPost, updatePost, fetchPost, createCoursePost, createMajorPost } from '@/lib/api/post';
import { fetchBoardList } from '@/lib/api/board';
import { readScope, scopeQuery, SCOPED_ARTICLES_KEY, useScopeName } from '@/app/web_view/_query';
import { makeMarketMetadata, makePosterMetadata } from '@/lib/utils/article_metadata';
import PostOptionBar from './components/PostOptionBar';
import Attachments, { UploadObject } from './components/Attachments';
import type { AttachmentsHandles } from './components/Attachments';
import WriteCheckRow from './components/WriteCheckRow';
import Calendar from './components/Calendar/Calendar';
import { KeyboardDownIcon } from './components/icons';

export type NameType = 'REGULAR' | 'ANONYMOUS' | 'REALNAME';

type ApiBoard = {
    id: number;
    ko_name: string;
    name_type: number; // 1=Regular, 3=Regular+Anonymous, 4=Realname only
    user_writable: boolean;
    topics: Array<{ id: number; ko_name: string }>;
};

interface RawAttachment {
    id?: number | string;
    pk?: number | string;
    key?: string;
    attachment?: string;
    file?: string;
    filename?: string;
    alias?: string;
    name?: string;
    mimetype?: string;
    type?: string;
    url?: string;
}

/**
 * TextEditor는 데스크탑과 공유하는 컴포넌트라 직접 고치지 않고, 이 페이지
 * 안에서만 먹는 규칙으로 툴바를 셸 헤더(56px) 아래에 붙이고 회색 테두리를
 * 걷어낸다.
 */
const EDITOR_CSS = `
.pw-editor .editor { margin-bottom: 0; border: 0; border-radius: 0; box-shadow: none; transition: none; }
.pw-editor .editor .sticky {
    top: calc(var(--ara-safe-top) + 56px);
    background-color: #ffffff;
    border-bottom: 1px solid #F0F0F0;
    margin: 0 -20px;
    padding: 8px 20px;
    gap: 12px 14px;
}
.pw-editor .editor .sticky .bg-gray-300 { background-color: #FDF0F0; }
.pw-editor .editor .sticky .text-gray-600 { color: #636363; }
.pw-editor .editor .editor-content { padding: 15px 0 60px; min-height: 200px; font-size: 15px; }
`;

function PostWriteInner() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const safeBack = useSafeBack();
    const searchParams = useSearchParams();
    const editPostId = searchParams.get('edit');
    const boardParam = searchParams.get('board');
    const scope = useMemo(() => readScope(searchParams), [searchParams]);
    const scopeName = useScopeName(scope);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const attachmentsRef = useRef<AttachmentsHandles | null>(null);
    const expirePopoverRef = useRef<HTMLDivElement>(null);

    // 1) BoardList API로 user_writable 게시판만 로드
    const [boards, setBoards] = useState<ApiBoard[]>([]);
    useEffect(() => {
        if (scope) return;
        fetchBoardList()
            .then((data) => setBoards(data.filter((b: ApiBoard) => b.user_writable)))
            .catch(console.error);
    }, [scope]);

    const [title, setTitle] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [isSocial, setIsSocial] = useState(false);
    const [isSexual, setIsSexual] = useState(false);
    const [nameType, setNameType] = useState<NameType>(scope ? 'ANONYMOUS' : 'REGULAR');

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
    const [hasEditorText, setHasEditorText] = useState(false);

    const currentBoard = boards.find((b) => b.id === boardId) ?? null;
    const isPosterBoard = currentBoard?.ko_name === '포스터';
    const today = new Date();

    // URL query param으로 게시판 자동 설정 (?board=5 등)
    useEffect(() => {
        if (!boards.length || editPostId) return; // 수정 모드면 무시
        const paramId = Number(boardParam);
        const matched = boards.find((b) => b.id === paramId);
        if (matched) {
            setBoardId(matched.id);
            setTopicId('');
            if (matched.name_type === 4) setNameType('REALNAME');
            else setNameType('REGULAR');
            const market = /장터|거래|마켓/i.test(matched.ko_name ?? '');
            setIsMarket(market);
        }
        // boardParam이 없거나 유효하지 않으면 기본값(7, 자유게시판) 유지
    }, [boards, boardParam, editPostId]);

    // 수정 모드일 때 기존 게시물 데이터 로드
    useEffect(() => {
        if (!editPostId) return;
        setIsEditMode(true);
        fetchPost({ postId: Number(editPostId), scope })
            .then((data) => {
                setTitle(data.title);
                setInitialContent(data.content); // JSON 문자열 그대로 저장

                if (scope) {
                    setNameType(data.name_type === 2 ? 'ANONYMOUS' : 'REGULAR');
                    return;
                }

                // 게시판, 말머리, 가격, 익명/실명, 소셜/성인글 상태 설정
                setBoardId(data.parent_board.id);
                setTopicId(data.parent_topic?.id ? String(data.parent_topic.id) : '');

                // 장터 게시판인 경우 가격 설정
                if (data.parent_board.slug === 'market' && data.metadata?.price) {
                    setIsMarket(true);
                    setPrice(String(data.metadata.price));
                }

                const rawExpireAt = data.metadata?.expire_at;
                if (typeof rawExpireAt === 'string') {
                    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawExpireAt);
                    if (matched) {
                        setExpireAt(
                            new Date(
                                Number(matched[1]),
                                Number(matched[2]) - 1,
                                Number(matched[3]),
                            ),
                        );
                    }
                }

                // 익명/실명 여부 설정
                if (data.name_type === 3) setNameType('ANONYMOUS');
                else if (data.parent_board.name_type === 4) setNameType('REALNAME');
                else setNameType('REGULAR');

                setIsSexual(data.is_content_sexual);
                setIsSocial(data.is_content_social);

                // 첨부파일 초기화 (편집 모드)
                if (Array.isArray(data.attachments)) {
                    const mapped: UploadObject[] = data.attachments.map(
                        (att: RawAttachment) => ({
                            key: String(att.id ?? att.pk ?? att.key ?? att.attachment ?? att.file),
                            name:
                                att.filename ??
                                att.alias ??
                                att.name ??
                                att.file?.split('/').pop() ??
                                'attachment',
                            type: (att.mimetype ?? att.type ?? 'file').startsWith('image')
                                ? 'image'
                                : 'file',
                            uploaded: true,
                            url: att.file ?? att.url,
                            blobUrl: att.file ?? att.url,
                        }),
                    );
                    setInitialAttachments(mapped);
                }
            })
            .catch((err) => {
                console.error('게시물 로드 실패:', err);
                alert('수정할 게시물을 불러오는 데 실패했습니다.');
            });
    }, [editPostId, scope]);

    // 올리기 버튼 활성화 조건(제목 + 본문)을 위해 에디터 상태를 구독한다.
    useEffect(() => {
        let bound: Editor | null = null;
        const sync = () => setHasEditorText(!!bound && !bound.isEmpty);
        const timer = window.setInterval(() => {
            const editor = editorRef.current;
            if (!editor || bound) return;
            bound = editor;
            editor.on('transaction', sync);
            sync();
            window.clearInterval(timer);
        }, 100);
        return () => {
            window.clearInterval(timer);
            bound?.off('transaction', sync);
        };
    }, []);

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
        uploads.forEach((u) => {
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
        state.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (
                node.type.name === 'attachmentImage' &&
                node.attrs['data-attachment'] === file.key
            ) {
                const tr = view.state.tr.delete(pos, pos + node.nodeSize);
                view.dispatch(tr);
            }
        });
    };

    // 로컬 타임존 기준 YYYY-MM-DD 포맷터
    const formatLocalYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // 만료일 허용 범위: 최소 내일, 최대 60일 뒤
    const isExpireDateInRange = (d: Date) => {
        const selected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60);
        maxDate.setHours(0, 0, 0, 0);
        return selected >= tomorrow && selected <= maxDate;
    };

    // 게시글 저장/수정 API 호출 핸들러
    const handleSavePost = async () => {
        if (!editorRef.current) return;
        const attachmentFiles = attachmentsRef.current?.files ?? [];
        if (isPosterBoard) {
            const imageCount = attachmentFiles.filter((f) => f.type === 'image').length;
            if (imageCount < 1) {
                alert('포스터 게시판에는 이미지 첨부가 1개 이상 필요합니다.');
                return;
            }
            if (!expireAt) {
                alert('만료일을 선택해 주세요.');
                return;
            }
            if (!isExpireDateInRange(expireAt)) {
                alert('만료일은 최소 내일, 최대 60일 뒤까지 설정 가능합니다.');
                return;
            }
        }
        setSaving(true);
        const content = JSON.stringify(editorRef.current.getJSON());

        if (scope) {
            const newArticle = { title, content, content_text: editorRef.current.getText() };
            try {
                let id = Number(editPostId);
                if (isEditMode && editPostId) {
                    await updatePost({ postId: id, newArticle, scope });
                    queryClient.removeQueries({ queryKey: ['webview', 'post', id] });
                } else {
                    const created =
                        scope.courseId != null
                            ? await createCoursePost({ courseId: scope.courseId, newArticle: { ...newArticle, name_type: nameType } })
                            : await createMajorPost({ stdDeptId: scope.stdDeptId, newArticle: { ...newArticle, name_type: nameType } });
                    id = created.id;
                }
                queryClient.removeQueries({ queryKey: SCOPED_ARTICLES_KEY });
                router.replace(`/web_view/Post/${id}?${scopeQuery(scope)}`);
            } catch (err) {
                console.error(err);
                alert(isEditMode ? '글 수정에 실패했습니다.' : '글 저장에 실패했습니다.');
                setSaving(false);
            }
            return;
        }

        const metadata = isMarket
            ? makeMarketMetadata({ price, currency: 'KRW', state: 'onsale' })
            : isPosterBoard && expireAt
              ? // 날짜만 문자열로 전달(타임존 영향 제거)
                makePosterMetadata({ expire_at: formatLocalYYYYMMDD(expireAt) })
              : undefined;

        try {
            if (isEditMode && editPostId) {
                // 수정 모드
                const articleData = {
                    title,
                    content,
                    attachments: attachmentFiles.map((f) => f.key),
                    ...(metadata ? { metadata } : {}),
                };
                await updatePost({
                    postId: Number(editPostId),
                    newArticle: articleData,
                });
                queryClient.removeQueries({
                    queryKey: ['webview', 'post', Number(editPostId)],
                });
                queryClient.removeQueries({ queryKey: ['webview', 'articles'] });
                router.replace(`/web_view/Post/${editPostId}`);
            } else {
                // 생성 모드
                const newArticle = {
                    title,
                    content,
                    attachments: attachmentFiles.map((f) => f.key),
                    parent_board: boardId,
                    parent_topic: topicId,
                    is_content_sexual: isSexual,
                    is_content_social: isSocial,
                    name_type: nameType,
                    ...(metadata ? { metadata } : {}),
                };
                const created = await createPost({ boardId: boardId!, newArticle });
                queryClient.removeQueries({ queryKey: ['webview', 'articles'] });
                router.replace(`/web_view/Post/${created.id}`);
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? '글 수정에 실패했습니다.' : '글 저장에 실패했습니다.');
            setSaving(false);
        }
    };

    // 콤마 포매터
    const formatPrice = (s: string) =>
        s ? new Intl.NumberFormat('ko-KR').format(Number(s)) : '';

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

    const handleBack = useCallback(() => {
        const dirty = title.trim() !== '' || hasEditorText;
        if (dirty && !window.confirm('작성 중인 내용이 있어요. 나갈까요?')) return;
        safeBack();
    }, [hasEditorText, safeBack, title]);

    const canUpload =
        title.trim() !== '' && hasEditorText && (isEditMode || !!currentBoard || !!scope);
    const writingIn = scopeName ?? currentBoard?.ko_name ?? null;

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title={null}
                onBack={handleBack}
                trailing={
                    <>
                        <span className="absolute left-0 right-0 mx-auto w-fit text-[18px] font-bold text-ara_red">
                            {isEditMode ? '글 수정' : '글쓰기'}
                        </span>
                        <button
                            type="button"
                            onClick={handleSavePost}
                            disabled={!canUpload || saving}
                            className={`flex h-[35px] w-[65px] items-center justify-center rounded-[10px] text-[14px] font-medium ${
                                canUpload && !saving
                                    ? 'bg-ara_red text-white'
                                    : 'border border-[#F0F0F0] text-[#BBBBBB]'
                            }`}
                        >
                            {isEditMode ? '수정하기' : '올리기'}
                        </button>
                    </>
                }
            />

            {scope ? (
                <div className="flex h-[34px] items-center px-[20px] text-[16px] font-medium text-black">{scopeName}</div>
            ) : (
                <PostOptionBar
                    boards={boards}
                    boardId={boardId}
                    topicId={topicId}
                    onChangeBoard={(id) => {
                        setBoardId(id);
                        setTopicId('');
                        // 실명제 게시판(name_type===4)일 땐 REALNAME, 아니면 REGULAR
                        const board = boards.find((b) => b.id === id);
                        if (board?.name_type === 4) setNameType('REALNAME');
                        else setNameType('REGULAR');
                        // 장터 판별: 게시판 이름에 '장터/거래/마켓' 포함 시
                        setIsMarket(!!board && /장터|거래|마켓/i.test(board.ko_name ?? ''));
                    }}
                    onChangeCategory={(id) => setTopicId(id)}
                    isEditMode={isEditMode}
                    disabled={saving}
                />
            )}

            <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.currentTarget.value)}
                className="mt-[15px] w-full px-[20px] text-[22px] font-bold leading-[27px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                disabled={saving}
            />

            <div className="mx-[20px] mt-[15px] h-px bg-[#F0F0F0]" />

            <div className="flex h-[50px] items-center pl-[15px] pr-[7px]">
                <span className="min-w-0 truncate text-[16px] font-medium text-[#BBBBBB]">
                    {writingIn ? `${writingIn}에 글 쓰는 중...` : '게시판 선택'}
                </span>
                <div className="ml-auto h-[30px] w-px bg-[#F0F0F0]" />
                <button
                    type="button"
                    aria-label="키보드 내리기"
                    onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
                    className="ml-[7px] rounded-full text-black"
                >
                    <KeyboardDownIcon size={36} />
                </button>
            </div>

            {!scope && (
                <Attachments
                    ref={attachmentsRef}
                    onDelete={handleAttachmentDelete}
                    initialFiles={initialAttachments}
                />
            )}

            <div className="mt-[15px]">
                <WriteCheckRow
                    showAnonymous={!!scope || currentBoard?.name_type === 3}
                    showContentFlags={!scope}
                    anonymous={nameType === 'ANONYMOUS'}
                    social={isSocial}
                    sexual={isSexual}
                    onChangeAnonymous={(v) => setNameType(v ? 'ANONYMOUS' : 'REGULAR')}
                    onChangeSocial={setIsSocial}
                    onChangeSexual={setIsSexual}
                    realnameNotice={currentBoard?.name_type === 4}
                    disabled={saving || isEditMode}
                />
            </div>

            {isMarket && (
                <div className="mt-[15px] flex items-center gap-[10px] px-[20px]">
                    <span className="text-[16px] font-medium text-black">가격</span>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={12} // 표시 문자열(콤마 포함) 길이 여유
                            placeholder="가격을 입력하세요"
                            value={price === '' ? '' : formatPrice(price)} // 3자리 콤마 표시
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 8); // 8자리 제한
                                setPrice(digits);
                            }}
                            className="h-[40px] w-full rounded-[10px] bg-[#F6F6F6] pl-[15px] pr-[34px] text-[16px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                            disabled={saving}
                        />
                        <span className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-[16px] text-[#9E9E9E]">
                            ₩
                        </span>
                    </div>
                </div>
            )}

            {isPosterBoard && (
                <div className="relative mt-[15px] px-[20px]">
                    <div className="flex items-center gap-[10px]">
                        <span className="text-[16px] font-medium text-black">만료일</span>
                        <button
                            type="button"
                            onClick={() => setExpirePopoverOpen((o) => !o)}
                            className={`h-[40px] flex-1 rounded-[10px] bg-[#F6F6F6] px-[15px] text-left text-[16px] ${expireAt ? 'text-black' : 'text-[#BBBBBB]'}`}
                        >
                            {expireAt ? formatLocalYYYYMMDD(expireAt) : '만료일을 선택하세요'}
                        </button>
                    </div>
                    {expirePopoverOpen && (
                        <div
                            ref={expirePopoverRef}
                            className="absolute left-[20px] right-[20px] top-full z-30 mt-[8px] rounded-[10px] bg-white p-[15px] shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
                        >
                            <Calendar
                                size="md"
                                existDates={[today]}
                                eventPeriods={[]}
                                selectedDates={expireAt ? [expireAt] : []}
                                onDateClick={(date) => {
                                    // 선택된 날짜를 로컬 자정으로 고정
                                    const selected = new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate(),
                                    );

                                    if (isExpireDateInRange(selected)) {
                                        setExpireAt(selected);
                                        setExpirePopoverOpen(false);
                                    } else {
                                        alert('만료일은 최소 내일, 최대 60일 뒤까지 설정 가능합니다.');
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="pw-editor mt-[10px] flex-1 px-[20px]">
                <TextEditor
                    editable={true}
                    onOpenImageUpload={scope ? undefined : handleOpenImageUpload}
                    ref={editorRef}
                    content={initialContent}
                />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
            />

            <style>{EDITOR_CSS}</style>
        </Screen>
    );
}

export default function PostWritePage() {
    return (
        <Suspense fallback={null}>
            <PostWriteInner />
        </Suspense>
    );
}
