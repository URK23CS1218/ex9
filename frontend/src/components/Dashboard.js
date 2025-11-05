import React, { useState, useEffect } from 'react';
import './Auth.css';
import './BookingManagement.css';

// Import movie poster images (you'll need to create these in your assets folder)
// If you don't have local images, you can use online URLs as shown below

const Dashboard = ({ user, onLogout }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [searchRef, setSearchRef] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('movies');

  // USD to INR conversion rate
  const USD_TO_INR = 83;

  // Movie data with online poster URLs
  const movies = [
    {
      id: 1,
      title: 'Avengers: Endgame',
      genre: 'Action',
      duration: '3h 1m',
      rating: 'PG-13',
      description: 'The epic conclusion to the Infinity Saga.',
      price: 12.99,
      priceINR: Math.round(12.99 * USD_TO_INR),
      poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      releaseYear: 2019
    },
    {
      id: 2,
      title: 'The Batman',
      genre: 'Action, Crime',
      duration: '2h 56m',
      rating: 'PG-13',
      description: 'The Dark Knight of Gotham City begins his war on crime.',
      price: 11.99,
      priceINR: Math.round(11.99 * USD_TO_INR),
      poster: 'https://cdn.wallpapersafari.com/0/36/uLRr36.jpg',
      releaseYear: 2022
    },
    {
      id: 3,
      title: 'Spider-Man: No Way Home',
      genre: 'Action, Adventure',
      duration: '2h 28m',
      rating: 'PG-13',
      description: 'Spider-Man seeks the help of Doctor Strange when his secret identity is revealed.',
      price: 13.99,
      priceINR: Math.round(13.99 * USD_TO_INR),
      poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
      releaseYear: 2021
    },
    {
      id: 4,
      title: 'Dune',
      genre: 'Sci-Fi',
      duration: '2h 35m',
      rating: 'PG-13',
      description: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.',
      price: 12.49,
      priceINR: Math.round(12.49 * USD_TO_INR),
      poster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
      releaseYear: 2021
    }
  ];

  // Utility functions - MOVE THESE TO THE TOP LEVEL OF THE COMPONENT
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  // Fetch user's bookings
  const fetchUserBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/user/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data);
        if (data.data.length === 0) {
          setMessage('You have no bookings yet.');
        } else {
          setMessage(`Found ${data.data.length} bookings`);
        }
      } else {
        setMessage(data.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setMessage('Failed to load bookings. Please check if the server is running.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Search booking by reference number
  const searchBooking = async () => {
    if (!searchRef.trim()) {
      setMessage('Please enter a reference number');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/search/${searchRef}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResult(data.data);
        setMessage('Booking found successfully!');
      } else {
        setSearchResult(null);
        setMessage(data.message || 'Booking not found');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setMessage('Search failed. Please check if the server is running.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (referenceNumber) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/cancel/${referenceNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Booking cancelled successfully!');
        if (activeTab === 'myBookings') {
          fetchUserBookings();
        } else {
          setSearchResult(null);
          setSearchRef('');
        }
      } else {
        setMessage(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      setMessage('Failed to cancel booking. Please try again.');
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchRef('');
    setSearchResult(null);
    setMessage('');
  };

  const handleBookTicket = (movie) => {
    setSelectedMovie(movie);
    setBookingSuccess(false);
    setBookingDetails(null);
    setMessage('');
  };

  // Helper function for fallback booking
  const createFallbackBooking = () => {
    const fallbackBooking = {
      _id: 'booking_' + Date.now(),
      referenceNumber: 'REF' + Date.now().toString().slice(-6),
      movieTitle: selectedMovie.title,
      userName: user.username,
      userEmail: user.email,
      movieId: selectedMovie.id,
      theater: 'PVR Cinemas',
      bookingDate: new Date(),
      showTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      seats: ['A1', 'A2'],
      totalAmount: selectedMovie.priceINR * 2,
      status: 'confirmed',
      paymentStatus: 'paid'
    };
    
    console.log('🔄 Using fallback booking:', fallbackBooking);
    setBookingDetails(fallbackBooking);
    setBookingSuccess(true);
    setBookings(prev => [...prev, fallbackBooking]);
    
    setTimeout(() => {
      setSelectedMovie(null);
      setBookingSuccess(false);
    }, 5000);
  };

  const confirmBooking = async () => {
    if (selectedMovie) {
      try {
        const token = localStorage.getItem('token');
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        
        const bookingData = {
          userId: user.id,
          userName: user.username,
          userEmail: user.email,
          movieTitle: selectedMovie.title,
          movieId: selectedMovie.id,
          theater: 'PVR Cinemas',
          showTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          seats: ['A1', 'A2'],
          totalAmount: selectedMovie.priceINR * 2
        };

        console.log('🎫 Sending booking request:', bookingData);

        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log('✅ Booking successful:', data.booking);
          setBookingDetails(data.booking);
          setBookingSuccess(true);
          setMessage('Booking created successfully!');
          
          if (activeTab === 'myBookings') {
            fetchUserBookings();
          } else {
            setBookings(prev => [...prev, data.booking]);
          }
          
          setTimeout(() => {
            setSelectedMovie(null);
            setBookingSuccess(false);
          }, 5000);
        } else {
          console.error('❌ Booking failed:', data.message);
          setMessage(data.message || 'Booking failed. Please try again.');
          createFallbackBooking();
        }
      } catch (error) {
        console.error('🚨 Booking API error:', error);
        setMessage('Booking failed. Using fallback mode.');
        createFallbackBooking();
      }
    }
  };

  const cancelBookingModal = () => {
    setSelectedMovie(null);
    setBookingSuccess(false);
    setBookingDetails(null);
    setMessage('');
  };

  useEffect(() => {
    if (activeTab === 'myBookings' && user) {
      fetchUserBookings();
    } else {
      setMessage('');
    }
  }, [activeTab, user]);

  // BookingCard component - MOVE THIS AFTER ALL FUNCTION DEFINITIONS
  const BookingCard = ({ booking }) => (
    <div className={`booking-card ${booking.status}`}>
      <div className="booking-header">
        <div>
          <h3>Reference: {booking.referenceNumber}</h3>
          <p className="booking-id">ID: {booking._id || booking.bookingId}</p>
        </div>
        <span className={`status-badge ${booking.status}`}>
          {booking.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>
      
      <div className="booking-details">
        <div className="detail-row">
          <span className="label">Movie:</span>
          <span className="value">{booking.movieTitle || booking.movie || 'Unknown Movie'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Theater:</span>
          <span className="value">{booking.theater || 'Unknown Theater'}</span>
        </div>
        <div className="detail-row">
          <span className="label">Show Time:</span>
          <span className="value">{formatDate(booking.showTime)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Seats:</span>
          <span className="value">
            {Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A'}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">Amount:</span>
          <span className="value amount">{formatCurrency(booking.totalAmount || booking.total)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Booked On:</span>
          <span className="value">{formatDate(booking.bookingDate)}</span>
        </div>
        {booking.userName && (
          <div className="detail-row">
            <span className="label">Booked By:</span>
            <span className="value">{booking.userName}</span>
          </div>
        )}
      </div>
      
      {booking.status === 'confirmed' && (
        <div className="booking-actions">
          <button 
            className="cancel-btn"
            onClick={() => cancelBooking(booking.referenceNumber)}
          >
            Cancel Booking
          </button>
        </div>
      )}

      {booking.status === 'cancelled' && booking.cancelledAt && (
        <div className="cancellation-info">
          <p>Cancelled on: {formatDate(booking.cancelledAt)}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>
              Welcome to Movie Ticket App!
            </h1>
            <p style={{ color: '#666', fontSize: '18px' }}>
              Hello, <strong>{user?.username}</strong>! Ready to book some movies?
            </p>
          </div>
          <button 
            onClick={onLogout} 
            className="btn btn-secondary"
            style={{ minWidth: '120px' }}
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          background: '#f8f9fa',
          padding: '10px',
          borderRadius: '10px',
          flexWrap: 'wrap'
        }}>
          <button 
            className={`tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            🎥 Movies
          </button>
          <button 
            className={`tab-btn ${activeTab === 'myBookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('myBookings')}
          >
            🎫 My Bookings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search Ticket
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`message ${
            message.includes('success') || message.includes('Found') ? 'success' : 
            message.includes('fail') || message.includes('error') ? 'error' : 'warning'
          }`}>
            {message}
          </div>
        )}

        {/* Booking Success Message */}
        {bookingSuccess && bookingDetails && (
          <div className="card booking-success">
            <h3>🎉 Booking Confirmed!</h3>
            <div className="booking-details-grid">
              <div><strong>Reference:</strong> {bookingDetails.referenceNumber || bookingDetails.bookingId}</div>
              <div><strong>Movie:</strong> {bookingDetails.movieTitle || bookingDetails.movie}</div>
              <div><strong>Show Time:</strong> {formatDate(bookingDetails.showTime)}</div>
              <div><strong>Seats:</strong> {bookingDetails.seats.join(', ')}</div>
              <div><strong>Total:</strong> {formatCurrency(bookingDetails.totalAmount || bookingDetails.total)}</div>
            </div>
            <p className="success-message">Enjoy your movie! 🍿</p>
          </div>
        )}

        {/* Booking Modal */}
        {selectedMovie && !bookingSuccess && (
          <div className="booking-modal-overlay">
            <div className="booking-modal">
              <div className="modal-movie-header">
                <img 
                  src={selectedMovie.poster} 
                  alt={selectedMovie.title}
                  className="modal-poster"
                />
                <div className="modal-movie-info">
                  <h2>{selectedMovie.title}</h2>
                  <p>{selectedMovie.genre} • {selectedMovie.releaseYear}</p>
                </div>
              </div>
              
              <div className="movie-details-modal">
                <p><strong>Duration:</strong> {selectedMovie.duration}</p>
                <p><strong>Rating:</strong> {selectedMovie.rating}</p>
                <p><strong>Price per ticket:</strong> {formatCurrency(selectedMovie.priceINR)}</p>
                <p><strong>Description:</strong> {selectedMovie.description}</p>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={confirmBooking}
                  disabled={loading}
                >
                  {loading ? 'Booking...' : `Confirm Booking (2 tickets - ${formatCurrency(selectedMovie.priceINR * 2)})`}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={cancelBookingModal}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Movies Tab Content */}
        {activeTab === 'movies' && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>🎥 Now Showing</h2>
            <div className="movies-grid">
              {movies.map(movie => (
                <div key={movie.id} className="movie-card">
                  <div className="movie-poster-container" data-alt={movie.title}>
                    <img 
                      src={movie.poster} 
                      alt={movie.title}
                      className="movie-poster"
                    />
                    <div className="rating-badge">{movie.rating}</div>
                  </div>
                  
                  <div className="movie-details">
                    <h3 className="movie-title">{movie.title}</h3>
                    
                    <div className="movie-meta">
                      <span className="movie-genre">{movie.genre}</span>
                      <span className="movie-duration">{movie.duration}</span>
                    </div>
                    
                    <p className="movie-description">{movie.description}</p>
                    
                    <div className="movie-price-section">
                      <div>
                        <span className="movie-price">{formatCurrency(movie.priceINR)}</span>
                        <span className="movie-price-per-ticket">per ticket</span>
                      </div>
                      <span className="movie-year">{movie.releaseYear}</span>
                    </div>
                    
                    <button 
                      className="book-ticket-btn"
                      onClick={() => handleBookTicket(movie)}
                      disabled={loading}
                    >
                      🎟️ Book Tickets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Bookings Tab Content */}
        {activeTab === 'myBookings' && (
          <div className="card">
            <div className="section-header">
              <h2>My Bookings ({bookings.length})</h2>
              <button 
                className="refresh-btn"
                onClick={fetchUserBookings}
                disabled={loading}
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                Loading your bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="no-bookings">
                <div className="empty-state">
                  <h3>No Bookings Yet</h3>
                  <p>You haven't made any bookings yet. Start by booking a movie!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('movies')}
                  >
                    Browse Movies
                  </button>
                </div>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map(booking => (
                  <BookingCard key={booking._id || booking.bookingId} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab Content */}
        {activeTab === 'search' && (
          <div className="card">
            <h2>🔍 Search Ticket by Reference Number</h2>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Enter reference number (e.g., REF001)"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchBooking()}
              />
              <button 
                onClick={searchBooking} 
                disabled={loading || !searchRef.trim()}
                className="search-btn"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              {searchRef && (
                <button onClick={clearSearch} className="clear-btn">
                  Clear
                </button>
              )}
            </div>

            {searchResult && (
              <div>
                <div className="result-header">
                  <h3>Search Result</h3>
                  <button onClick={clearSearch} className="clear-result">× Clear</button>
                </div>
                <BookingCard booking={searchResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;