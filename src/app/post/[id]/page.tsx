/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { fetchPost, votePost, voteComment, archivePost, unarchivePost, createComment } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';
import { formatPost } from '../util/getPost';
import Image from "next/image";
import { formatDate } from '../formatDate';
import CommentList from '@/app/post/components/CommentList';
import { type PostData, type Scrap, type Author } from '@/lib/types/post';
import ReplyEditor from '@/app/post/components/ReplyEditor';

export default function PostDetailPage() {
  // useParams를 사용하여 URL 파라미터에서 id 직접 가져오기
  const params = useParams();
  const postId = params?.id ? parseInt(params.id as string, 10) : null;

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [selectedNameType, setSelectedNameType] = useState(1);

  useEffect(() => {
    // postId가 유효한 숫자가 아니면 404 페이지로 리다이렉트
    if (!postId || isNaN(postId) || postId <= 0) {
      notFound(); // Next.js의 404 페이지로 리다이렉트
      return; // useEffect 종료
    }

    setIsLoading(true);
    fetchPost({
      postId,
      fromView: 'all',
      current: 3,
      overrideHidden: true,
    })
      .then(data => {
        setPost(formatPost({ data }));
      })
      .catch(error => {
        console.error("게시물 로딩 실패:", error);
        notFound(); // API 요청 실패 시에도 404 페이지로 리다이렉트
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  // post 데이터가 로드되면 기본 name_type 설정
  useEffect(() => {
    if (post) {
      if (post.name_type & 1) setSelectedNameType(1); // 닉네임 사용 가능하면 기본값
      else if (post.name_type & 2) setSelectedNameType(2); // 익명만 가능하면 기본값
    }
  }, [post]);

  // 투표 후 게시물 상태 업데이트 함수 (로컬 계산 방식)
  const updatePostAfterVote = (action: 'vote_positive' | 'vote_negative' | 'vote_cancel') => {
    setPost(prev => {
      if (!prev) return null;

      const currentVote = prev.my_vote;
      let newVote = currentVote;
      let posCount = prev.positive_vote_count;
      let negCount = prev.negative_vote_count;

      if (action === 'vote_positive') {
        newVote = true;
        posCount += 1;
        if (currentVote === false) negCount -= 1; // 싫어요 -> 좋아요
      } else if (action === 'vote_negative') {
        newVote = false;
        negCount += 1;
        if (currentVote === true) posCount -= 1; // 좋아요 -> 싫어요
      } else if (action === 'vote_cancel') {
        if (currentVote === true) posCount -= 1; // 좋아요 취소
        if (currentVote === false) negCount -= 1; // 싫어요 취소
        newVote = null;
      }

      return {
        ...prev,
        positive_vote_count: posCount,
        negative_vote_count: negCount,
        my_vote: newVote,
      };
    });
  };

  // 투표 후 댓글 상태 업데이트 함수 (로컬 계산 방식)
  const updateCommentAfterVote = (commentId: number, action: 'vote_positive' | 'vote_negative' | 'vote_cancel') => {
    setPost(prev => {
      if (!prev) return null;

      const updateCommentInList = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const currentVote = comment.my_vote;
            let newVote = currentVote;
            let posCount = comment.positive_vote_count;
            let negCount = comment.negative_vote_count;

            if (action === 'vote_positive') {
              newVote = true;
              posCount += 1;
              if (currentVote === false) negCount -= 1;
            } else if (action === 'vote_negative') {
              newVote = false;
              negCount += 1;
              if (currentVote === true) posCount -= 1;
            } else if (action === 'vote_cancel') {
              if (currentVote === true) posCount -= 1;
              if (currentVote === false) negCount -= 1;
              newVote = null;
            }

            return {
              ...comment,
              positive_vote_count: posCount,
              negative_vote_count: negCount,
              my_vote: newVote,
            };
          }

          if (comment.comments && comment.comments.length > 0) {
            return { ...comment, comments: updateCommentInList(comment.comments) };
          }
          return comment;
        });
      };

      return { ...prev, comments: updateCommentInList(prev.comments) };
    });
  };

  // 게시물 좋아요 핸들러
  const article_positive_vote_handler = async () => {
    if (!post) return;
    try {
      const action = post.my_vote === true ? 'vote_cancel' : 'vote_positive';
      await votePost(post.id, action);
      updatePostAfterVote(action);
    } catch (error: any) {
      console.error("게시물 투표 오류:", error);
      // 서버에서 온 에러 메시지가 있으면 사용하고, 없으면 기본 메시지 사용
      const errorMessage = error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
      // TODO: 에러 발생 시 원래 상태로 되돌리는 로직 추가 가능
    }
  };

  // 게시물 싫어요 핸들러
  const article_negative_vote_handler = async () => {
    if (!post) return;
    try {
      const action = post.my_vote === false ? 'vote_cancel' : 'vote_negative';
      await votePost(post.id, action);
      updatePostAfterVote(action);
    } catch (error: any) {
      console.error("게시물 투표 오류:", error);
      const errorMessage = error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  // 댓글 좋아요 핸들러
  const comment_positive_vote_handler = async (commentId: number) => {
    try {
      const findComment = (comments: any[]): any => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          if (comment.comments) {
            const found = findComment(comment.comments);
            if (found) return found;
          }
        }
        return null;
      };
      const comment = findComment(post?.comments || []);
      if (!comment) return;

      const action = comment.my_vote === true ? 'vote_cancel' : 'vote_positive';
      await voteComment(commentId, action);
      updateCommentAfterVote(commentId, action);
    } catch (error: any) {
      console.error("댓글 투표 오류:", error);
      const errorMessage = error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  // 댓글 싫어요 핸들러
  const comment_negative_vote_handler = async (commentId: number) => {
    try {
      const findComment = (comments: any[]): any => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          if (comment.comments) {
            const found = findComment(comment.comments);
            if (found) return found;
          }
        }
        return null;
      };
      const comment = findComment(post?.comments || []);
      if (!comment) return;

      const action = comment.my_vote === false ? 'vote_cancel' : 'vote_negative';
      await voteComment(commentId, action);
      updateCommentAfterVote(commentId, action);
    } catch (error: any) {
      console.error("댓글 투표 오류:", error);
      const errorMessage = error.response?.data?.message || "투표 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  // 공유하기 핸들러
  const handleShare = async () => {
    try {
      // 현재 페이지의 URL을 클립보드에 복사
      await navigator.clipboard.writeText(window.location.href);
      alert("URL이 복사되었습니다.");
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert("URL 복사에 실패했습니다.");
    }
  };

  // 담아두기(스크랩) 핸들러
  const handleScrap = async () => {
    if (!post) return;

    try {
      if (post.my_scrap) {
        // 이미 스크랩된 경우 -> 스크랩 취소
        await unarchivePost(post.my_scrap.id);
        setPost(prev => prev ? { ...prev, my_scrap: null } : null);
      } else {
        // 스크랩되지 않은 경우 -> 스크랩
        const newScrap: Scrap = await archivePost(post.id);
        // API 응답 전체를 my_scrap 상태로 설정
        setPost(prev => prev ? { ...prev, my_scrap: newScrap } : null);
      }
    } catch (error: any) {
      console.error("스크랩 처리 오류:", error);
      const errorMessage = error.response?.data?.message || "스크랩 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  // SVG 아이콘 컴포넌트 정의
  const BookmarkIcon = ({ isFilled }: { isFilled: boolean }) => {
    // 스크랩 상태일 때: 버튼 배경이 빨간색이므로 아이콘은 흰색으로 채움
    // 스크랩 아닐 때: 기본 아이콘 (테두리만 회색)
    const color = isFilled ? 'white' : '#666666';
    const fill = isFilled ? 'white' : 'none';

    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill={fill}>
        <path d="M12.6666 14.5L7.99992 11.1667L3.33325 14.5V3.83333C3.33325 3.47971 3.47373 3.14057 3.72378 2.89052C3.97382 
        2.64048 4.31296 2.5 4.66659 2.5H11.3333C11.6869 2.5 12.026 2.64048 12.2761 2.89052C12.5261 3.14057 
        12.6666 3.47971 12.6666 3.83333V14.5Z" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // 이름 타입 선택 UI 컴포넌트
  const NameTypeSelector = ({ postNameType, selected, onChange }: { postNameType: number, selected: number, onChange: (type: number) => void }) => {
    const canUseNickname = (postNameType & 1) > 0;
    const canUseAnonymous = (postNameType & 2) > 0;

    if (!(canUseNickname && canUseAnonymous)) return null; // 닉네임/익명 동시 사용 불가 시 숨김

    return (
      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={selected === 2} // 익명이 선택되었을 때 체크
          onChange={(e) => onChange(e.target.checked ? 2 : 1)}
        />
        익명
      </label>
    );
  };

  // 댓글 등록 핸들러
  const handleCommentSubmit = async () => {
    if (!postId || !newCommentContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      await createComment({
        parent_article_id: postId,
        commentContent: newCommentContent,
        name_type: selectedNameType,
      });
      alert("댓글이 등록되었습니다.");
      window.location.reload();
    } catch (error: any) {
      console.error("댓글 작성 실패:", error);
      const errorMessage = error.response?.data?.message || "댓글 작성 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">로딩 중…</div>;
  }

  if (!post) {
    return null; // 로딩이 끝났는데 post가 null이면 이미 notFound()가 호출된 상태
  }

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="flex flex-col w-[70vw] max-w-7xl gap-[20px]">
        {/* 제목 부분 */}
        <div className="flex flex-col gap-[8px]">
          <div className="text-[18px] font-bold text-black leading-[25.2px]">{post.title}</div>
          <div className='flex flex-row w-full h-fit justify-between items-center'>
            <div className='flex flex-row gap-[4px] cursor-pointer text-[#333333] items-center' onClick={() => { }}>
              <img src={post.created_by.profile.picture} alt="example" width={20} />
              {post.created_by.profile.nickname}
              <Image src="/Chevron.svg" alt="" width={20} height={20} />
            </div>
            <div className='flex text-[#B5B5B5] text-sm' onClick={() => { }}>
              {`${formatDate(post.created_at)}  ·  조회 ${post.hit_count}`}
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#B5B5B5]" />
        </div>
        {/* 본문 */}
        <div className='flex flex-col gap-[40px]'>
          <TextEditor
            content={post.content}
            editable={false}
          />
          <div className='flex flex-row w-full h-fit justify-between items-center'>
            <div className='flex flex-row gap-[12px]'>
              <div
                className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] items-center'
                onClick={article_positive_vote_handler}
              >
                {post.my_vote === true
                  ? <Image src="/LikeFill.svg" alt="" width={30} height={30} />
                  : <Image src="/Like.svg" alt="" width={30} height={30} />
                }
                {post.positive_vote_count}
              </div>
              <div
                className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] items-center'
                onClick={article_negative_vote_handler}
              >
                {post.my_vote === false
                  ? <Image src="/DislikeFill.svg" alt="" width={30} height={30} />
                  : <Image src="/Dislike.svg" alt="" width={30} height={30} />
                }
                {post.negative_vote_count}
              </div>
            </div>
            <div className='flex flex-row gap-[4px]'>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug hover:bg-gray-100 transition">
                <Image src="/Alert.svg" alt="" width={15} height={15} />
                신고
              </div>
              <div
                className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug hover:shadow-md transition"
                onClick={handleShare} // 공유 핸들러 연결
              >
                <Image src="/Share.svg" alt="" width={15} height={15} />
                공유
              </div>
              {/* 담아두기 버튼 */}
              <div
                className={`p-2 flex flex-row gap-2 cursor-pointer border rounded text-sm leading-snug hover:shadow-md transition ${post.my_scrap ? 'border-[#ED3A3A] bg-[#ed3a3a] text-white' : 'border-[#E9E9E9] text-[#666666]'
                  }`}
                onClick={handleScrap}
              >
                <BookmarkIcon isFilled={!!post.my_scrap} />
                담아두기
              </div>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#B5B5B5]" />
        </div>
        {/* 댓글 부분 */}
        {
          post.comments.map((val, idx) =>
            <CommentList
              comment={val}
              key={idx}
              postNameType={post.name_type}
              myCommentProfile={post.my_comment_profile}
              onPositiveVote={comment_positive_vote_handler}
              onNegativeVote={comment_negative_vote_handler}
            />
          )
        }
        {/* 댓글 입력 섹션 */}
        <div className="flex flex-col gap-1 mt-4">
          {post.my_comment_profile && (
            <div className='flex flex-row gap-2 items-center px-2 mb-2'>
              <img src={post.my_comment_profile.profile.picture} alt="my profile" width={24} height={24} className="rounded-full" />
              <span className="font-medium text-md">{post.my_comment_profile.profile.nickname}</span>
            </div>
          )}
          <ReplyEditor
            isNested={false}
            content={newCommentContent}
            onContentChange={setNewCommentContent}
            onSubmit={handleCommentSubmit}
          />
        </div>
      </div>
    </div>
  );
}