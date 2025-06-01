// Authentication and common utility functions

// Store CSRF token
let csrfToken = '';

// Get CSRF token from server
async function getCsrfToken() {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include' // Include cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      console.log('CSRF token received');
    } else {
      console.error('Failed to get CSRF token');
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
  }
}

// Helper for fetch with credentials and CSRF token
async function fetchWithAuth(url, options = {}) {
  // Always include credentials for cookies
  const fetchOptions = {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken // Add CSRF token to headers
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Check authentication state
async function checkAuthState() {
  try {
    const response = await fetchWithAuth('/api/auth/check-auth');
    
    if (response.ok) {
      const data = await response.json();
      if (data.isAuthenticated) {
        // User is authenticated, handle based on role
        if (data.user.role === 'admin') {
          // Admin-specific actions if needed
        }
        return true;
      }
    }
    // Not authenticated
    return false;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Logout user
async function logoutUser() {
  try {
    const response = await fetchWithAuth('/api/auth/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      window.location.href = '/login.html';
    } else {
      showAlert('Logout failed. Please try again.');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('An error occurred during logout.');
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  // Form elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('loginUser');
  const registerBtn = document.getElementById('registerUser');
  const logoutBtn = document.getElementById('logoutBtn');

  // Get CSRF token for protected forms
  if (loginForm || registerForm) {
    await getCsrfToken();
  }

  // Check authentication state on non-auth pages
  const currentPath = window.location.pathname;
  if (currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath === '/' || currentPath === '/index.html') {
    // Check if already logged in and redirect if needed
    const isAuthenticated = await checkAuthState();
    if (isAuthenticated) {
      window.location.href = '/dashboard.html';
    }
  } else {
    // For pages that require authentication
    const isAuthenticated = await checkAuthState();
    if (!isAuthenticated && !currentPath.includes('login.html') && !currentPath.includes('register.html')) {
      window.location.href = '/login.html';
    }
  }

  // Attach event listeners
  if (registerBtn) {
    registerBtn.addEventListener('click', registerUser);
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', loginUser);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
});

// Show custom alert box
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  
  alertBox.textContent = message;
  alertBox.className =
    'max-w-xs mx-auto mt-4 mb-2 px-4 py-3 rounded relative text-white text-sm ' +
    (type === 'success' ? 'bg-green-500' : 'bg-red-500');
  alertBox.classList.remove('hidden');
  
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 3000);
}

// Login user
async function loginUser(event) {
  if (event) event.preventDefault();
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!username || !password) {
    showAlert('Please enter both username and password');
    return;
  }
  
  const loginButton = document.getElementById('loginUser');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
  }
  
  // Get fresh CSRF token if needed
  if (!csrfToken) {
    await getCsrfToken();
  }
  
  try {
    const response = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Check if CSRF token error and retry once
      if (response.status === 403 && data.message && data.message.includes('CSRF')) {
        await getCsrfToken();
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = 'Login';
        }
        return loginUser(event); // Try again with new token
      }
      
      showAlert(data.message || 'Login failed');
      return;
    }
    
    // Login successful
    showAlert('Login successful! Redirecting...', 'success');
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      if (data.user && data.user.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/dashboard.html';
      }
    }, 1500);
    
  } catch (error) {
    console.error('Login error:', error);
    showAlert('An error occurred. Please try again.');
  } finally {
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  }
}

// Register user
async function registerUser(event) {
  if (event) event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (!username || !email || !password) {
    showAlert('Please fill in all fields');
    return;
  }
  
  // Simple email validation
  if (!email.includes('@')) {
    showAlert('Please enter a valid email');
    return;
  }
  
  // Simple password validation
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters');
    return;
  }
  
  const registerButton = document.getElementById('registerUser');
  if (registerButton) {
    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';
  }
  
  // Get fresh CSRF token if needed
  if (!csrfToken) {
    await getCsrfToken();
  }
  
  try {
    const response = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Check if CSRF token error and retry once
      if (response.status === 403 && data.message && data.message.includes('CSRF')) {
        await getCsrfToken();
        if (registerButton) {
          registerButton.disabled = false;
          registerButton.textContent = 'Register';
        }
        return registerUser(event); // Try again with new token
      }
      
      showAlert(data.message || 'Registration failed');
      return;
    }
    
    // Registration successful
    showAlert('Registration successful! Redirecting to login...', 'success');
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    
  } catch (error) {
    console.error('Registration error:', error);
    showAlert('An error occurred. Please try again.');
  } finally {
    if (registerButton) {
      registerButton.disabled = false;
      registerButton.textContent = 'Register';
    }
  }
}