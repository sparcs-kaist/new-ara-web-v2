import { DateNavigator } from "./components/DateNavigator"; 

export default function MealPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">학식 페이지</h1>
      <DateNavigator />
      {/* 여기에 학식 관련 컴포넌트 추가 */}
    </div>
  );
}