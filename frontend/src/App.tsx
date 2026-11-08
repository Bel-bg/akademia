import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import AuthPage from '@/pages/AuthPage';
import BadgesPage from '@/pages/BadgesPage';
import BlitzPage from '@/pages/BlitzPage';
import ChapterPage from '@/pages/ChapterPage';
import Dashboard from '@/pages/Dashboard';
import ExamPage from '@/pages/ExamPage';
import ExamsPage from '@/pages/ExamsPage';
import FeedPage from '@/pages/FeedPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ModulePage from '@/pages/ModulePage';
import ModulesPage from '@/pages/ModulesPage';
import ProfilePage from '@/pages/ProfilePage';
import QuizPage from '@/pages/QuizPage';
import ResultsPage from '@/pages/ResultsPage';

function Gate() {
  const { user, ready } = useAuth();
  const { ready: storeReady } = useStore();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!storeReady) return <Spinner label="Synchronisation…" />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<AuthPage />} />
      <Route element={<Gate />}>
        <Route index element={<Dashboard />} />
        <Route path="actu" element={<FeedPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="m/:moduleId" element={<ModulePage />} />
        <Route path="m/:moduleId/lire/:chapterId" element={<ChapterPage />} />
        <Route path="m/:moduleId/qcm" element={<QuizPage />} />
        <Route path="m/:moduleId/eclair" element={<BlitzPage />} />
        <Route path="m/:moduleId/epreuves" element={<ExamsPage />} />
        <Route path="m/:moduleId/epreuves/:n" element={<ExamPage />} />
        <Route path="m/:moduleId/cartes" element={<FlashcardsPage />} />
        <Route path="resultats" element={<ResultsPage />} />
        <Route path="succes" element={<BadgesPage />} />
        <Route path="classement" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
