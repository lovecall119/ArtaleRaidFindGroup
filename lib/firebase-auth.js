// === 引入 Firebase SDK ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// === Firebase Config ===
const firebaseConfig = {
    apiKey: "AIzaSyBHRzRfcvPRevGBDDy2C9sAoy4U03R3tNc",
    authDomain: "artaleraidfindgroup.firebaseapp.com",
    projectId: "artaleraidfindgroup",
    storageBucket: "artaleraidfindgroup.firebasestorage.app",
    messagingSenderId: "98248894351",
    appId: "1:98248894351:web:56619d1c00e90bcb46cdfa",
    measurementId: "G-6M4HDHG8VM"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// === 確保登入狀態會被保留 ===
setPersistence(auth, browserLocalPersistence);

// === 登入按鈕事件 ===
document.getElementById("loginBtn").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            alert("登入成功！使用者：" + user.displayName);
        })
        .catch((error) => {
            console.error("登入失敗", error);
            alert("登入失敗：" + error.message);
        });
});

// === 登出按鈕事件 ===
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
        alert("已登出");
    }).catch((error) => {
        console.error("登出錯誤", error);
    });
});

// === 監聽登入狀態 ===
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userName = document.getElementById("userName");
    const status = document.getElementById("status");

    if (user) {
        // 已登入
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        userName.textContent = `歡迎，${user.displayName}`;
        status.style.display = "block";
    } else {
        // 未登入
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        userName.textContent = "";
        status.style.display = "none";
    }
});
