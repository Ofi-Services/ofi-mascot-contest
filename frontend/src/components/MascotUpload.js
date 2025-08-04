import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const MascotUpload = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      setImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    if (image) {
      submitData.append('image', image);
    }

    try {
      const response = await api.post('/api/mascots', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        // Reset form
        setFormData({ name: '', description: '' });
        setImage(null);
        setImagePreview(null);
        
        // Refresh user data to reflect they now have a mascot
        refreshUser();
        
        if (onSuccess) {
          onSuccess(response.data.mascot);
        }
        
        alert('Mascot uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload mascot');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  if (user?.hasMascot) {
    return (
      <div className="upload-section">
        <div className="info-message">
          <h3>✅ Your Mascot is Submitted!</h3>
          <p>You've already submitted your mascot: <strong>{user.mascot?.name}</strong></p>
          <p>Each user can only submit one mascot per contest.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-section">
      <h3>Submit Your Mascot</h3>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="name">Mascot Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter your mascot's name"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Describe your mascot..."
            maxLength={500}
            rows={4}
          />
          <small>{formData.description.length}/500 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="image">Mascot Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
          <small>Optional. Max size: 5MB. Supported formats: JPEG, PNG, GIF, WebP</small>
        </div>

        {imagePreview && (
          <div className="image-preview">
            <h4>Preview:</h4>
            <img src={imagePreview} alt="Mascot preview" className="preview-image" />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading || !formData.name || !formData.description}
        >
          {loading ? 'Uploading...' : 'Submit Mascot'}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelSubmit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Mascot Submission</h2>
              <button className="close-button" onClick={handleCancelSubmit}>×</button>
            </div>
            
            <div className="confirmation-content">
              <p><strong>⚠️ Important:</strong> Once submitted, you cannot edit or delete your mascot entry.</p>
              
              <div className="mascot-summary">
                <h3>Review Your Submission:</h3>
                <div className="summary-item">
                  <strong>Name:</strong> {formData.name}
                </div>
                <div className="summary-item">
                  <strong>Description:</strong> {formData.description}
                </div>
                {imagePreview && (
                  <div className="summary-item">
                    <strong>Image:</strong>
                    <div className="confirmation-image-preview">
                      <img src={imagePreview} alt="Mascot preview" />
                    </div>
                  </div>
                )}
              </div>

              <div className="confirmation-actions">
                <button 
                  className="cancel-button" 
                  onClick={handleCancelSubmit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button" 
                  onClick={handleConfirmSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Yes, Submit Mascot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MascotUpload;
