/* eslint-disable */

"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import type { AttachmentsHandles } from "../components/Attachments";
import TextEditor from "../../../components/TextEditor/TextEditor";
import { CourseOptionBar } from "../components/PostOptionBar";
import Attachments, { UploadObject } from "../components/Attachments";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { updatePost, fetchCoursePost, createCoursePost } from "@/lib/api/post";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/lib/api/user";

export type NameType = "REGULAR" | "ANONYMOUS" | "REALNAME";

export default function CourseWrite() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editPostId = searchParams.get("edit");
    const courseParam = searchParams.get("course_id");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const attachmentsRef = useRef<AttachmentsHandles | null>(null);
    const expirePopoverRef = useRef<HTMLDivElement>(null);

    const courses: Course[] = useQuery({
        queryKey: ["courses"],
        queryFn: () => fetchCourses(),
        staleTime: 1000 * 60 * 60 * 24
    }).data ?? []

    // URL query param으로 게시판 자동 설정 (?board=5 등)
    useEffect(() => {
        if (courses.length === 0 || editPostId) return; // 수정 모드면 무시
        const paramId = Number(courseParam);
        const matched = courses.find((c) => c.id === paramId);
        if (matched) {
            setCourseId(matched.id);
            setNameType("REGULAR");
        }
    }, [courses, courseParam, editPostId]);

    const [title, setTitle] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [isSocial, setIsSocial] = useState(false);
    const [isSexual, setIsSexual] = useState(false);
    const [nameType, setNameType] = useState<NameType>("REGULAR");

    const [courseId, setCourseId] = useState<number>(0);

    const [isEditMode, setIsEditMode] = useState(false);
    const [initialContent, setInitialContent] = useState("");
    const [initialAttachments, setInitialAttachments] = useState<UploadObject[]>([]);
    const [expireAt, setExpireAt] = useState<Date | null>(null);
    const [expirePopoverOpen, setExpirePopoverOpen] = useState(false);

    const today = new Date();

    useEffect(() => {
        if (!editPostId) return; 
        setIsEditMode(true);
        fetchCoursePost({ courseId, postId: parseInt(editPostId) }) 
            .then((data) => {
                setTitle(data.title);
                setInitialContent(data.content); // JSON 문자열 그대로 저장

                // 익명/실명 여부 설정
                if (data.name_type === 3) setNameType("ANONYMOUS");
                else if (data.parent_board.name_type === 4) setNameType("REALNAME");
                else setNameType("REGULAR");

                setIsSexual(data.is_content_sexual);
                setIsSocial(data.is_content_social);
                // --- 여기까지 ---

                // 첨부파일 초기화 (편집 모드)
                if (Array.isArray(data.attachments)) {
                    const mapped: UploadObject[] = data.attachments.map((att: any) => ({
                        key: String(
                            att.id ?? att.pk ?? att.key ?? att.attachment ?? att.file,
                        ),
                        name:
                            att.filename ??
                            att.alias ??
                            att.name ??
                            att.file?.split("/").pop() ??
                            "attachment",
                        type: (att.mimetype ?? att.type ?? "file").startsWith("image")
                            ? "image"
                            : "file",
                        uploaded: true,
                        url: att.file ?? att.url,
                        blobUrl: att.file ?? att.url,
                    }));
                    setInitialAttachments(mapped);
                }
            })
            .catch((err) => {
                console.error("게시물 로드 실패:", err);
                alert("수정할 게시물을 불러오는 데 실패했습니다.");
            });
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
        uploads.forEach((u) => {
            editor
                .chain()
                .focus()
                .attachmentImage({
                    src: u.url!,
                    title: u.name,
                    "data-attachment": u.key,
                })
                .run();
        });

        e.target.value = "";
    };

    // 삭제 시 에디터에서도 지우기
    const handleAttachmentDelete = (file: UploadObject) => {
        const editor = editorRef.current;
        if (!editor) return;

        const { state, view } = editor;
        state.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (
                node.type.name === "attachmentImage" &&
                node.attrs["data-attachment"] === file.key
            ) {
                const tr = view.state.tr.delete(pos, pos + node.nodeSize);
                view.dispatch(tr);
            }
        });
    };

    // 로컬 타임존 기준 YYYY-MM-DD 포맷터
    const formatLocalYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    // 게시글 저장/수정 API 호출 핸들러
    const handleSavePost = async () => {
        if (!editorRef.current) return;
        const attachmentFiles = attachmentsRef.current?.files ?? [];
        setSaving(true);
        const content = JSON.stringify(editorRef.current.getJSON());

        try {
            if (isEditMode && editPostId) {
                // 수정 모드
                const articleData = {
                    title,
                    content,
                    attachments: attachmentFiles.map((f) => f.key),
                };
                await updatePost({
                    postId: Number(editPostId),
                    newArticle: articleData,
                });
                alert("글이 수정되었습니다.");
                router.push(`/post/${editPostId}`); // 수정된 게시글로 이동
            } else {
                // 생성 모드
                const newArticle = {
                    title,
                    content,
                    attachments: attachmentFiles.map((f) => f.key),
                    is_content_sexual: isSexual,
                    is_content_social: isSocial,
                    name_type: nameType
                };
                const result = await createCoursePost({ courseId, newArticle });
                alert(`글이 저장되었습니다.`);
                router.push(`/post/${result.id}`);
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? "글 수정에 실패했습니다." : "글 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    // 콤마 포매터
    const formatPrice = (s: string) =>
        s ? new Intl.NumberFormat("ko-KR").format(Number(s)) : "";

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
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [expirePopoverOpen]);

    return (
        <div className="flex flex-col items-center bg-white sm:p-8 p-4 w-full min-h-screen">
            <div className="sm:w-[70vw] w-full max-w-7xl">
                <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">
                    {isEditMode ? "게시물 수정하기" : "게시물 작성하기"}
                </p>
                <hr className="border-t border-gray-300 sm:mb-6 mb-4" />
                <CourseOptionBar
                    courses={courses}
                    defaultCourseId={courseId}
                    onChangeCourse={(id) => {
                        setCourseId(id);
                        const board = courses.find((c) => c.id === id);
                        setNameType("REGULAR");
                    }}
                    onChangeAnonymous={(anon) => {
                        setNameType(anon ? "ANONYMOUS" : "REGULAR");
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
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    className="w-full border border-gray-300 rounded px-4 py-2 sm:mb-6 mb-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    disabled={saving}
                />

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
                        {saving
                            ? isEditMode
                                ? "수정 중..."
                                : "등록 중..."
                            : isEditMode
                                ? "게시글 수정하기"
                                : "게시글 등록하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
