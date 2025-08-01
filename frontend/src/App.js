import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import MascotUpload from './components/MascotUpload';
import './App.css';

function MascotCard({ mascot, onVote, userVotes }) {
  const [voting, setVoting] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const hasVoted = userVotes.includes(mascot.id);

  const handleVote = async () => {
    if (!isAuthenticated) {
      alert('Please log in to vote!');
      return;
    }
    
    setVoting(true);
    try {
      await onVote(mascot.id);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mascot-card">
      <h3>{mascot.name}</h3>
      <span className="mascot-creator">by {mascot.creator}</span>
      
      {mascot.imageUrl && (
        <div className="mascot-image">
          <img src={mascot.imageUrl} alt={mascot.name} />
        </div>
      )}
      
      <p className="mascot-description">{mascot.description}</p>
      
      <div className="vote-section">
        <div className="vote-count">
          ❤️ {mascot.votes} votes
        </div>
        <button
          className={`vote-button ${hasVoted ? 'voted' : ''}`}
          onClick={handleVote}
          disabled={voting || hasVoted || !isAuthenticated}
        >
          {voting ? 'Voting...' : hasVoted ? 'Voted ✓' : 'Vote'}
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const [mascots, setMascots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userVotes, setUserVotes] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  // Check server health and fetch mascots
  useEffect(() => {
    checkServerHealth();
    fetchMascots();
    if (isAuthenticated) {
      fetchUserVotes();
    }
  }, [isAuthenticated]);

  const checkServerHealth = async () => {
    try {
      const response = await axios.get('/api/health');
      if (response.data.status === 'OK') {
        setServerStatus('connected');
      }
    } catch (err) {
      setServerStatus('disconnected');
      console.error('Server health check failed:', err);
    }
  };

  const fetchMascots = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/mascots');
      setMascots(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch mascots. Please make sure the backend server is running.');
      console.error('Error fetching mascots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    try {
      const response = await axios.get('/api/user/votes');
      setUserVotes(response.data.map(vote => vote.mascotId));
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  };

  const handleVote = async (mascotId) => {
    try {
      const response = await axios.post(`/api/mascots/${mascotId}/vote`);
      if (response.data.success) {
        // Update the vote count locally
        setMascots(prevMascots =>
          prevMascots.map(mascot =>
            mascot.id === mascotId
              ? { ...mascot, votes: response.data.newVoteCount }
              : mascot
          )
        );
        // Add to user votes
        setUserVotes(prev => [...prev, mascotId]);
        
        const mascot = mascots.find(m => m.id === mascotId);
        alert(`Vote recorded successfully for ${mascot?.name}!`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to record vote. Please try again.';
      alert(errorMsg);
      console.error('Error voting:', err);
    }
  };

  const handleMascotUploaded = (newMascot) => {
    setMascots(prevMascots => [...prevMascots, newMascot]);
    setShowUpload(false);
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const StatusIndicator = () => (
    <div className={`status-indicator ${serverStatus}`}>
      <div className={`status-dot ${serverStatus}`}></div>
      <span>
        Backend Server: {
          serverStatus === 'connected' ? 'Connected' :
          serverStatus === 'disconnected' ? 'Disconnected' :
          'Checking...'
        }
      </span>
    </div>
  );

  if (authLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <StatusIndicator />
        <div className="loading">Loading mascots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <StatusIndicator />
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchMascots} className="vote-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <StatusIndicator />
      
      <header className="header">
        <h1>🏆 OFI Mascot Contest</h1>
        <p>Submit your mascot and vote for your favorites!</p>
        
        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-info">
              <span>Welcome, {user?.username}!</span>
              <button onClick={() => setShowUpload(!showUpload)} className="auth-button">
                {showUpload ? 'Hide Upload' : 'Submit Mascot'}
              </button>
              <button onClick={logout} className="auth-button secondary">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button onClick={() => openAuthModal('login')} className="auth-button">
                Login
              </button>
              <button onClick={() => openAuthModal('register')} className="auth-button">
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {isAuthenticated && showUpload && (
        <MascotUpload onSuccess={handleMascotUploaded} />
      )}

      <div className="mascots-section">
        <h2>Contest Entries ({mascots.length})</h2>
        
        {mascots.length === 0 ? (
          <div className="no-mascots">
            <p>No mascots submitted yet. Be the first to submit your mascot!</p>
          </div>
        ) : (
          <div className="mascots-grid">
            {mascots.map(mascot => (
              <MascotCard
                key={mascot.id}
                mascot={mascot}
                onVote={handleVote}
                userVotes={userVotes}
              />
            ))}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
