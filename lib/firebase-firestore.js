// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { doc,getFirestore, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBHRzRfcvPRevGBDDy2C9sAoy4U03R3tNc",
    authDomain: "artaleraidfindgroup.firebaseapp.com",
    projectId: "artaleraidfindgroup",
    storageBucket: "artaleraidfindgroup.firebasestorage.app",
    messagingSenderId: "98248894351",
    appId: "1:98248894351:web:56619d1c00e90bcb46cdfa",
    measurementId: "G-6M4HDHG8VM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

//新增成員資訊
export async function addMemberInfo(memberInfo){
    try {
    const docRef = await addDoc(collection(db, "users"), {
        name:memberInfo.name,
        job:memberInfo.job,
        rounds:memberInfo.rounds,
        days:memberInfo.days,
        prefs:memberInfo.prefs
    });
    console.log("Document written with ID: ", docRef.id);
    } catch (e) {
    console.error("Error adding document: ", e);
    }
}

//獲取成員資訊
export async function getMemberInfo(){
    const res = [];
    let obj = {};
    //return getDocs(collection(db, "users"));
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
    obj = doc.data();
    obj.id = doc.id;
    res.push(obj);
    //console.log(`${doc.id} => ${doc.data()}`);
    });
    return res;
}

//刪除成員資訊
export async function deleteMemberInfo(idx){
    await deleteDoc(doc(db, "users", idx));
}