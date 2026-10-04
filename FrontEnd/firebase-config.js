// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig01 = {
  apiKey: "AIzaSyC3w2HuYbREpi05NPjm4W6vU9KPPipOV3w",
  authDomain: "jsi15-2e42b.firebaseapp.com",
  projectId: "jsi15-2e42b",
  storageBucket: "jsi15-2e42b.firebasestorage.app",
  messagingSenderId: "208898390659",
  appId: "1:208898390659:web:fc0ff31e316cea071fb9b6",
  measurementId: "G-FYTVXFB7X0"
};

const firebaseConfig = {
  apiKey: "AIzaSyB07tYy7QK_iPX0U1yha_4cINi0HNq8wt0",
  authDomain: "jsi-cp2-365cf.firebaseapp.com",
  projectId: "jsi-cp2-365cf",
  storageBucket: "jsi-cp2-365cf.firebasestorage.app",
  messagingSenderId: "243430112289",
  appId: "1:243430112289:web:f9d12ac5b054f39afcb760",
  measurementId: "G-9D5TN7SZVZ"
};


var db;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  db = firebase.firestore();
}

console.log("Firebase inintialized:", firebase.app().name);

// Định nghĩa tên các collection dùng chung (biến global)
const COLLECTION_USERS = "users-01";
const COLLECTION_IMAGE = "image";

