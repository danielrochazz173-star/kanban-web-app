import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DataContextProvider from "./context/DataContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import KanbanPage from "./pages/Kanban";
import Gestor from "./pages/Gestor";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <DataContextProvider>
              <KanbanPage />
            </DataContextProvider>
          }
        />
        <Route path="gestor" element={<ProtectedRoute roles={["gestor"]}><Gestor /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute roles={["gestor"]}><Dashboard /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
