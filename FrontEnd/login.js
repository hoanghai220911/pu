const btnLogin = document.getElementById("btn-login");
let currentUser = null;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        window.location.href = "./index.html"; 
    } 
});

btnLogin.addEventListener("click", async (e) => {
    e.preventDefault(); 
    const email = document.getElementById("txt-email").value.trim();
    const password = document.getElementById("txt-password").value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Đăng nhập thành công! Chào mừng tới Real Pictures.");
            window.location.href = "./index.html";
        })
        .catch((error) => {
            console.error("Lỗi đăng nhập:", error);
            alert("Sai email hoặc mật khẩu. Vui lòng kiểm tra lại!");
        });
});
