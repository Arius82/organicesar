import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AlarmProvider, useAlarms } from "@/context/AlarmContext";
import AlarmOverlay from "@/components/AlarmOverlay";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import UsersPage from "./pages/UsersPage";
import PantryPage from "./pages/PantryPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ReportsPage from "./pages/ReportsPage";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const AppContent = () => {
  const { isMaster, loading } = useApp();

  if (loading) return <LoadingScreen />;

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
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const AuthGuard = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppProvider>
      <NotificationProvider>
        <AlarmProvider>
          <AlarmOverlay />
          <AppContent />
        </AlarmProvider>
      </NotificationProvider>
    </AppProvider>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/*" element={<AuthGuard />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
