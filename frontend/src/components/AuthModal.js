import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, mode = 'login' }) => {
  const [formMode, setFormMode] = useState(mode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Update form mode when mode prop changes
  useEffect(() => {
    setFormMode(mode);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  }, [mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (formMode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.username, formData.email, formData.password);
      }

      if (result.success) {
        onClose();
        setFormData({ username: '', email: '', password: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = () => {
    setFormMode(formMode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formMode === 'login' ? 'Login' : 'Register'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {formMode === 'register' && (
            <>
              <div className="info-message" style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: '5px', fontSize: '0.9rem' }}>
                <strong>Note:</strong> Registration is only available for OFI Services employees with @ofiservices.com email addresses.
              </div>
              <div className="form-group">
                <label htmlFor="username">Full Name</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  placeholder="Enter your full name"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={formMode === 'register' ? "your.name@ofiservices.com" : "Enter your email"}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : (formMode === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {formMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button type="button" className="link-button" onClick={switchMode}>
              {formMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
