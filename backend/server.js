const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/boardings', require('./routes/boardingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/inspector', require('./routes/inspectorRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Review routes
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Notification routes
app.use('/api/notifications', require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));