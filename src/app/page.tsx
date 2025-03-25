"use client";

import SearchBar from "@/components/searchBar";
import BoardPreview from "@/components/BoardPreview/BoardPreview";
import BoardSelector from "@/components/BoardPreview/BoardSelector";
import { useState } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("talk");
  const boardData = [
    {
      type: "top" as const,
      title: "🔥 지금 핫한 글",
      posts: [
        { id: 1, rank: 1, title: "핫한 소식", image: true, author: "유저1", timeAgo: "9분전", likes: 50, dislikes: 2, comments: 15 },
        { id: 2, rank: 2, title: "이 글 대박임", image: false, author: "유저2", timeAgo: "9분전", likes: 40, dislikes: 3, comments: 10 },
        { id: 10, rank: 3, title: "이 글 대박임", image: false, author: "유저2", timeAgo: "9분전", likes: 40, dislikes: 3, comments: 10 }
      ],
    },
    {
      type: "all" as const,
      title: "🕑 방금 올라온 글",
      posts: [
        { id: 3, title: "새로운 정보 공유!", image: true, boardName: "자유게시판", author: "유저3", timeAgo: "9분 전", likes: 5, dislikes: 0, comments: 1 },
        { id: 4, title: "이거 봤어?", image: false, boardName: "공지사항", author: "유저4", timeAgo: "15분 전", likes: 2, dislikes: 1, comments: 0 },
        { id: 127, title: "이거 봤어?", image: false, boardName: "공지사항", author: "유저4", timeAgo: "15분 전", likes: 2, dislikes: 1, comments: 0 },
      ],
    },
    {
      type: "with-school" as const,
      title: "🏫 학교에게 전합니다",
      posts: [
        { id: 5, title: "시설 문제 개선 요청", image: false, answered: true, author: "유저5", timeAgo: "1시간 전", likes: 20, dislikes: 3, comments: 5 },
        { id: 6, title: "이 문제 해결해주세요", image: true, answered: false, author: "유저6", timeAgo: "3시간 전", likes: 15, dislikes: 2, comments: 3 },
        { id: 11, title: "이 문제 해결해주세요", image: true, answered: false, author: "유저6", timeAgo: "3시간 전", likes: 15, dislikes: 2, comments: 3 },

      ],
    },
    {
      type: "talk" as const,
      title: "자유게시판",
      posts: [
        { id: 7, title: "오늘 하루 어땠나요?", image: false, author: "유저7", likes: 10, dislikes: 1, comments: 2 },
        { id: 8, title: "이거 꿀팁임", image: true, author: "유저8", likes: 25, dislikes: 0, comments: 7 },
        { id: 12, title: "이거 꿀팁임", image: true, author: "유저8", likes: 25, dislikes: 0, comments: 7 },
      ],
    },
    {
      type: "portal-notice" as const,
      title: "포탈 공지",
      posts: [
        { id: 21, title: "시설 문제 개선 요청", image: false, answered: true, author: "유저5", timeAgo: "1시간 전", likes: 20, dislikes: 3, comments: 5 },
        { id: 22, title: "이 문제 해결해주세요", image: true, answered: false, author: "유저6", timeAgo: "3시간 전", likes: 15, dislikes: 2, comments: 3 },
        { id: 13, title: "이 문제 해결해주세요", image: true, answered: false, author: "유저6", timeAgo: "3시간 전", likes: 15, dislikes: 2, comments: 3 },
      ],
    },
  ];
  return (
    <div>
      <div className="h-[220px] w-full flex justify-center items-center">
        <SearchBar
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-center p-6 border-[1px] border-gray-200 rounded-[20px] shadow-sm w-[857px]">
        <BoardPreview
          type={boardData[0].type}
          title={boardData[0].title}
          posts={boardData[0].posts}
        />
        <BoardPreview
          type={boardData[1].type}
          title={boardData[1].title}
          posts={boardData[1].posts}
       />
      </div>


      {/*자유게시판 , 포탈공지, 학생 및 단체 동아리, 거래, 소통, 뉴스*/}
      <div className ="items-center justify-center p-6 border-[1px] border-gray-200 rounded-[20px] shadow-sm w-[857px]">
      {/* <BoardSelector /> */}
        <BoardPreview
          type={boardData[4].type}
          title={boardData[4].title}
          posts={boardData[4].posts}
      />
      </div>
    </div>
  );
}
