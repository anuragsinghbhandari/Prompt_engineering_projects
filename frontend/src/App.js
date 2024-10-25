import React, { useState, useEffect } from 'react';
import './App.css';
import { FaSun, FaWallet, FaChartLine, FaSignOutAlt } from 'react-icons/fa';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [energyPreferences, setEnergyPreferences] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [view, setView] = useState('register'); // 'register', 'login', 'profile', or 'dashboard'
  const [projects, setProjects] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  useEffect(() => {
    if (userId) {
      console.log('Fetching user data for ID:', userId);
      fetchUserProfile();
      fetchInvestments();
      fetchProjects();
      fetchWalletBalance();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      if (!userId) {
        console.error('User ID is missing');
        return;
      }
      console.log('Fetching user profile for ID:', userId);
      const response = await fetch(`http://localhost:5000/api/profile?userId=${userId}`);
      console.log('Profile response status:', response.status);
      const data = await response.json();
      console.log('Profile data:', data);
      if (response.ok) {
        setUserProfile(data);
      } else {
        setMessage(data.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setMessage('An error occurred while fetching user profile');
    }
  };

  const fetchInvestments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/investments?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setInvestments(data);
      } else {
        setMessage(`Failed to fetch investments: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
      setMessage(`An error occurred while fetching investments: ${error.message}`);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      } else {
        setMessage('Failed to fetch projects');
      }
    } catch (error) {
      setMessage('An error occurred while fetching projects');
    }
  };

  const fetchWalletBalance = async () => {
    try {
      console.log('Fetching wallet balance for user ID:', userId);
      const response = await fetch(`http://localhost:5000/api/wallet?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      const data = await response.json();
      console.log('Wallet balance data:', data);
      setWalletBalance(data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setMessage(`An error occurred while fetching wallet balance: ${error.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, location, energyPreferences }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registration successful! Please log in.');
        setView('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setLocation('');
        setEnergyPreferences('');
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login successful, user data:', data);
        setUserId(data.userId);
        setIsLoggedIn(true);
        setView('dashboard');
        setMessage('');
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId('');
    setUserProfile(null);
    setInvestments([]);
    setView('login');
    setEmail('');
    setPassword('');
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      if (!addFundsAmount || Number(addFundsAmount) <= 0) {
        setMessage('Please enter a valid amount to add');
        return;
      }
      console.log('Adding funds:', addFundsAmount);
      const response = await fetch('http://localhost:5000/api/wallet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount: Number(addFundsAmount) }),
      });
      const data = await response.json();
      console.log('Add funds response:', data);
      if (response.ok) {
        setWalletBalance(data.balance);
        setMessage('Funds added successfully');
        setAddFundsAmount('');
      } else {
        setMessage(data.message || 'Failed to add funds');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      setMessage('An error occurred while adding funds');
    }
  };

  const handleInvest = async (projectId) => {
    try {
      if (investmentAmount <= 0) {
        setMessage('Please enter a valid investment amount');
        return;
      }

      if (investmentAmount > walletBalance) {
        setMessage('Insufficient funds in wallet');
        return;
      }

      const response = await fetch('http://localhost:5000/api/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, projectId, amount: Number(investmentAmount) }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Investment successful!');
        setWalletBalance(data.balance);
        fetchInvestments();
        fetchProjects();
        setInvestmentAmount('');
      } else {
        setMessage(data.message || 'Investment failed');
      }
    } catch (error) {
      setMessage('An error occurred while processing the investment');
    }
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {userProfile?.name}</h2>
        <p className="balance">Wallet Balance: ${walletBalance.toFixed(2)}</p>
      </div>
      <div className="dashboard-grid">
        <div className="wallet-section">
          <h3><FaWallet /> Add Funds</h3>
          <form onSubmit={handleAddFunds} className="add-funds-form">
            <input
              type="number"
              value={addFundsAmount}
              onChange={(e) => setAddFundsAmount(e.target.value)}
              placeholder="Amount to add"
              min="0"
              step="0.01"
            />
            <button type="submit" className="btn-primary">Add Funds</button>
          </form>
        </div>

        <div className="investments-section">
          <h3><FaChartLine /> Your Investments</h3>
          {investments.length > 0 ? (
            <ul className="investment-list">
              {investments.map((investment) => (
                <li key={investment._id} className="investment-item">
                  <h4>{investment.name}</h4>
                  <p>Invested: ${investment.currentInvestment.toFixed(2)}</p>
                  <p>Expected Return: {investment.expectedReturn}%</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No investments yet. Start investing in projects below!</p>
          )}
        </div>
      </div>

      <div className="projects-section">
        <h3><FaSun /> Available Projects</h3>
        {selectedProject ? (
          renderProjectDetails(selectedProject)
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <div key={project._id} className="project-card" onClick={() => setSelectedProject(project)}>
                <h4>{project.name}</h4>
                <p>Location: {project.location}</p>
                <p>Expected Return: {project.expectedReturn}%</p>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${(project.currentInvestment / project.totalInvestment) * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  ${project.currentInvestment.toFixed(2)} / ${project.totalInvestment.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProjectDetails = (project) => (
    <div className="project-details">
      <h3>{project.name}</h3>
      <p>Location: {project.location}</p>
      <p>Capacity: {project.capacity}kW</p>
      <p>Expected Return: {project.expectedReturn}%</p>
      <div className="progress-bar">
        <div
          className="progress"
          style={{ width: `${(project.currentInvestment / project.totalInvestment) * 100}%` }}
        ></div>
      </div>
      <p className="progress-text">
        ${project.currentInvestment.toFixed(2)} / ${project.totalInvestment.toFixed(2)}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); handleInvest(project._id); }} className="invest-form">
        <input
          type="number"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="Investment amount"
          min="0"
          step="0.01"
        />
        <button type="submit" className="btn-primary">Invest</button>
      </form>
      <button onClick={() => setSelectedProject(null)} className="btn-secondary">Back to Projects</button>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1><FaSun /> SolarShare</h1>
        {isLoggedIn && (
          <nav>
            <button onClick={() => setView('dashboard')} className="btn-nav">Dashboard</button>
            <button onClick={() => setView('profile')} className="btn-nav">Profile</button>
            <button onClick={handleLogout} className="btn-nav"><FaSignOutAlt /> Logout</button>
          </nav>
        )}
      </header>

      <main className="App-main">
        {view === 'register' && (
          <div className="auth-form">
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
              <input type="text" value={energyPreferences} onChange={(e) => setEnergyPreferences(e.target.value)} placeholder="Energy Preferences" />
              <button type="submit" className="btn-primary">Register</button>
            </form>
            <p>Already have an account? <button onClick={() => setView('login')} className="btn-link">Login</button></p>
          </div>
        )}

        {view === 'login' && (
          <div className="auth-form">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLogin}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <button type="submit" className="btn-primary">Login</button>
            </form>
            <p>Don't have an account? <button onClick={() => setView('register')} className="btn-link">Register</button></p>
          </div>
        )}

        {view === 'profile' && userProfile && (
          <div className="profile">
            <h2>Your Profile</h2>
            <div className="profile-info">
              <p><strong>Name:</strong> {userProfile.name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Location:</strong> {userProfile.location}</p>
              <p><strong>Energy Preferences:</strong> {userProfile.energyPreferences}</p>
            </div>
          </div>
        )}

        {view === 'dashboard' && renderDashboard()}
      </main>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App;
