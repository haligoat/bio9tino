import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, Home, FileText } from 'lucide-react';
import VocabView from './components/VocabView';
import QuizView from './components/QuizView';
import type { StudyData } from './types';
import './App.css';

function App() {
  const location = useLocation();
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real static site, we'd fetch an index.json or use Vite's glob import
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        // Vite specific way to find all json files in src/data
        const modules = import.meta.glob('./data/*.json');
        const keys = Object.keys(modules);
        const paths = keys.map(path => path.split('/').pop()?.replace('.json', '') || '');
        setAvailableMaterials(paths);
        
        // Load the first one by default if none selected
        if (keys.length > 0 && !currentMaterial) {
          const firstModule = await modules[keys[0]]() as { default: StudyData };
          setCurrentMaterial(firstModule.default);
        }
      } catch (err) {
        console.error("Failed to load materials:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, []);

  const selectMaterial = async (name: string) => {
    const modules = import.meta.glob('./data/*.json');
    const key = Object.keys(modules).find(k => k.includes(name));
    if (key) {
      const module = await modules[key]() as { default: StudyData };
      setCurrentMaterial(module.default);
    }
  };

  const HomePage = () => (
    <div className="page-content">
      <div className="hero-section">
        <h1>CHS BIO 9 STUDY</h1>
        <p>Your personalized study companion powered by your own documents.</p>
      </div>

      <section className="materials-section">
        <h2>Your Study Materials</h2>
        {availableMaterials.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No study materials found. Add a PDF to the <code>pdfs/</code> folder and ask me to process it!</p>
          </div>
        ) : (
          <div className="materials-grid">
            {availableMaterials.map((name) => (
              <div 
                key={name} 
                className={`material-card ${currentMaterial?.title.toLowerCase().includes(name.toLowerCase()) ? 'active' : ''}`}
                onClick={() => selectMaterial(name)}
              >
                <FileText size={24} />
                <span>{name.replace(/-/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="features-preview">
        <div className="feature-card">
          <BookOpen size={32} />
          <h3>Vocabulary</h3>
          <p>Master key terms and definitions extracted from your PDFs.</p>
          <Link to="/vocab" className="btn-secondary">Explore</Link>
        </div>
        <div className="feature-card">
          <ClipboardList size={32} />
          <h3>Quizzes</h3>
          <p>Challenge yourself with comprehensive 60-question quizzes.</p>
          <Link to="/quizzes" className="btn-secondary">Take Quiz</Link>
        </div>
      </section>
    </div>
  );

  if (loading) return <div className="loading">Loading your study buddy...</div>;

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>CHS BIO 9 STUDY</h2>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <Home size={20} /> <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/vocab" className={location.pathname === '/vocab' ? 'active' : ''}>
              <BookOpen size={20} /> <span>Vocabulary</span>
            </Link>
          </li>
          <li>
            <Link to="/quizzes" className={location.pathname === '/quizzes' ? 'active' : ''}>
              <ClipboardList size={20} /> <span>Quizzes</span>
            </Link>
          </li>
        </ul>
        
        {currentMaterial && (
          <div className="sidebar-footer">
            <div className="current-label">Studying:</div>
            <div className="current-title">{currentMaterial.title}</div>
          </div>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vocab" element={
            currentMaterial ? <VocabView items={currentMaterial.vocab} /> : <HomePage />
          } />
          <Route path="/quizzes" element={
            currentMaterial ? <QuizView items={currentMaterial.quizzes} /> : <HomePage />
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
