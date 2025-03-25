import Link from "next/link";
import Like from "./Like";
import Image from "next/image";

// 📌 BoardPreviewProps: 여러 게시판 타입 처리
interface BoardPreviewProps {
  type: "top" | "with-school" | "talk" | "portal-notice"| "all";
  title: string;
  posts: {
    id: number;
    title: string;
    image?: boolean;
    rank?: number;
    boardName?: string;
    timeAgo?: string;
    answered?: boolean;
    author: string;
    likes: number;
    dislikes: number;
    comments: number;
  }[];
}

export default function BoardPreview({ type, title, posts }: BoardPreviewProps) {
  return (
    <div className="w-full max-w-[550px] p-4">
      <Link href={`/board/${type === "all" ? "" : type}`} className="flex items-center space-x-2 mb-[10px]">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
      </Link>

      <ul className="space-y-2">
        {/* 🔥 게시글 리스트 렌더링 */}
        {posts.map((post) => (
          <li key={post.id} className="border-b border-gray-200 pb-2 h-[56px] last:border-b-0">
            <Link href={`/post/${post.id}`} className="flex flex-col space-y-1">
              {/* 🔥 인기글 게시판 */}
              {type === "top" && (
                <div className="flex items-center">
                  <span className="text-[22px] font-bold text-ara_red">{post.rank}</span>
                  <div className="w-full pl-4">
                    <div className="flex space-x-2">
                      <span className="text-[16px]">{post.title}</span>
                      {post.image && <Image src="/Image.svg" alt="" width={17} height={14.22} />}
                    </div>
                    <div className="flex w-full mt-1">
                      <div className="text-[12px] text-gray-500">{post.author}</div>
                      <Like like={post.likes} dislike={post.dislikes} comment={post.comments} />
                    </div>
                  </div>
                </div>
              )}

              {type === "all" && (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[16px]">{post.title}</span>
                    {post.image && <Image src="/Image.svg" alt="" width={17} height={14.22} />}
                  </div>
                  <div className="flex space-x-2 w-full mt-1">
                    <div className="text-[12px] text-gray-500">{post.boardName} · {post.author} · {post.timeAgo}</div>
                    <Like like={post.likes} dislike={post.dislikes} comment={post.comments} /> 
                  </div>
                </div>
              )}

              {/* 🔥 자유게시판 */}
              {type === "talk" && (
                <div>
                  <div className="flex space-x-2">
                    <span className="text-[16px]">{post.title}</span>
                    {post.image && <Image src="/Image.svg" alt="" width={17} height={14.22} />}
                  </div>
                  <div className="flex space-x-2 w-full mt-1">
                    <div className="text-[12px] text-gray-500">{post.author}</div>
                    <Like like={post.likes} dislike={post.dislikes} comment={post.comments} /> 
                  </div>
                </div>
              )}

              {/* 🔥 학교에게 전합니다 */}
              {type === "with-school" && (
                <div>
                  <div className="flex space-x-2">
                    <span className="text-[16px]">{post.title}</span>
                    {post.image && <Image src="/Image.svg" alt="" width={17} height={14.22} />}
                  </div>
                  <div className="flex w-full mt-1 space-x-2 text-[12px]">
                    {post.answered ? <span className="text-ara_blue">답변 완료</span> : <span className="text-ara_red">답변 대기중</span>}
                    <div className="text-gray-500">· {post.author} · {post.timeAgo}</div> 
                    <Like like={post.likes} dislike={post.dislikes} comment={post.comments} /> 
                  </div>
                </div>
              )}

              {type === "portal-notice" && (
                <div>
                  <div className="flex space-x-2">
                    <span className="text-[16px]">{post.title}</span>
                    {post.image && <Image src="/Image.svg" alt="" width={17} height={14.22} />}
                  </div>
                  <div className="flex w-full mt-1 space-x-2 text-[12px]">
                    {post.answered ? <span className="text-ara_blue">답변 완료</span> : <span className="text-ara_red">답변 대기중</span>}
                    <div className="text-gray-500">· {post.author} · {post.timeAgo}</div> 
                    <Like like={post.likes} dislike={post.dislikes} comment={post.comments} /> 
                  </div>
                </div>
              )}

            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
