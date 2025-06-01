// User Dashboard JavaScript
// Reference to CSRF token from script.js
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

document.addEventListener("DOMContentLoaded", async function () {
  // Get CSRF token first
  await getCsrfToken();
  // Check if user is logged in using cookie-based authentication
  try {
    const response = await fetch("/api/auth/check-auth", {
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      throw new Error("Not authenticated");
    }

    const data = await response.json();

    // Check if authenticated
    if (!data.isAuthenticated) {
      window.location.href = "login.html";
      return;
    }

    // Check if user is admin, redirect to admin dashboard if needed
    if (data.user.role === "admin") {
      window.location.href = "admin-dashboard.html";
      return;
    }

    // Set user welcome message
    document.getElementById(
      "userWelcome"
    ).textContent = `Welcome, ${data.user.username}!`;
  } catch (e) {
    console.error("Authentication error:", e);
    window.location.href = "login.html";
    return;
  }

  // Fetch dashboard data
  fetchWithAuth("/api/dashboard")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    })
    .then((data) => {
      // Populate recent activity
      populateRecentActivity(data.recentActivity);
    })
    .catch((error) => {
      console.error("Error fetching dashboard data:", error);
      showAlert("Failed to load dashboard data");
    });

  // Initialize charts
  initializeActivityChart();

  // Setup event listeners
  setupEventListeners();
});

// Show custom alert box
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.className =
    "max-w-md mx-auto mt-4 px-4 py-3 rounded relative text-white text-sm " +
    (type === "success" ? "bg-green-500" : "bg-red-500");
  alertBox.classList.remove("hidden");

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 3000);
}

// Fetch dashboard data for the user
function fetchDashboardData() {
  fetchWithAuth("/api/dashboard")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    })
    .then((data) => {
      // Populate recent activity
      populateRecentActivity(data.recentActivity);
    })
    .catch((error) => {
      console.error("Error fetching dashboard data:", error);
      showAlert("Failed to load dashboard data");
    });
}

// Populate recent activity
function populateRecentActivity(activities) {
  const activityContainer = document.getElementById("recentActivity");
  activityContainer.innerHTML = "";

  if (!activities || activities.length === 0) {
    activityContainer.innerHTML =
      '<p class="text-sm text-gray-500 py-3">No recent activity</p>';
    return;
  }

  activities.forEach((activity) => {
    // Format the timestamp
    const date = new Date(activity.timestamp);
    const formattedDate =
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const activityItem = document.createElement("div");
    activityItem.className = "py-3";
    activityItem.innerHTML = `
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800">${activity.action}</p>
          <p class="text-xs text-gray-500">${formattedDate}</p>
        </div>
      </div>
    `;

    activityContainer.appendChild(activityItem);
  });
}

// Initialize activity chart
function initializeActivityChart() {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js is not loaded.");
    showAlert("Unable to load chart. Please try again later.");
    return;
  }

  const ctx = document.getElementById("activityChart").getContext("2d");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const activityData = [5, 7, 3, 8, 6, 2, 4];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [
        {
          label: "Your Activity",
          data: activityData,
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
          },
        },
      },
    },
  });
}

// Setup event listeners
function setupEventListeners() {
  // Logout button
  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      try {
        // Call the logout API endpoint with CSRF token
        await fetchWithAuth("/api/auth/logout", {
          method: "POST"
        });
        window.location.href = "login.html";
      } catch (error) {
        console.error("Logout error:", error);
        showAlert("Logout failed. Please try again.");
      }
    });
}
