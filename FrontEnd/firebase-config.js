// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjoqagCf1CidmibOVQbQvyfTl67Z71FSs",
  authDomain: "chat-72768.firebaseapp.com",
  projectId: "chat-72768",
  storageBucket: "chat-72768.firebasestorage.app",
  messagingSenderId: "3920318553",
  appId: "1:3920318553:web:d64f17a3fdfa34899ae148",
  measurementId: "G-C5M8101BNH"
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
