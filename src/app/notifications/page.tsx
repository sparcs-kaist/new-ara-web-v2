import { redirect } from 'next/navigation';

export default function Notifications() {
  // /notifications는 /myinfo의 알림 탭으로 라우팅 통합
  redirect('/myinfo?tab=notification');
}
