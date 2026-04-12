import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import { FolderProvider } from "./context/FolderContext";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <FolderProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MainLayout>
      </FolderProvider>
    </BrowserRouter>
  );
}
