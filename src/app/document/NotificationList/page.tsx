"use client";

import NotificationList from "@/components/NotificationList/NotificationList";
import { Notification } from "@/lib/types/notification";
import { NotificationApiResponse } from "./mock";
import { useState } from "react";

export default function NotificationListDocumentPage() {
  const [listSpacing, setListSpacing] = useState<number>(12);
  const [verticalSpacing, setVerticalSpacing] = useState<number>(8);
  const [detailVerticalSpacing, setDetailVerticalSpacing] = useState<number>(8);
  const [containerWidth, setContainerWidth] = useState<number>(591);

  const [titleFontSize, setTitleFontSize] = useState<string>("text-base");
  const [contentFontSize, setContentFontSize] = useState<string>("text-base");
  const [detailFontSize, setDetailFontSize] = useState<string>("text-sm");
  const [timestampFontSize, setTimestampFontSize] = useState<string>("text-sm");
  const [replyFontSize, setReplyFontSize] = useState<string>("text-sm");

  const [titleFontWeight, setTitleFontWeight] = useState<string>("font-bold");
  const [contentFontWeight, setContentFontWeight] = useState<string>("font-medium");
  const [detailFontWeight, setDetailFontWeight] = useState<string>("font-medium");
  const [timestampFontWeight, setTimestampFontWeight] = useState<string>("font-medium");
  const [replyFontWeight, setReplyFontWeight] = useState<string>("font-medium");

  const [showIcon, setShowIcon] = useState<boolean>(true);
  const [showTag, setShowTag] = useState<boolean>(true);
  const [showDetail, setShowDetail] = useState<boolean>(true);
  const [showContent, setShowContent] = useState<boolean>(true);
  const [showTimestamp, setShowTimestamp] = useState<boolean>(true);
  const [showReply, setShowReply] = useState<boolean>(true);
  const [iconSize, setIconSize] = useState<number>(36);

  // API mock 데이터
  const notifications: Notification[] = NotificationApiResponse.results;

  return (
    <div className="max-w-[800px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NotificationList Component Document</h1>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <label className="block mb-2 font-medium">알림 사이 간격 (listSpacing): {listSpacing}px</label>
        <input type="range" min={0} max={40} value={listSpacing} onChange={e => setListSpacing(Number(e.target.value))} className="w-full mb-4" />
        <label className="block mb-2 font-medium">title-content, content-아래 영역 간격 (verticalSpacing): {verticalSpacing}px</label>
        <input type="range" min={0} max={32} value={verticalSpacing} onChange={e => setVerticalSpacing(Number(e.target.value))} className="w-full mb-4" />
        <label className="block mb-2 font-medium">detail/reply 영역 내부 세로 간격 (detailVerticalSpacing): {detailVerticalSpacing}px</label>
        <input type="range" min={0} max={32} value={detailVerticalSpacing} onChange={e => setDetailVerticalSpacing(Number(e.target.value))} className="w-full mb-4" />
        <label className="block mb-2 font-medium">컴포넌트 넓이 (containerWidth): {containerWidth}px</label>
        <input type="range" min={320} max={800} value={containerWidth} onChange={e => setContainerWidth(Number(e.target.value))} className="w-full mb-4" />

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">titleFontSize</label>
            <select value={titleFontSize} onChange={e => setTitleFontSize(e.target.value)} className="w-full mb-2">
              <option value="text-xs">text-xs</option>
              <option value="text-sm">text-sm</option>
              <option value="text-base">text-base</option>
              <option value="text-lg">text-lg</option>
              <option value="text-xl">text-xl</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">titleFontWeight</label>
            <select value={titleFontWeight} onChange={e => setTitleFontWeight(e.target.value)} className="w-full mb-2">
              <option value="font-normal">font-normal</option>
              <option value="font-medium">font-medium</option>
              <option value="font-bold">font-bold</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">contentFontSize</label>
            <select value={contentFontSize} onChange={e => setContentFontSize(e.target.value)} className="w-full mb-2">
              <option value="text-xs">text-xs</option>
              <option value="text-sm">text-sm</option>
              <option value="text-base">text-base</option>
              <option value="text-lg">text-lg</option>
              <option value="text-xl">text-xl</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">contentFontWeight</label>
            <select value={contentFontWeight} onChange={e => setContentFontWeight(e.target.value)} className="w-full mb-2">
              <option value="font-normal">font-normal</option>
              <option value="font-medium">font-medium</option>
              <option value="font-bold">font-bold</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">detailFontSize</label>
            <select value={detailFontSize} onChange={e => setDetailFontSize(e.target.value)} className="w-full mb-2">
              <option value="text-xs">text-xs</option>
              <option value="text-sm">text-sm</option>
              <option value="text-base">text-base</option>
              <option value="text-lg">text-lg</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">detailFontWeight</label>
            <select value={detailFontWeight} onChange={e => setDetailFontWeight(e.target.value)} className="w-full mb-2">
              <option value="font-normal">font-normal</option>
              <option value="font-medium">font-medium</option>
              <option value="font-bold">font-bold</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">timestampFontSize</label>
            <select value={timestampFontSize} onChange={e => setTimestampFontSize(e.target.value)} className="w-full mb-2">
              <option value="text-xs">text-xs</option>
              <option value="text-sm">text-sm</option>
              <option value="text-base">text-base</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">timestampFontWeight</label>
            <select value={timestampFontWeight} onChange={e => setTimestampFontWeight(e.target.value)} className="w-full mb-2">
              <option value="font-normal">font-normal</option>
              <option value="font-medium">font-medium</option>
              <option value="font-bold">font-bold</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">replyFontSize</label>
            <select value={replyFontSize} onChange={e => setReplyFontSize(e.target.value)} className="w-full mb-2">
              <option value="text-xs">text-xs</option>
              <option value="text-sm">text-sm</option>
              <option value="text-base">text-base</option>
              <option value="text-lg">text-lg</option>
              <option value="text-xl">text-xl</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">replyFontWeight</label>
            <select value={replyFontWeight} onChange={e => setReplyFontWeight(e.target.value)} className="w-full mb-2">
              <option value="font-normal">font-normal</option>
              <option value="font-medium">font-medium</option>
              <option value="font-bold">font-bold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <label><input type="checkbox" checked={showIcon} onChange={e => setShowIcon(e.target.checked)} /> showIcon</label>
          <label><input type="checkbox" checked={showTag} onChange={e => setShowTag(e.target.checked)} /> showTag</label>
          <label><input type="checkbox" checked={showDetail} onChange={e => setShowDetail(e.target.checked)} /> showDetail</label>
          <label><input type="checkbox" checked={showContent} onChange={e => setShowContent(e.target.checked)} /> showContent</label>
          <label><input type="checkbox" checked={showTimestamp} onChange={e => setShowTimestamp(e.target.checked)} /> showTimestamp</label>
          <label><input type="checkbox" checked={showReply} onChange={e => setShowReply(e.target.checked)} /> showReply</label>
        </div>

        <label className="block mb-2 font-medium">아이콘 사이즈 (iconSize): {iconSize}px</label>
        <input type="range" min={20} max={64} value={iconSize} onChange={e => setIconSize(Number(e.target.value))} className="w-full mb-4" />
      </div>
      <div style={{ width: containerWidth }}>
        <NotificationList
          notifications={notifications}
          listSpacing={listSpacing}
          titleFontSize={titleFontSize}
          contentFontSize={contentFontSize}
          detailFontSize={detailFontSize}
          timestampFontSize={timestampFontSize}
          replyFontSize={replyFontSize}
          titleFontWeight={titleFontWeight}
          contentFontWeight={contentFontWeight}
          detailFontWeight={detailFontWeight}
          timestampFontWeight={timestampFontWeight}
          replyFontWeight={replyFontWeight}
          verticalSpacing={verticalSpacing}
          detailVerticalSpacing={detailVerticalSpacing}
          iconSize={iconSize}
          showIcon={showIcon}
          showTag={showTag}
          showDetail={showDetail}
          showContent={showContent}
          showTimestamp={showTimestamp}
          showReply={showReply}
        />
      </div>
    </div>
  );
}