// Admin Dashboard JavaScript

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

document.addEventListener('DOMContentLoaded', async function() {
  // Get CSRF token first
  await getCsrfToken();
  
  // Check if user is logged in and is admin using cookie-based authentication
  try {
    const response = await fetchWithAuth('/api/auth/check-auth');
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    
    const data = await response.json();
    
    // Check if authenticated
    if (!data.isAuthenticated) {
      window.location.href = 'login.html';
      return;
    }
    
    // Check if user is admin
    if (data.user.role !== 'admin') {
      // Redirect non-admin users to regular dashboard
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Set admin username in UI
    document.getElementById('adminUsername').textContent = data.user.username;
  } catch (e) {
    console.error('Authentication error:', e);
    window.location.href = 'login.html';
    return;
  }

  // Fetch dashboard data
  fetchDashboardData();
  
  // Fetch users
  fetchUsers();

  // Set up event listeners
  setupEventListeners();
  
  // Initialize charts
  initializeCharts();
});

// Show custom alert box
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");
  if (!alertBox) return;
  
  alertBox.textContent = message;
  alertBox.className =
    "mb-4 px-4 py-3 rounded relative text-white text-sm " +
    (type === "success" ? "bg-green-500" : "bg-red-500");
  alertBox.classList.remove("hidden");
  
  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 3000);
}

// Fetch dashboard data
function fetchDashboardData() {
  fetchWithAuth('/api/dashboard')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    })
    .then(data => {
      // Update stats
      document.getElementById('totalUsers').textContent = data.stats.users;
      document.getElementById('activeUsers').textContent = data.stats.activeUsers;
      document.getElementById('newUsers').textContent = data.stats.newUsers;
    })
    .catch(error => {
      console.error('Error fetching dashboard data:', error);
      showAlert('Failed to load dashboard data');
    });
}

// Fetch all users
function fetchUsers() {
  fetchWithAuth('/api/users')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    })
    .then(users => {
      populateUserTable(users);
    })
    .catch(error => {
      console.error('Error fetching users:', error);
      showAlert('Failed to load users');
    });
}

// Populate user table
function populateUserTable(users) {
  const tableBody = document.getElementById('userTableBody');
  tableBody.innerHTML = '';
  
  users.forEach(user => {
    const row = document.createElement('tr');
    
    // Format date
    const createdDate = new Date(user.createdAt);
    const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                           createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.username}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
        }">
          ${user.role}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          class="text-indigo-600 hover:text-indigo-900 mr-2 edit-user" 
          data-id="${user.id}" 
          data-username="${user.username}" 
          data-email="${user.email}" 
          data-role="${user.role}">
          Edit
        </button>
        <button 
          class="text-red-600 hover:text-red-900 delete-user" 
          data-id="${user.id}">
          Delete
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners to edit/delete buttons
  document.querySelectorAll('.edit-user').forEach(button => {
    button.addEventListener('click', () => {
      openEditUserModal(button.dataset);
    });
  });
  
  document.querySelectorAll('.delete-user').forEach(button => {
    button.addEventListener('click', () => {
      openDeleteUserModal(button.dataset.id);
    });
  });
}

// Open user modal for adding a new user
function openAddUserModal() {
  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('userForm');
  
  modalTitle.textContent = 'Add User';
  form.reset();
  document.getElementById('userId').value = '';
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Open user modal for editing a user
function openEditUserModal(userData) {
  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('userForm');
  
  modalTitle.textContent = 'Edit User';
  document.getElementById('userId').value = userData.id;
  document.getElementById('modalUsername').value = userData.username;
  document.getElementById('modalEmail').value = userData.email;
  document.getElementById('modalPassword').value = ''; // Always blank for security
  document.getElementById('modalRole').value = userData.role;
  
  // Disable username field for existing users
  document.getElementById('modalUsername').disabled = true;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Close user modal
function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  
  // Reset and enable username field
  document.getElementById('modalUsername').disabled = false;
}

// Open delete confirmation modal
function openDeleteUserModal(userId) {
  const modal = document.getElementById('deleteModal');
  document.getElementById('deleteUserId').value = userId;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Close delete confirmation modal
function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Save user (create or update)
function saveUser() {
  const userId = document.getElementById('userId').value;
  const username = document.getElementById('modalUsername').value;
  const email = document.getElementById('modalEmail').value;
  const password = document.getElementById('modalPassword').value;
  const role = document.getElementById('modalRole').value;
  
  const userData = { username, email, role };
  if (password) {
    userData.password = password;
  }
  
  const url = userId ? `/api/users/${userId}` : '/api/users';
  const method = userId ? 'PUT' : 'POST';
  
  fetchWithAuth(url, {
    method,
    body: JSON.stringify(userData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw new Error(err.message || 'Error saving user'); });
    }
    return response.json();
  })
  .then(() => {
    showAlert(`User ${userId ? 'updated' : 'created'} successfully`, 'success');
    closeUserModal();
    fetchUsers(); // Refresh user table
  })
  .catch(error => {
    console.error('Error saving user:', error);
    showAlert(error.message || 'Failed to save user');
  });
}

// Delete user
function deleteUser() {
const userId = document.getElementById('deleteUserId').value;
  
fetchWithAuth(`/api/users/${userId}`, {
  method: 'DELETE'
})
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw new Error(err.message || 'Error deleting user'); });
    }
    return response.json();
  })
  .then(() => {
    showAlert('User deleted successfully', 'success');
    closeDeleteModal();
    fetchUsers(); // Refresh user table
  })
  .catch(error => {
    console.error('Error deleting user:', error);
    showAlert(error.message || 'Failed to delete user');
  });
}

// Initialize charts
function initializeCharts() {
const ctx = document.getElementById('activityChart').getContext('2d');
  
// Sample data - in a real app, this would come from your API
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const loginData = [12, 19, 15, 8, 22, 17];
const registrationData = [5, 8, 7, 3, 10, 6];
  
new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'Logins',
        data: loginData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Registrations',
        data: registrationData,
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
}

// Setup event listeners
function setupEventListeners() {
// Add user button
document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);
  
// Save user button
document.getElementById('saveUserBtn').addEventListener('click', saveUser);
  
// Cancel button (user modal)
document.getElementById('cancelBtn').addEventListener('click', closeUserModal);
  
// Delete confirmation button
document.getElementById('confirmDeleteBtn').addEventListener('click', deleteUser);
  
// Cancel delete button
document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  
// Logout button
document.getElementById('logoutButton').addEventListener('click', async () => {
  try {
    // Call the logout API endpoint to clear the cookie
    await fetchWithAuth('/api/auth/logout', {
      method: 'POST'
    });
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('Logout failed. Please try again.');
  }
});
}
