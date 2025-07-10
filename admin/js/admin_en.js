import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDsw3k0bWB6zt_Cp_kzxBZv4Kw3cZJcYR0",
    authDomain: "headbyte-profile.firebaseapp.com",
    projectId: "headbyte-profile",
    storageBucket: "headbyte-profile.appspot.com",
    messagingSenderId: "724533524124",
    appId: "1:724533524124:web:5f3d2b8c1d9e9f1a9b8c7d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loading = document.getElementById('loading');
const statusFilter = document.getElementById('status-filter');
const dateFilter = document.getElementById('date-filter');
const searchInput = document.getElementById('search');
const requestsTableBody = document.getElementById('requests-table-body');
const detailModal = new bootstrap.Modal(document.getElementById('detail-modal'));
const detailContent = document.getElementById('detail-content');
const statusUpdate = document.getElementById('status-update');
const updateStatusBtn = document.getElementById('update-status-btn');

// Currently selected document ID
let selectedDocId = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadRequests(); // Load data
    } else {
        authContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        loading.classList.remove('hidden');
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Login failed: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

// Logout handler
logoutBtn.addEventListener('click', () => signOut(auth));

// Filter event listeners
statusFilter.addEventListener('change', loadRequests);
dateFilter.addEventListener('change', loadRequests);
searchInput.addEventListener('input', debounce(loadRequests, 300));

// Status update handler
updateStatusBtn.addEventListener('click', async () => {
    if (!selectedDocId) return;
    
    try {
        loading.classList.remove('hidden');
        await updateDoc(doc(db, 'feedback', selectedDocId), {
            status: statusUpdate.value,
            updated_at: Timestamp.now()
        });
        
        detailModal.hide();
        loadRequests(); // Refresh table
    } catch (error) {
        alert('Status update failed: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

// Load request data
async function loadRequests() {
    try {
        loading.classList.remove('hidden');
        
        // Build query conditions
        let conditions = [];
        
        // Status filter
        const status = statusFilter.value;
        if (status) {
            conditions.push(where('status', '==', status));
        }
        
        // Date filter
        const days = parseInt(dateFilter.value);
        if (days && days !== 'all') {
            const date = new Date();
            date.setDate(date.getDate() - days);
            conditions.push(where('timestamp', '>=', Timestamp.fromDate(date)));
        }
        
        // Execute query
        const q = query(
            collection(db, 'feedback'),
            ...conditions,
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const requests = [];
        
        // Search term filtering
        const searchTerm = searchInput.value.toLowerCase();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter by search term
            if (searchTerm) {
                const searchableFields = [
                    data.name,
                    data.company,
                    data.email
                ].map(field => (field || '').toLowerCase());
                
                if (!searchableFields.some(field => field.includes(searchTerm))) {
                    return;
                }
            }
            
            requests.push({
                id: doc.id,
                ...data
            });
        });
        
        // Render table
        renderTable(requests);
        
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
}

// Render table
function renderTable(requests) {
    requestsTableBody.innerHTML = requests.map(request => `
        <tr>
            <td>${formatDate(request.timestamp)}</td>
            <td><span class="status-${request.status || 'new'}">${getStatusText(request.status)}</span></td>
            <td>${request.name}</td>
            <td>${request.company}</td>
            <td>${request.position}</td>
            <td>${request.email}</td>
            <td>${request.phone}</td>
            <td>${request.interest}</td>
            <td>${request.timeline}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showDetails('${request.id}')">View Details</button>
            </td>
        </tr>
    `).join('');
}

// Show details
window.showDetails = async (docId) => {
    try {
        loading.classList.remove('hidden');
        
        const docRef = doc(db, 'feedback', docId);
        const docSnap = await getDocs(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            selectedDocId = docId;
            statusUpdate.value = data.status || 'new';
            
            detailContent.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Company:</strong> ${data.company}</p>
                        <p><strong>Position:</strong> ${data.position}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Phone:</strong> ${data.phone}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Interest:</strong> ${data.interest}</p>
                        <p><strong>Timeline:</strong> ${data.timeline}</p>
                        <p><strong>Request Date:</strong> ${formatDate(data.timestamp)}</p>
                        <p><strong>Source:</strong> ${data.source || 'Unknown'}</p>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <p><strong>Pain Points:</strong></p>
                        <ul>
                            ${(data.pain_points || []).map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <p><strong>Additional Message:</strong></p>
                        <p>${data.message || 'None'}</p>
                    </div>
                </div>
            `;
            
            detailModal.show();
        }
    } catch (error) {
        console.error('Failed to load details:', error);
        alert('Failed to load details: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
};

// Utility functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getStatusText(status) {
    const statusMap = {
        'new': 'New',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'rejected': 'Rejected'
    };
    return statusMap[status] || 'New';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export CSV button event listener
document.getElementById('export-csv').addEventListener('click', exportToCSV);

// Export to CSV function
async function exportToCSV() {
    try {
        loading.classList.remove('hidden');
        
        // Get data with current filters
        const requests = await getFilteredRequests();
        
        // CSV headers
        const headers = [
            'Request Date',
            'Status',
            'Name',
            'Company',
            'Position',
            'Email',
            'Phone',
            'Interest',
            'Timeline',
            'Pain Points',
            'Additional Message',
            'Source'
        ];
        
        // Generate CSV data
        const csvData = requests.map(request => [
            formatDate(request.timestamp),
            getStatusText(request.status),
            request.name,
            request.company,
            request.position,
            request.email,
            request.phone,
            request.interest,
            request.timeline,
            (request.pain_points || []).join(', '),
            request.message || '',
            request.source || ''
        ]);
        
        // Create CSV string
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `demo-requests-${formatDateForFilename(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Failed to export CSV:', error);
        alert('An error occurred while exporting CSV.');
    } finally {
        loading.classList.add('hidden');
    }
}

// Get data with current filters
async function getFilteredRequests() {
    // Build query conditions
    let conditions = [];
    
    // Status filter
    const status = statusFilter.value;
    if (status) {
        conditions.push(where('status', '==', status));
    }
    
    // Date filter
    const days = parseInt(dateFilter.value);
    if (days && days !== 'all') {
        const date = new Date();
        date.setDate(date.getDate() - days);
        conditions.push(where('timestamp', '>=', Timestamp.fromDate(date)));
    }
    
    // Execute query
    const q = query(
        collection(db, 'feedback'),
        ...conditions,
        orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    // Search term filtering
    const searchTerm = searchInput.value.toLowerCase();
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter by search term
        if (searchTerm) {
            const searchableFields = [
                data.name,
                data.company,
                data.email
            ].map(field => (field || '').toLowerCase());
            
            if (!searchableFields.some(field => field.includes(searchTerm))) {
                return;
            }
        }
        
        requests.push({
            id: doc.id,
            ...data
        });
    });
    
    return requests;
}

// Format date for filename
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
} 