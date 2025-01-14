import React from 'react';
import { Link } from 'react-router-dom';
import './SmallBoard.css';

interface Post {
  id: number;
  title: string;
  created_by: {
    profile: {
      nickname: string;
    };
  };
}

interface SmallBoardProps {
  title: string; // 게시판 제목
  listitems: Post[]; // 게시글 리스트
  moreLink?: string; // 더보기 버튼이 이동할 링크
}

const SmallBoard: React.FC<SmallBoardProps> = ({ title, listitems, moreLink }) => {
  return (
    <div className="small-board">
      <div className= "red-box" />
      <div className="small-board__header">
        <h3 className="small-board__title">{title}</h3>
        {moreLink && (
          <Link to={moreLink} className="small-board__more">
            더보기 &gt;
          </Link>
        )}
      </div>
      <ul className="small-board__list">
        {listitems.map((post) => (
          <li key={post.id} className="small-board__item">
            <span className="small-board__item-title">{post.title}</span>
            <span className="small-board__item-author">- {post.created_by.profile.nickname}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SmallBoard;
