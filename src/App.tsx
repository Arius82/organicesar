import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import { NotificationProvider } from "@/context/NotificationContext";
import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import UsersPage from "./pages/UsersPage";
import PantryPage from "./pages/PantryPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ReportsPage from "./pages/ReportsPage";
import RewardsPage from "./pages/RewardsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = () => {
  const { currentUser, isMaster } = useApp();
  if (!currentUser) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tarefas" element={<TasksPage />} />
        <Route path="/usuarios" element={isMaster ? <UsersPage /> : <Navigate to="/dashboard" />} />
        <Route path="/despensa" element={<PantryPage />} />
        <Route path="/compras" element={<ShoppingListPage />} />
        <Route path="/cardapio" element={<MealPlannerPage />} />
        <Route path="/relatorios" element={isMaster ? <ReportsPage /> : <Navigate to="/dashboard" />} />
        <Route path="/recompensas" element={<RewardsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AuthGuard />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
