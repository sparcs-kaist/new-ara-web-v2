/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { fetchPost } from "@/lib/api/post";
import TextEditor from "@/components/TextEditor/TextEditor";
import PostAttachmentsPopover from "./components/PostAttachmentsPopover";
import { formatPost } from "./util/getPost";
import { type PostData } from "@/lib/types/post"; // <<< 타입 가져오기

export default function PostDetailPage() {
  const [post, setPost] = useState<PostData | null>(null);

  useEffect(() => {
    console.log("PostDetailPage mounted");
    console.log("Calling fetchPost...");
    fetchPost({
      postId: 13989,
      fromView: "all",
      current: 3,
      overrideHidden: true,
    })
      .then((data) => {
        console.log("Post data:", data);
        console.log("Content type:", typeof data.content);
        console.log("Content value:", data.content);
        console.log("API attachments:", data.attachments);

        setPost(formatPost({ data }));
      })
      .catch((err) => {
        alert("fetchPost error: " + String(err));
        console.error(err);
      });
  }, []);

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#ed3a3a]/30 border-t-[#ed3a3a] rounded-full animate-spin" />
      </div>
    );
  }

  const mappedAttachments = (post.attachments ?? []).map((att) => ({
    key: String(att.id),
    alias: att.alias ?? "attachment",
    name: att.file?.split("/").pop() ?? "attachment",
    url: att.file,
    type: att.mimetype.startsWith("image")
      ? "image"
      : att.mimetype.includes("pdf")
        ? "pdf"
        : "file",
  }));
  console.log("[page.tsx] mappedAttachments:", mappedAttachments);

  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-[#ed3a3a]">{post.title}</h1>
        <hr className="border-t border-gray-300 mb-6" />
        {/* 첨부파일 모아보기 트리거 */}
        {mappedAttachments.length > 0 && (
          <div className="flex justify-end mb-2 relative">
            <span
              className="text-sm text-gray-700 font-medium cursor-pointer hover:text-red-500 px-2 py-1 bg-white border border-gray-200 rounded shadow"
              onClick={() => setPopoverOpen((o) => !o)}
            >
              첨부파일 모아보기 ({mappedAttachments.length})
            </span>
            {popoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-300 rounded shadow-lg p-3 space-y-2 z-30">
                {mappedAttachments.map((att) => (
                  <div
                    key={att.key}
                    className="flex items-center gap-3 bg-gray-50 rounded px-2 py-1"
                  >
                    {/* 파일 타입 아이콘 */}
                    <span className="shrink-0">
                      {att.type === "image"
                        ? "🖼️"
                        : att.type === "pdf"
                          ? "📄"
                          : "📎"}
                    </span>
                    <span
                      className="flex-1 min-w-0 truncate text-xs text-gray-800"
                      title={att.alias ?? att.name}
                    >
                      {att.alias ?? att.name}
                    </span>
                    <a
                      href={att.url}
                      download={att.alias ?? att.name}
                      className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-500 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      다운로드
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <TextEditor content={post.content} editable={false} />
      </div>
    </div>
  );
}
