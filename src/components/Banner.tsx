// banner.tsx
import React from 'react';
import '../styles/Banner.css';

const Banner: React.FC = () => {
  return (
    <div className="banner-container">
      <img className="logo" src="../assets/aralogo.png"></img>
      <nav className="nav-links">
        <a href="#" className="nav-item">전체보기</a>
        <a href="#" className="nav-item">인기글</a>
        <a href="#" className="nav-item">자유게시판</a>
        <a href="#" className="nav-item">학생단체 및 동아리</a>
        <a href="#" className="nav-item">거래</a>
        <a href="#" className="nav-item">소통</a>
      </nav>
      <div className="user-actions">
        <button className="icon-button">🌐</button>
        <button className="icon-button">🔔</button>
        <img className="profile-picture" src="../assets/profile.png" alt="Profile" />
        <div className="profile">더운 로봇</div>      </div>
    </div>
  );
};

export default Banner;
