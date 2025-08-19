/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { fetchPost, votePost, voteComment } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';
import { formatPost } from '../util/getPost';
import ReplyEditor from '@/components/TextEditor/ReplyEditor';
import Image from "next/image";
import { formatDate } from '../formatDate';
import CommentList from '@/app/post/components/CommentList';
import { type PostData } from '@/lib/types/post'; // <<< 공용 타입 가져오기

export default function PostDetailPage() {
  // useParams를 사용하여 URL 파라미터에서 id 직접 가져오기
  const params = useParams();
  const postId = params?.id ? parseInt(params.id as string, 10) : null;

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <div className="p-8 text-center">로딩 중…</div>;
  }

  if (!post) {
    return null; // 로딩이 끝났는데 post가 null이면 이미 notFound()가 호출된 상태
  }
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
      await votePost(post.id, action); // API 호출 (응답은 기다리지 않음)
      updatePostAfterVote(action); // 로컬 상태 즉시 업데이트
    } catch (error) {
      console.error("게시물 투표 오류:", error);
      alert("투표 처리 중 오류가 발생했습니다.");
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
    } catch (error) {
      console.error("게시물 투표 오류:", error);
      alert("투표 처리 중 오류가 발생했습니다.");
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
    } catch (error) {
      console.error("댓글 투표 오류:", error);
      alert("투표 처리 중 오류가 발생했습니다.");
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
    } catch (error) {
      console.error("댓글 투표 오류:", error);
      alert("투표 처리 중 오류가 발생했습니다.");
    }
  };

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
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Alert.svg" alt="" width={15} height={15} />
                신고
              </div>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Share.svg" alt="" width={15} height={15} />
                공유
              </div>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Bookmark.svg" alt="" width={15} height={15} />
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
              onPositiveVote={comment_positive_vote_handler}
              onNegativeVote={comment_negative_vote_handler}
            />
          )
        }
        <ReplyEditor isNested={false} />
      </div>
    </div>
  );
}