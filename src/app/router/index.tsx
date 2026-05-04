import { Navigate, createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/app/layouts/MainLayout";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NewSubmissionPage } from "@/pages/NewSubmissionPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { ReviewPage } from "@/pages/ReviewPage";
import { ReviewDetailPage } from "@/pages/ReviewDetailPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { HistoryPage } from "@/pages/HistoryPage";

export const router = createBrowserRouter([
  { path: "/login", element: <AuthLayout />, children: [{ index: true, element: <LoginPage /> }] },
  { path: "/", element: <MainLayout />, children: [
    { index: true, element: <Navigate to="/dashboard" replace /> },
    { path: "dashboard", element: <DashboardPage /> },
    { path: "pipeline", element: <PipelinePage /> },
    { path: "submissions/new", element: <NewSubmissionPage /> },
    { path: "review", element: <ReviewPage /> },
    { path: "review/:id", element: <ReviewDetailPage /> },
    { path: "activity", element: <ActivityPage /> },
    { path: "history", element: <HistoryPage /> },
  ] },
]);

