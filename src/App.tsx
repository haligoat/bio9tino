import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, Home, FileText, PanelsTopLeft } from 'lucide-react';
import VocabView from './components/VocabView';
import QuizView from './components/QuizView';
import FlashcardsView from './components/FlashcardsView';
import type { QuizProgress, StudyData } from './types';
import { buildBalancedQuizSets, getDefaultQuizSetId } from './utils/quizSets';
import './App.css';

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface UserStatus {
  lastMaterialTitle?: string;
  quizAttempts: number;
  bestScore: number;
  lastScore?: number;
  lastStudiedAt?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: 'outline' | 'filled_blue' | 'filled_black';
              size: 'large' | 'medium' | 'small';
              type: 'standard' | 'icon';
              text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape: 'rectangular' | 'pill' | 'circle' | 'square';
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const defaultStatus: UserStatus = {
  quizAttempts: 0,
  bestScore: 0,
};

const defaultGoogleClientId = '450297337959-kksvlman4li817h039dd9rpt8igpa29s.apps.googleusercontent.com';
const allMaterialsTitle = 'All Materials';
const userStorageKey = 'bio9-google-user';
const statusStorageKey = (userId: string) => `bio9-status-${userId}`;
const quizProgressStorageKey = (userId: string, materialTitle: string, quizId: string) =>
  `bio9-quiz-progress-v2-${userId}-${materialTitle}-${quizId}`;

const formatStudyGuideName = (name: string) =>
  name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getSavedUser = () => {
  const savedUser = localStorage.getItem(userStorageKey);
  return savedUser ? JSON.parse(savedUser) as GoogleUser : null;
};

const getSavedStatus = (userId: string) => {
  const savedStatus = localStorage.getItem(statusStorageKey(userId));
  return savedStatus ? JSON.parse(savedStatus) as UserStatus : defaultStatus;
};

const getSavedQuizProgress = (userId: string, materialTitle: string, quizId: string) => {
  const savedProgress = localStorage.getItem(quizProgressStorageKey(userId, materialTitle, quizId));
  return savedProgress ? JSON.parse(savedProgress) as QuizProgress : null;
};

const decodeJwtPayload = <T,>(credential: string): T => {
  const payload = credential.split('.')[1];
  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
  return JSON.parse(window.atob(paddedPayload)) as T;
};

function App() {
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(() => getSavedUser());
  const [userStatus, setUserStatus] = useState<UserStatus>(() => {
    const savedUser = getSavedUser();
    return savedUser ? getSavedStatus(savedUser.sub) : defaultStatus;
  });

  const [allMaterials, setAllMaterials] = useState<StudyData | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState('quiz-1');
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || defaultGoogleClientId;
  const currentQuizSets = useMemo(
    () => currentMaterial ? buildBalancedQuizSets(currentMaterial.quizzes, {
      targetQuestionCount: currentMaterial.title === allMaterialsTitle ? 100 : 60,
      description: currentMaterial.title === allMaterialsTitle
        ? '100-question all-topics review'
        : '60-question full-unit practice',
    }) : [],
    [currentMaterial]
  );
  const activeQuizId = currentQuizSets.some((quizSet) => quizSet.id === selectedQuizId)
    ? selectedQuizId
    : getDefaultQuizSetId(currentQuizSets);

  const saveUserStatus = (updates: Partial<UserStatus>) => {
    if (!currentUser) return;

    setUserStatus((previousStatus) => {
      const nextStatus = {
        ...previousStatus,
        ...updates,
        lastStudiedAt: new Date().toISOString(),
      };
      localStorage.setItem(statusStorageKey(currentUser.sub), JSON.stringify(nextStatus));
      return nextStatus;
    });
  };

  const handleGoogleCredential = useCallback((response: GoogleCredentialResponse) => {
    const profile = decodeJwtPayload<GoogleUser>(response.credential);
    const user = {
      sub: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    };

    setCurrentUser(user);
    localStorage.setItem(userStorageKey, JSON.stringify(user));
    const savedStatus = {
      ...getSavedStatus(user.sub),
      ...(currentMaterial ? { lastMaterialTitle: currentMaterial.title } : {}),
    };
    setUserStatus(savedStatus);
    localStorage.setItem(statusStorageKey(user.sub), JSON.stringify(savedStatus));
  }, [currentMaterial]);

  const handleSignOut = () => {
    window.google?.accounts.id.disableAutoSelect();
    localStorage.removeItem(userStorageKey);
    setCurrentUser(null);
    setUserStatus(defaultStatus);
  };

  const handleQuizComplete = (score: number, total: number) => {
    saveUserStatus({
      quizAttempts: userStatus.quizAttempts + 1,
      bestScore: Math.max(userStatus.bestScore, score),
      lastScore: total === 0 ? 0 : Math.round((score / total) * 100),
    });
  };

  const handleQuizProgressChange = (quizId: string, progress: QuizProgress | null) => {
    if (!currentUser || !currentMaterial) return;

    const storageKey = quizProgressStorageKey(currentUser.sub, currentMaterial.title, quizId);
    if (progress) {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  const getCurrentQuizProgress = (quizId: string) => {
    if (!currentUser || !currentMaterial) return null;
    return getSavedQuizProgress(currentUser.sub, currentMaterial.title, quizId);
  };

  useEffect(() => {
    if (!googleClientId || currentUser || loading) return;

    const buttonContainer = googleButtonRef.current;
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !buttonContainer || !window.google) return;

      buttonContainer.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
      });
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      const timer = window.setInterval(() => {
        if (window.google) {
          window.clearInterval(timer);
          renderGoogleButton();
        }
      }, 100);

      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [googleClientId, currentUser, handleGoogleCredential, loading]);

  // In a real static site, we'd fetch an index.json or use Vite's glob import
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        // Vite specific way to find all json files in src/data
        const modules = import.meta.glob('./data/*.json');
        const keys = Object.keys(modules);
        const paths = keys.map(path => path.split('/').pop()?.replace('.json', '') || '');
        setAvailableMaterials(paths);
        
        // Load all materials for the "All" view
        const loadedData: StudyData[] = await Promise.all(
          keys.map(async (key) => {
            const module = await modules[key]() as { default: StudyData };
            return module.default;
          })
        );

        if (loadedData.length > 0) {
          const aggregated: StudyData = {
            title: allMaterialsTitle,
            vocab: loadedData.flatMap(d => d.vocab),
            quizzes: loadedData.flatMap(d =>
              d.quizzes.map(quiz => ({
                ...quiz,
                unitTitle: d.title,
              }))
            ),
          };
          setAllMaterials(aggregated);
          
          // Load the first one by default if none selected
          setCurrentMaterial((previousMaterial) => previousMaterial ?? loadedData[0]);
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
    if (name === allMaterialsTitle) {
      setCurrentMaterial(allMaterials);
      if (allMaterials) saveUserStatus({ lastMaterialTitle: allMaterials.title });
      return;
    }
    const modules = import.meta.glob('./data/*.json');
    const key = Object.keys(modules).find(k => k.includes(name));
    if (key) {
      const module = await modules[key]() as { default: StudyData };
      setCurrentMaterial(module.default);
      saveUserStatus({ lastMaterialTitle: module.default.title });
    }
  };

  const renderHomePage = () => (
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
            <div 
              className={`material-card ${currentMaterial?.title === allMaterialsTitle ? 'active' : ''}`}
              onClick={() => selectMaterial(allMaterialsTitle)}
            >
              <FileText size={24} />
              <span>{allMaterialsTitle}</span>
            </div>
            {availableMaterials.map((name) => (
              <div 
                key={name} 
                className={`material-card ${currentMaterial?.title.toLowerCase().includes(name.toLowerCase()) && currentMaterial?.title !== allMaterialsTitle ? 'active' : ''}`}
                onClick={() => selectMaterial(name)}
              >
                <FileText size={24} />
                <span>{formatStudyGuideName(name)}</span>
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
          <p>Pick from three 60-question unit quizzes or 100-question all-topic reviews.</p>
          <Link to="/quizzes" className="btn-secondary">Take Quiz</Link>
        </div>
        <div className="feature-card">
          <PanelsTopLeft size={32} />
          <h3>Flashcards</h3>
          <p>Flip through terms and definitions for quick review.</p>
          <Link to="/flashcards" className="btn-secondary">Practice</Link>
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
          <li>
            <Link to="/flashcards" className={location.pathname === '/flashcards' ? 'active' : ''}>
              <PanelsTopLeft size={20} /> <span>Flashcards</span>
            </Link>
          </li>
        </ul>
        
        {currentMaterial && (
          <div className="sidebar-footer">
            <div className="auth-panel">
              {currentUser ? (
                <>
                  <div className="user-row">
                    {currentUser.picture && <img src={currentUser.picture} alt="" className="user-avatar" />}
                    <div>
                      <div className="current-label">Signed in</div>
                      <div className="current-title">{currentUser.name}</div>
                    </div>
                  </div>
                  <div className="status-grid">
                    <div>
                      <span className="status-value">{userStatus.quizAttempts}</span>
                      <span className="status-label">Quizzes</span>
                    </div>
                    <div>
                      <span className="status-value">{userStatus.bestScore}</span>
                      <span className="status-label">Best</span>
                    </div>
                  </div>
                  <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
                </>
              ) : (
                <>
                  <div className="current-label">Save Status</div>
                  {googleClientId ? (
                    <div className="google-login" ref={googleButtonRef}></div>
                  ) : (
                    <p className="login-hint">Add VITE_GOOGLE_CLIENT_ID to enable Google login.</p>
                  )}
                </>
              )}
            </div>
            <div className="current-label">Studying:</div>
            <div className="current-title">{currentMaterial.title}</div>
          </div>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={renderHomePage()} />
          <Route path="/vocab" element={
            currentMaterial ? <VocabView items={currentMaterial.vocab} /> : renderHomePage()
          } />
          <Route path="/flashcards" element={
            currentMaterial ? <FlashcardsView items={currentMaterial.vocab} /> : renderHomePage()
          } />
          <Route path="/quizzes" element={
            currentMaterial ? (
              <QuizView
                key={`${currentUser?.sub ?? 'guest'}-${currentMaterial.title}-${activeQuizId}`}
                quizSets={currentQuizSets}
                selectedQuizId={activeQuizId}
                onQuizSelect={setSelectedQuizId}
                initialProgress={getCurrentQuizProgress(activeQuizId)}
                onProgressChange={(progress) => handleQuizProgressChange(activeQuizId, progress)}
                onQuizComplete={handleQuizComplete}
              />
            ) : renderHomePage()
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
