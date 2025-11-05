import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login...');
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login successful:', response.data);
      
      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
        setError('Connection timeout. Please check your internet connection.');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <i className="fas fa-film"></i>
          Movie Ticket App
        </h1>
        <p className="auth-subtitle">Sign in to your account</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;