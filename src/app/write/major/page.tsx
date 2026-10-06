"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import TextEditor from "../../../components/TextEditor/TextEditor";
import { OptionCheckbox } from "../components/Option";
import { createMajorPost, fetchPost, updatePost } from "@/lib/api/post";

export default function MajorWrite() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const stdDeptId = searchParams.get("std_dept_id");
    const editPostId = searchParams.get("edit");

    const editorRef = useRef<Editor | null>(null);

    const [title, setTitle] = useState<string>("");
    const [anonymous, setAnonymous] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialContent, setInitialContent] = useState("");

    useEffect(() => {
        if (!editPostId || !stdDeptId) return;
        setIsEditMode(true);
        fetchPost({ postId: Number(editPostId), scope: { stdDeptId } })
            .then((data) => {
                setTitle(data.title);
                setInitialContent(data.content);
                setAnonymous(data.name_type === 3);
            })
            .catch((err) => {
                console.error("게시물 로드 실패:", err);
                alert("수정할 게시물을 불러오는 데 실패했습니다.");
            });
    }, [editPostId, stdDeptId]);

    const handleSavePost = async () => {
        if (!stdDeptId) {
            router.replace("/campus");
            return;
        }
        if (!editorRef.current) return;
        setSaving(true);

        try {
            if (isEditMode && editPostId) {
                await updatePost({
                    postId: Number(editPostId),
                    newArticle: {
                        title,
                        content: JSON.stringify(editorRef.current.getJSON()),
                    },
                    scope: { stdDeptId },
                });
                alert("글이 수정되었습니다.");
                router.push(`/post/${editPostId}?std_dept_id=${stdDeptId}`);
            } else {
                const result = await createMajorPost({
                    stdDeptId,
                    newArticle: {
                        title,
                        content: JSON.stringify(editorRef.current.getJSON()),
                        name_type: anonymous ? "ANONYMOUS" : "REGULAR",
                    },
                });
                alert("글이 저장되었습니다.");
                router.push(`/post/${result.id}?std_dept_id=${stdDeptId}`);
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? "글 수정에 실패했습니다." : "글 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-center bg-white sm:p-8 p-4 w-full min-h-screen">
            <div className="sm:w-[70vw] w-full max-w-7xl">
                <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">
                    {isEditMode ? "게시물 수정하기" : "게시물 작성하기"}
                </p>
                <hr className="border-t border-gray-300 sm:mb-6 mb-4" />

                <div className="flex items-center gap-x-4 gap-y-2 sm:mb-6 mb-2 flex-wrap">
                    <OptionCheckbox
                        label="익명"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        disabled={saving || isEditMode}
                    />
                </div>

                <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    className="w-full border border-gray-300 rounded px-4 py-2 sm:mb-6 mb-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    disabled={saving}
                />

                <TextEditor editable={true} ref={editorRef} content={initialContent} />

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
