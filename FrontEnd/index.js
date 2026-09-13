// Cấu hình Cloudinary
const CLOUD_NAME = "YOUR_CLOUD_NAME";
const UPLOAD_PRESET = "YOUR_UNSIGNED_PRESET";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

let currentUser = null;

// Kiểm tra Auth State
firebase.auth().onAuthStateChanged(async (user) => {
  const authActions = document.getElementById("auth-actions");
  const userProfile = document.getElementById("user-profile");
  const userEmailDisplay = document.getElementById("user-email-display");
  const uploadContainer = document.getElementById("upload-container");

  if (user) {
    currentUser = user;

    // Bắt lỗi khi đọc tài khoản từ Firestore
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists && userDoc.data().isBanned) {
        alert("Tài khoản của bạn tạm thời đã bị khóa!");
        firebase.auth().signOut();
        return;
      }

      if (userDoc.exists && userDoc.data().role === "admin") {
        const adminLink = document.getElementById("admin-link");
        if (adminLink) adminLink.style.display = "inline-flex";
      }
    } catch (e) {
      console.warn("Lưu ý: Không thể lấy dữ liệu user từ Firestore:", e);
    }

    // Hiển thị giao diện Đã Đăng Nhập
    if (authActions) authActions.style.display = "none";
    if (userProfile) userProfile.style.display = "flex";
    if (uploadContainer) uploadContainer.style.display = "block";
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;
  } else {
    // Giao diện Chưa Đăng Nhập
    currentUser = null;
    if (authActions) authActions.style.display = "flex";
    if (userProfile) userProfile.style.display = "none";
    if (uploadContainer) uploadContainer.style.display = "none";
  }
});

// Xử lý Upload Ảnh lên Cloudinary -> Lưu Firestore
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Vui lòng đăng nhập!");

    const fileInput = document.getElementById("img-file");
    const captionInput = document.getElementById("img-caption");
    const btnUpload = document.getElementById("btn-upload");

    const file = fileInput.files[0];
    if (!file) return;

    try {
      btnUpload.disabled = true;
      btnUpload.innerText = "Đang tải...";

      // 1. Tải lên Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.secure_url) throw new Error("Upload Cloudinary thất bại!");

      // 2. Lưu Metadata vào Firestore
      await db.collection("picture").add({
        title: captionInput.value, // Lưu tiêu đề
        description: captionInput.value, // Lưu mô tả
        img_url: data.secure_url, // Link từ Cloudinary
        is_public: true,
        state: "active",
        user_id: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert("Đăng ảnh thành công!");
      uploadForm.reset();
      loadPhotos();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      btnUpload.disabled = false;
      btnUpload.innerText = "Đăng ảnh";
    }
  });
}

async function loadPhotos() {
  const photoFeed = document.getElementById("photo-feed");
  if (!photoFeed) return;
  photoFeed.innerHTML = "<p>Đang tải dữ liệu...</p>";

  try {
    // Lấy dữ liệu từ collection 'image'
    const snapshot = await db.collection("image").get();
    photoFeed.innerHTML = "";

    if (snapshot.empty) {
      photoFeed.innerHTML = "<p>Chưa có hình ảnh nào trong thư viện.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Chỉ hiển thị những ảnh có is_public == true (nếu muốn)
      if (data.is_public !== false) {
        const card = document.createElement("div");
        card.className = "m3-feature-card";
        card.innerHTML = `
                    <img src="${data.img_url || "https://via.placeholder.com/400x200"}" alt="${data.title || "photo"}" style="width:100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;">
                    <h3 style="margin-bottom: 6px;">${data.title || "Chưa có tiêu đề"}</h3>
                    <p style="color: #ccc; margin-bottom: 6px;">${data.description || "Không có mô tả"}</p>
                    <p style="font-size: 12px; opacity: 0.7;">Người đăng: ${data.user_id || "Ẩn danh"}</p>
                `;
        photoFeed.appendChild(card);
      }
    });
  } catch (err) {
    console.error("Lỗi lấy bài đăng:", err);
    photoFeed.innerHTML =
      "<p>Lỗi khi tải dữ liệu từ Firestore. Vui lòng kiểm tra lại Rules!</p>";
  }
}

// Gọi hàm nạp ảnh khi trang index.html chạy
loadPhotos();

// Đăng xuất
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => window.location.reload());
  });
}
