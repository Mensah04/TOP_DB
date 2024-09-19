const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');

const app = express();
app.use(cors());

app.use(bodyParser.json()); // to parse JSON-formatted body data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb+srv://Mensah04:Josef2024@cluster0.fat7n.mongodb.net/followups?retryWrites=true&w=majority', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error.message); // Log connection error
    setTimeout(() => {
        mongoose.connect('mongodb+srv://Mensah04:Josef2024@cluster0.fat7n.mongodb.net/followups?retryWrites=true&w=majority');
    }, 5000); // Retry connection after 5 seconds
});


// User Authentication
const PREDEFINED_USER = {
    username: 'Rccg@top',
    password: bcrypt.hashSync('top2024', 10)
};

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        return res.redirect('/');
    }
}

app.use(session({
    secret: 'RCCG_TOP',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://Mensah04:Josef2024@cluster0.fat7n.mongodb.net/followups?retryWrites=true&w=majority',
        ttl: 14 * 24 * 60 * 60 // Expiration time in seconds (14 days)
    }),
    cookie: { maxAge: 10 * 10 * 1000 }
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// User Schema and Model
const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    email: String,
    date: String,
    comment: String
});

const User = mongoose.model('User', userSchema);

// FollowUp Schema and Model
const followUpSchema = new mongoose.Schema({
    name: String,
    status: String,
    recentFollowUp: String,
    byWho: String,
    dateFollowedUp: String
});

const FollowUp = mongoose.model('FollowUp', followUpSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login
app.post('/api/login', (req, res) => {
    console.log(req.body); 
    const { username, password } = req.body;
    console.log('Received username:', username);
    console.log('Received password:', password);

    if (username === PREDEFINED_USER.username && bcrypt.compareSync(password, PREDEFINED_USER.password)) {
        req.session.userId = PREDEFINED_USER.username;
        console.log('Login successful');
        return res.redirect('/index.html');
    } else {
        console.log('Login failed: Invalid username or password');
        return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, phone, address, email, date, comment } = req.body;
    try {
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).send({ message: 'A member with the same phone number already exists' });
        }
        const newUser = new User({ name, phone, address, email, date, comment });
        await newUser.save();
        res.status(201).send(newUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ _id: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/search', async (req, res) => {
    const { name } = req.query;
    try {
        const users = await User.find({ name: new RegExp(name, 'i') });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { comment, date } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(id, { comment, date }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// FollowUp APIs
app.post('/api/followups', async (req, res) => {
    const { name, status, recentFollowUp, byWho, dateFollowedUp } = req.body;
    try {
        const newFollowUp = new FollowUp({ name, status, recentFollowUp, byWho, dateFollowedUp });
        await newFollowUp.save();
        res.status(201).json(newFollowUp);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/followups', async (req, res) => {
    try {
        const followups = await FollowUp.find().sort({ _id: -1 });
        res.json(followups);
    } catch (error) {
        console.error('Error loading follow-ups:', error);
        res.status(500).json({ message: 'Error loading follow-ups', error: error.message });
    }
});

app.put('/api/followups/:id', async (req, res) => {
    const { id } = req.params;
    const { name, status, recentFollowUp, byWho, dateFollowedUp } = req.body;
    try {
        const updatedFollowUp = await FollowUp.findByIdAndUpdate(id, { name, status, recentFollowUp, byWho, dateFollowedUp }, { new: true });
        res.json(updatedFollowUp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/followups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await FollowUp.findByIdAndDelete(id);
        res.json({ message: 'Follow-up deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/index.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Received username:', username);
    console.log('Received password:', password);

    if (username === PREDEFINED_USER.username && bcrypt.compareSync(password, PREDEFINED_USER.password)) {
        req.session.userId = PREDEFINED_USER.username;
        console.log('Login successful');
        return res.redirect('/index.html');
    } else {
        console.log('Login failed: Invalid username or password');
        return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
});

// Protect routes like index.html and followup.html
app.get('/index.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/followup.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'followup.html'));
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
