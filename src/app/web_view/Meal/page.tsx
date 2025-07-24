import DateNavigator from "./components/DateNavigator"; 
import RestaurantSelection from "./components/RestaurantSelection";

export default function MealPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">학식 페이지</h1>
      <DateNavigator />
      <RestaurantSelection />
    </div>
  );
}