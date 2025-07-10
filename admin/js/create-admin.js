import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore,
    doc,
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBPy7mxS0Wj1lJ7SgvPOH4OyAVmxFqKJp4",
    authDomain: "headbyte-profile.firebaseapp.com",
    projectId: "headbyte-profile",
    storageBucket: "headbyte-profile.appspot.com",
    messagingSenderId: "1039601960821",
    appId: "1:1039601960821:web:c1b5f8c3f4b82b3c9c1c2f"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 관리자 계정 생성 함수
async function createAdmin(email, password) {
    try {
        // 사용자 계정 생성
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Firestore에 관리자 정보 저장
        await setDoc(doc(db, 'admins', user.uid), {
            email: email,
            role: 'admin',
            created_at: new Date().toISOString()
        });
        
        console.log('관리자 계정이 성공적으로 생성되었습니다.');
        return true;
    } catch (error) {
        console.error('관리자 계정 생성 중 오류 발생:', error);
        return false;
    }
}

// 관리자 계정 생성 실행
createAdmin('misun.moon@hotmail.com', 'mjms0987^^'); 