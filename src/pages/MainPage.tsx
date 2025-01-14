import React from 'react';
import SmallBoard from '../components/SmallBoard';
import Banner from '../components/Banner';
import OrganizationCard from '../components/OrganizationCard';
import OrganizationCardCarousel from '../components/OrganizationCardCarousel';

const MainPage = () => {
    // 게시판별 데이터
    const todayListItems = [
        { id: 1, title: '오늘의 첫 게시글', created_by: { profile: { nickname: '작성자1' } } },
        { id: 2, title: '오늘의 두 번째 게시글', created_by: { profile: { nickname: '작성자2' } } },
        { id: 3, title: '오늘의 세 번째 게시글', created_by: { profile: { nickname: '작성자3' } } },
        { id: 4, title: '오늘의 네 번째 게시글', created_by: { profile: { nickname: '작성자4' } } },
        { id: 5, title: '오늘의 다섯 번째 게시글', created_by: { profile: { nickname: '작성자5' } } },
      ];
    
      const weekListItems = [
        { id: 1, title: '이주의 첫 게시글', created_by: { profile: { nickname: '작성자A' } } },
        { id: 2, title: '이주의 두 번째 게시글', created_by: { profile: { nickname: '작성자B' } } },
        { id: 3, title: '이주의 세 번째 게시글', created_by: { profile: { nickname: '작성자C' } } },
        { id: 4, title: '이주의 네 번째 게시글', created_by: { profile: { nickname: '작성자D' } } },
        { id: 5, title: '이주의 다섯 번째 게시글', created_by: { profile: { nickname: '작성자E' } } },
      ];
    
      const newAraAnnouncement = [
        { id: 1, title: '공지사항 1', created_by: { profile: { nickname: '운영자1' } } },
        { id: 2, title: '공지사항 2', created_by: { profile: { nickname: '운영자2' } } },
        { id: 3, title: '공지사항 3', created_by: { profile: { nickname: '운영자3' } } },
        { id: 4, title: '공지사항 4', created_by: { profile: { nickname: '운영자4' } } },
        { id: 5, title: '공지사항 5', created_by: { profile: { nickname: '운영자5' } } },
      ];

      const organizationData = [
        { name: '학생복지위원회', id: 'welfare-committee', backgroundColor: '#fdf0f0', color: '#ff5757', slug: 'welfare' },
        { name: '총학생회', id: 'undergraduate-association', backgroundColor: '#f0f9ff', color: '#007bff', slug: 'undergraduate' },
        { name: '대학원 총학생회', id: 'graduate-association', backgroundColor: '#fef7e6', color: '#ffc107', slug: 'graduate' },
        { name: '새내기학생회', id: 'freshman-council', backgroundColor: '#e6f7f6', color: '#20c997', slug: 'freshman' },
        { name: '협동조합', id: 'kcoop', backgroundColor: '#eaf3f9', color: '#17a2b8', slug: 'kcoop' },
        { name: '포탈공지', id: 'KAIST', backgroundColor: '#ececec', color: '#464646' },
        { name: '생활관 자치회', id: 'dormitory-council', backgroundColor: '#f3e5f5', color: '#6a1b9a', slug: 'dormitory' },
        { name: '동아리연합회', id: 'clubs-union', backgroundColor: '#e8f5e9', color: '#2e7d32', slug: 'clubs' },
        { name: '인기글 게시판', id: 'top', backgroundColor: '#fbe9e7', color: '#d84315', slug: 'top' },
        { name: '추가 카드', id: 'extra', backgroundColor: '#e0f7fa', color: '#00796b', slug: 'extra' },
      ];

  return (
    <div className="MainPage">
      <Banner />
      <div className="Title">Ara, 가장 정확한 정보를 가장 신속하게.</div>
      <div className="SearchBar">Searchbar</div>
      <div className="Organizations">각종 자치회</div>
      <OrganizationCardCarousel cards={organizationData} />
      <div className="SmallBoardContainer">
        <SmallBoard title="오늘의 인기글" listitems={todayListItems} moreLink="/today-popular" />
        <SmallBoard title="이주의 인기글" listitems={weekListItems} moreLink="/week-popular" />
        <SmallBoard title="뉴아라 공지" listitems={newAraAnnouncement} moreLink="/newara-announcements" />
      </div>
    </div>
  );
};

export default MainPage;
