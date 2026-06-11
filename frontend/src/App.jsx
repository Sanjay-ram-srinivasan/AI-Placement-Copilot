import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import JobMatch from './pages/JobMatch';
import InterviewGenerator from './pages/InterviewGenerator';
import Chat from './pages/Chat';
import StudyPlan from './pages/StudyPlan';
import QuizGenerator from './pages/QuizGenerator';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/resume" element={<ResumeAnalyzer />} />
          <Route path="/job-match" element={<JobMatch />} />
          <Route path="/interview" element={<InterviewGenerator />} />
          <Route path="/study-plan" element={<StudyPlan />} />
          <Route path="/quiz-generator" element={<QuizGenerator />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
