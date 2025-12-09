import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { Home } from './components/Home';
import { Participant } from './components/Participant';
import './index.css';

function App() {
  // Use hash router if prefered for GitHub pages, but standard router with basename is fine
  // Vite config defines base, so we can use standard BrowserRouter with that base?
  // Actually BrowserRouter handles basename if set, but vite 'base' config affects asset paths.
  // For GH Pages, usually we need HashRouter OR BrowserRouter with basename.
  // Let's use BrowserRouter with basename from import.meta.env.BASE_URL

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/participant/:userId" element={<Participant />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
