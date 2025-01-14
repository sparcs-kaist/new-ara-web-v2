import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import TodayPopularPage from './pages/TodayPopularPage';
import WeekPopularPage from './pages/WeekPopularPage';
import NewAraAnnouncementPage from './pages/NewAraAnnouncementPage';

const App = () => {
  return (
    <Routes>
      {/* 메인 페이지 */}
      <Route path="/" element={<MainPage />} />
      {/* 더보기 페이지 */}
      <Route path="/today-popular" element={<TodayPopularPage />} />
      <Route path="/week-popular" element={<WeekPopularPage />} />
      <Route path="/newara-announcements" element={<NewAraAnnouncementPage />} />
    </Routes>
  );
};

export default App;
