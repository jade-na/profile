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

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDsw3k0bWB6zt_Cp_kzxBZv4Kw3cZJcYR0",
    authDomain: "headbyte-profile.firebaseapp.com",
    projectId: "headbyte-profile",
    storageBucket: "headbyte-profile.appspot.com",
    messagingSenderId: "724533524124",
    appId: "1:724533524124:web:5f3d2b8c1d9e9f1a9b8c7d"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM 요소
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

// 현재 선택된 문서 ID
let selectedDocId = null;

// 인증 상태 관찰자
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadRequests(); // 데이터 로드
    } else {
        authContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

// 로그인 처리
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        loading.classList.remove('hidden');
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('로그인 실패: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

// 로그아웃 처리
logoutBtn.addEventListener('click', () => signOut(auth));

// 필터 이벤트 리스너
statusFilter.addEventListener('change', loadRequests);
dateFilter.addEventListener('change', loadRequests);
searchInput.addEventListener('input', debounce(loadRequests, 300));

// 상태 업데이트 처리
updateStatusBtn.addEventListener('click', async () => {
    if (!selectedDocId) return;
    
    try {
        loading.classList.remove('hidden');
        await updateDoc(doc(db, 'feedback', selectedDocId), {
            status: statusUpdate.value,
            updated_at: Timestamp.now()
        });
        
        detailModal.hide();
        loadRequests(); // 테이블 새로고침
    } catch (error) {
        alert('상태 업데이트 실패: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
});

// CSV 내보내기 버튼 이벤트 리스너
document.getElementById('export-csv').addEventListener('click', exportToCSV);

// CSV 내보내기 함수
async function exportToCSV() {
    try {
        loading.classList.remove('hidden');
        
        // 현재 필터 조건으로 데이터 가져오기
        const requests = await getFilteredRequests();
        
        // CSV 헤더
        const headers = [
            '요청일시',
            '상태',
            '이름',
            '회사',
            '직책',
            '이메일',
            '전화번호',
            '관심분야',
            '도입시기',
            'Pain Points',
            '추가 메시지',
            '출처'
        ];
        
        // CSV 데이터 생성
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
        
        // CSV 문자열 생성
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // 파일 다운로드
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `demo-requests-${formatDateForFilename(new Date())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('CSV 내보내기 실패:', error);
        alert('CSV 내보내기 중 오류가 발생했습니다.');
    } finally {
        loading.classList.add('hidden');
    }
}

// 현재 필터 조건으로 데이터 가져오기
async function getFilteredRequests() {
    // 쿼리 조건 구성
    let conditions = [];
    
    // 상태 필터
    const status = statusFilter.value;
    if (status) {
        conditions.push(where('status', '==', status));
    }
    
    // 날짜 필터
    const days = parseInt(dateFilter.value);
    if (days && days !== 'all') {
        const date = new Date();
        date.setDate(date.getDate() - days);
        conditions.push(where('timestamp', '>=', Timestamp.fromDate(date)));
    }
    
    // 쿼리 실행
    const q = query(
        collection(db, 'feedback'),
        ...conditions,
        orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    // 검색어 필터링
    const searchTerm = searchInput.value.toLowerCase();
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // 검색어로 필터링
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

// 파일명용 날짜 포맷
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
}

// 요청 데이터 로드
async function loadRequests() {
    try {
        loading.classList.remove('hidden');
        
        // 쿼리 조건 구성
        let conditions = [];
        
        // 상태 필터
        const status = statusFilter.value;
        if (status) {
            conditions.push(where('status', '==', status));
        }
        
        // 날짜 필터
        const days = parseInt(dateFilter.value);
        if (days && days !== 'all') {
            const date = new Date();
            date.setDate(date.getDate() - days);
            conditions.push(where('timestamp', '>=', Timestamp.fromDate(date)));
        }
        
        // 쿼리 실행
        const q = query(
            collection(db, 'feedback'),
            ...conditions,
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const requests = [];
        
        // 검색어 필터링
        const searchTerm = searchInput.value.toLowerCase();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 검색어로 필터링
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
        
        // 테이블 렌더링
        renderTable(requests);
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('데이터 로드 실패: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
}

// 테이블 렌더링
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
                <button class="btn btn-sm btn-primary" onclick="showDetails('${request.id}')">상세보기</button>
            </td>
        </tr>
    `).join('');
}

// 상세 정보 표시
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
                        <p><strong>이름:</strong> ${data.name}</p>
                        <p><strong>회사:</strong> ${data.company}</p>
                        <p><strong>직책:</strong> ${data.position}</p>
                        <p><strong>이메일:</strong> ${data.email}</p>
                        <p><strong>전화번호:</strong> ${data.phone}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>관심분야:</strong> ${data.interest}</p>
                        <p><strong>도입시기:</strong> ${data.timeline}</p>
                        <p><strong>요청일:</strong> ${formatDate(data.timestamp)}</p>
                        <p><strong>출처:</strong> ${data.source || '알 수 없음'}</p>
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
                        <p><strong>추가 메시지:</strong></p>
                        <p>${data.message || '없음'}</p>
                    </div>
                </div>
            `;
            
            detailModal.show();
        }
    } catch (error) {
        console.error('상세 정보 로드 실패:', error);
        alert('상세 정보 로드 실패: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
};

// 유틸리티 함수
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getStatusText(status) {
    const statusMap = {
        'new': '신규',
        'in-progress': '진행중',
        'completed': '완료',
        'rejected': '거절'
    };
    return statusMap[status] || '신규';
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