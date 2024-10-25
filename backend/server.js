const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  energyPreferences: { type: String },
  investments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  walletBalance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Update Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  expectedReturn: { type: Number, required: true },
  totalInvestment: { type: Number, required: true },
  currentInvestment: { type: Number, default: 0 },
  investors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Project = mongoose.model('Project', projectSchema);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, location, energyPreferences } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      location,
      energyPreferences
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('User logged in:', user._id);
    res.json({ token, userId: user._id });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new route to get user profile
app.get('/api/profile', async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('Fetching profile for userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password');
    console.log('User found:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add routes for projects
app.post('/api/projects', async (req, res) => {
  try {
    const { name, location, capacity, expectedReturn, totalInvestment } = req.body;
    const newProject = new Project({
      name,
      location,
      capacity,
      expectedReturn,
      totalInvestment
    });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Add route to get wallet balance
app.get('/api/wallet', async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ balance: user.walletBalance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add route to add funds to wallet
app.post('/api/wallet/add', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.walletBalance += Number(amount);
    await user.save();
    res.json({ message: 'Funds added successfully', balance: user.walletBalance });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/invest', async (req, res) => {
  try {
    const { userId, projectId, amount } = req.body;
    const user = await User.findById(userId);
    const project = await Project.findById(projectId);

    if (!user || !project) {
      return res.status(404).json({ message: 'User or project not found' });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient funds in wallet' });
    }

    if (project.currentInvestment + amount > project.totalInvestment) {
      return res.status(400).json({ message: 'Investment amount exceeds project capacity' });
    }

    user.walletBalance -= amount;
    project.currentInvestment += amount;
    project.investors.push(user._id);
    await project.save();

    // Add the project to the user's investments if it's not already there
    if (!user.investments.includes(project._id)) {
    user.investments.push(project._id);
    }
    await user.save();

    res.json({ message: 'Investment successful', balance: user.walletBalance });
  } catch (error) {
    console.error('Error processing investment:', error);
    res.status(500).json({ message: 'Error processing investment', error: error.message });
  }
});

// Update the investments route to fetch real investments
app.get('/api/investments', async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId).populate('investments');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User investments:', user.investments);
    res.json(user.investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ message: 'Error fetching investments', error: error.message });
  }
});

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
});

// Make sure this is the last middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
