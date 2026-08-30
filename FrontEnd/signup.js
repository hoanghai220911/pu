const btnSignUp = document.getElementById("registerBtn");

btnSignUp.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("txt-email").value.trim();
  const password = document.getElementById("txt-password").value.trim();
  const confirmPassword = document.getElementById("txt-confirm-password").value.trim();

  if (!email) {
    alert("Vui lòng nhập email!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }

  if (password.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  firebase.auth().fetchSignInMethodsForEmail(email)
    .then((methods) => {
      if (methods.length > 0) {
        alert("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
        return;
      }
    })
    .catch((error) => {
      console.error("Lỗi kiểm tra email:", error);
    });

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      var user = userCredential.user;
      alert("Đăng ký tài khoản Real Pictures thành công! Chuyển hướng đến trang đăng nhập...");
      
      return firebase.auth().signOut().then(() => {
        window.location.href = "./login.html";
      });
    })
    .catch((error) => {
      console.error("Lỗi đăng ký:", error);
      alert("Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!");
    });
});
