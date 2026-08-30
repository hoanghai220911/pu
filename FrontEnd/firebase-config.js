// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3w2HuYbREpi05NPjm4W6vU9KPPipOV3w",
  authDomain: "jsi15-2e42b.firebaseapp.com",
  projectId: "jsi15-2e42b",
  storageBucket: "jsi15-2e42b.firebasestorage.app",
  messagingSenderId: "208898390659",
  appId: "1:208898390659:web:fc0ff31e316cea071fb9b6",
  measurementId: "G-FYTVXFB7X0",
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
