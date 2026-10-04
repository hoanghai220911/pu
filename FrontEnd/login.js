const btnLogin = document.getElementById("btn-login");
let currentUser = null;

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        // Nếu là tài khoản admin thì chuyển thẳng tới trang quản trị
        if (user.email === 'admin@hoanghai.com') {
            window.location.href = "./admin.html";
        } else {
            window.location.href = "./index.html";
        }
    } 
});

btnLogin.addEventListener("click", async (e) => {
    e.preventDefault(); 
    const email = document.getElementById("txt-email").value.trim();
    const password = document.getElementById("txt-password").value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Kiểm tra trạng thái tài khoản: phải active mới được đăng nhập
            const userDoc = await db.collection(COLLECTION_USERS).doc(user.uid).get();
            if (userDoc.exists && userDoc.data().isActive === false) {
                alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!");
                await firebase.auth().signOut();
                return;
            }

            alert("Đăng nhập thành công! Chào mừng tới Real Pictures.");
            if (user.email === 'admin@hoanghai.com') {
                window.location.href = "./admin.html";
            } else {
                window.location.href = "./index.html";
            }
        })
        .catch((error) => {
            console.error("Lỗi đăng nhập:", error);
            alert("Sai email hoặc mật khẩu. Vui lòng kiểm tra lại!");
        });
});
