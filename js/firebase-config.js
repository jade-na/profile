// Firebase 설정
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// TODO: Firebase 콘솔에서 실제 설정값으로 교체 필요
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
const db = getFirestore(app);

// 폼 데이터 저장 함수
export async function saveFeedback(formData) {
  try {
    // 타임스탬프 추가
    const dataToSave = {
      ...formData,
      timestamp: new Date(),
      status: 'new',  // 신규 문의 상태
      source: window.location.href  // 문의가 발생한 페이지 URL
    };

    const docRef = await addDoc(collection(db, 'feedback'), dataToSave);
    console.log('피드백이 저장되었습니다. ID:', docRef.id);
    
    // 성공 시 true 반환
    return true;
  } catch (error) {
    console.error('피드백 저장 중 오류:', error);
    // 실패 시 false 반환
    return false;
  }
} 