document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user profile data
    loadUserProfile();

    // Setup event listeners
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('password-form').addEventListener('submit', changePassword);
    document.getElementById('enable2fa').addEventListener('click', enable2FA);
    document.getElementById('logout-btn').addEventListener('click', logout);
});

// Load user profile data from the server
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const userData = await response.json();
        
        // Update UI with user data
        document.getElementById('user-fullname').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('user-role').textContent = userData.role;
        document.getElementById('username').value = userData.username;
        document.getElementById('email').value = userData.email;
        document.getElementById('firstName').value = userData.firstName;
        document.getElementById('lastName').value = userData.lastName;
        document.getElementById('phone').value = userData.phone || '';

        // Load activity history
        loadActivityHistory();
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data. Please try again later.', 'danger');
    }
}

// Update user profile information
async function updateProfile(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const userData = {
            email: document.getElementById('email').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value
        };

        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        showAlert('Profile updated successfully!', 'success');
        
        // Refresh profile data
        loadUserProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile. Please try again.', 'danger');
    }
}

// Change user password
async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match!', 'danger');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const passwordData = {
            currentPassword,
            newPassword
        };

        const response = await fetch('/api/users/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });

        if (!response.ok) {
            throw new Error('Failed to change password');
        }

        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showAlert('Password changed successfully!', 'success');
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Failed to change password. Please check your current password and try again.', 'danger');
    }
}

// Enable Two-Factor Authentication
function enable2FA() {
    // This would typically connect to a 2FA setup flow
    showAlert('Two-factor authentication setup will be available soon!', 'info');
}

// Load user activity history
async function loadActivityHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/activity', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load activity history');
        }

        const activities = await response.json();
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<li class="list-group-item">No recent activity found.</li>';
            return;
        }
        
        activities.forEach(activity => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <strong>${activity.type}</strong>
                    <p class="text-muted mb-0">${activity.description}</p>
                </div>
                <span class="text-muted">${formatDate(activity.timestamp)}</span>
            `;
            activityList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading activity history:', error);
        // Just display a placeholder if we can't load real activity
        document.getElementById('activity-list').innerHTML = `
            <li class="list-group-item">
                <div class="text-center">
                    <p>Could not load activity history.</p>
                </div>
            </li>
        `;
    }
}

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Display alert message
function showAlert(message, type) {
    // Check if alert container exists, if not create it
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(alertContainer);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
