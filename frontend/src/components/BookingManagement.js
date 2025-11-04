import React, { useState, useEffect } from 'react';
import './BookingManagement.css';

const BookingManagement = ({ user }) => {
    const [bookings, setBookings] = useState([]);
    const [searchRef, setSearchRef] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('myBookings');
    const [message, setMessage] = useState('');

    // Fetch user's bookings
    const fetchUserBookings = async () => {
        if (!user) return;
        
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/user/${user.id}`);
            const data = await response.json();
            
            if (data.success) {
                setBookings(data.data);
                if (data.data.length === 0) {
                    setMessage('You have no bookings yet.');
                }
            } else {
                setMessage('Failed to load bookings');
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setMessage('Failed to load bookings. Please check your connection.');
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
            const data = await response.json();
            
            if (data.success) {
                setSearchResult(data.data);
                setMessage('Booking found successfully!');
            } else {
                setSearchResult(null);
                setMessage('Booking not found');
            }
        } catch (error) {
            console.error('Search failed:', error);
            setMessage('Search failed. Please try again.');
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
            
            const data = await response.json();
            
            if (data.success) {
                setMessage('Booking cancelled successfully!');
                // Refresh bookings
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

    useEffect(() => {
        if (activeTab === 'myBookings' && user) {
            fetchUserBookings();
        } else {
            setMessage('');
        }
    }, [activeTab, user]);

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
                    <span className="value">{booking.movieTitle || 'Unknown Movie'}</span>
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
                    <span className="value amount">{formatCurrency(booking.totalAmount)}</span>
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
        <div className="booking-management">
            <div className="header-section">
                <h1>🎫 Booking Management</h1>
                {user && (
                    <div className="user-info">
                        Welcome, <strong>{user.username}</strong>
                    </div>
                )}
            </div>

            {message && (
                <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}
            
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'myBookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('myBookings')}
                >
                    My Bookings
                </button>
                <button 
                    className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    Search Ticket
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'myBookings' && (
                    <div className="my-bookings">
                        <div className="section-header">
                            <h2>My Bookings ({bookings.length})</h2>
                            <button 
                                className="refresh-btn"
                                onClick={fetchUserBookings}
                                disabled={loading}
                            >
                                🔄 Refresh
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

                {activeTab === 'search' && (
                    <div className="search-ticket">
                        <h2>Search Ticket by Reference Number</h2>
                        
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
                                <button 
                                    onClick={clearSearch}
                                    className="clear-btn"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {searchResult && (
                            <div className="search-result">
                                <div className="result-header">
                                    <h3>Search Result</h3>
                                    <button onClick={clearSearch} className="clear-result">×</button>
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

export default BookingManagement;