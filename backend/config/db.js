const { MongoClient, ObjectId } = require('mongodb');

class Database {
    constructor() {
        this.uri = "mongodb+srv://jerry_db_user:jerry@cluster0.imaj4pw.mongodb.net/movie_ticket?retryWrites=true&w=majority";
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                return this.db;
            }

            console.log('🔗 Connecting to MongoDB Atlas...');
            this.client = new MongoClient(this.uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            await this.client.connect();
            this.db = this.client.db("movie_ticket");
            this.isConnected = true;

            console.log('✅ Connected to MongoDB Atlas - movie_ticket database');
            await this.initializeCollections();
            
            return this.db;

        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async initializeCollections() {
        try {
            const collections = ['users', 'movies', 'bookings', 'theaters'];
            
            for (const collectionName of collections) {
                const collection = this.db.collection(collectionName);
                const count = await collection.countDocuments();
                
                if (count === 0 && collectionName === 'bookings') {
                    // Insert sample bookings
                    await this.createSampleBookings();
                }
            }
            
        } catch (error) {
            console.error('❌ Error initializing collections:', error);
        }
    }

    async createSampleBookings() {
        const bookings = [
            {
                referenceNumber: 'REF001',
                userId: 'user123',
                userName: 'John Doe',
                userEmail: 'john@example.com',
                movieTitle: 'Inception',
                movieId: 'movie001',
                theater: 'PVR Cinemas',
                showTime: new Date('2024-12-25T18:00:00'),
                seats: ['A1', 'A2'],
                totalAmount: 1200,
                status: 'confirmed', // confirmed, cancelled, completed
                bookingDate: new Date(),
                paymentStatus: 'paid'
            },
            {
                referenceNumber: 'REF002',
                userId: 'user456',
                userName: 'Jane Smith',
                userEmail: 'jane@example.com',
                movieTitle: 'The Dark Knight',
                movieId: 'movie002',
                theater: 'INOX',
                showTime: new Date('2024-12-26T20:30:00'),
                seats: ['B5'],
                totalAmount: 600,
                status: 'confirmed',
                bookingDate: new Date(),
                paymentStatus: 'paid'
            }
        ];

        await this.db.collection('bookings').insertMany(bookings);
        console.log('✅ Sample bookings created');
    }

    // BOOKING MANAGEMENT FUNCTIONS

    /**
     * Get all bookings for a user
     */
    async getUserBookings(userId) {
        try {
            const collection = this.getCollection('bookings');
            const bookings = await collection.find({ userId }).sort({ bookingDate: -1 }).toArray();
            return bookings;
        } catch (error) {
            console.error('❌ Error fetching user bookings:', error);
            throw error;
        }
    }

    /**
     * Get booking by reference number
     */
    async getBookingByReference(referenceNumber) {
        try {
            const collection = this.getCollection('bookings');
            const booking = await collection.findOne({ referenceNumber });
            return booking;
        } catch (error) {
            console.error('❌ Error fetching booking by reference:', error);
            throw error;
        }
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(referenceNumber, userId = null) {
        try {
            const collection = this.getCollection('bookings');
            
            // Build query - either by reference number alone or with user ID for security
            const query = userId ? 
                { referenceNumber, userId } : 
                { referenceNumber };
            
            const result = await collection.updateOne(
                query,
                { 
                    $set: { 
                        status: 'cancelled',
                        cancelledAt: new Date(),
                        updatedAt: new Date()
                    } 
                }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Booking not found or already cancelled');
            }

            return { success: true, message: 'Booking cancelled successfully' };
        } catch (error) {
            console.error('❌ Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Create a new booking
     */
    async createBooking(bookingData) {
        try {
            const collection = this.getCollection('bookings');
            
            // Generate unique reference number
            const referenceNumber = await this.generateReferenceNumber();
            
            const booking = {
                ...bookingData,
                referenceNumber,
                status: 'confirmed',
                bookingDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.insertOne(booking);
            return { ...booking, _id: result.insertedId };
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            throw error;
        }
    }

    /**
     * Generate unique reference number
     */
    async generateReferenceNumber() {
        const collection = this.getCollection('bookings');
        const count = await collection.countDocuments();
        return `REF${String(count + 1).padStart(3, '0')}`;
    }

    /**
     * Search bookings with filters
     */
    async searchBookings(filters = {}) {
        try {
            const collection = this.getCollection('bookings');
            const query = {};

            if (filters.referenceNumber) {
                query.referenceNumber = filters.referenceNumber;
            }
            if (filters.userId) {
                query.userId = filters.userId;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.movieTitle) {
                query.movieTitle = { $regex: filters.movieTitle, $options: 'i' };
            }

            const bookings = await collection.find(query).sort({ bookingDate: -1 }).toArray();
            return bookings;
        } catch (error) {
            console.error('❌ Error searching bookings:', error);
            throw error;
        }
    }

    // Utility methods
    getCollection(collectionName) {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db.collection(collectionName);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('🔌 MongoDB connection closed');
        }
    }
}

const database = new Database();
module.exports = database;