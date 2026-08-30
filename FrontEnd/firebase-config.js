// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtb49oRNQ70h6qI6Xj5qlVS3qG1BV64Ls",
  authDomain: "cofee-management-ae437.firebaseapp.com",
  projectId: "cofee-management-ae437",
  storageBucket: "cofee-management-ae437.firebasestorage.app",
  messagingSenderId: "412796817583",
  appId: "1:412796817583:web:ec419f63a5be9fddd1c45a",
  measurementId: "G-YBBC6YRPLZ"
};

var db;

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    db = firebase.firestore();
}

console.log("Firebase inintialized:", firebase.app().name);

db.collection("products")
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      console.log(product);
    });
  });