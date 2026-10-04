// Cấu hình Cloudinary Backend Server
const IMAGE_SERVER_URL = "http://localhost:5500";

let currentUser = null;

// Xử lý nút cuộn an toàn xuống khu vực Upload
const btnShowUpload = document.getElementById("btn-show-upload");
if (btnShowUpload) {
  btnShowUpload.addEventListener("click", () => {
    const uploadContainer = document.getElementById("upload-container");
    if (uploadContainer) {
      uploadContainer.scrollIntoView({ behavior: "smooth" });
    }
  });
}

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

    // Giới hạn ảnh dưới 1MB vì Firestore giới hạn 1MB/document
    if (file.size > 1024 * 1024) {
      return alert("Vui lòng chọn ảnh có dung lượng dưới 1MB!");
    }

    try {
      btnUpload.disabled = true;
      btnUpload.innerText = "Đang xử lý...";

      // 1. Đọc file sang chuỗi Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64DataUrl = reader.result;

        // 2. Lưu trực tiếp vào Firestore collection 'picture'
        const docRef = await db.collection("image").add({
          title: captionInput.value,
          description: captionInput.value,
          img_url: base64DataUrl, // Lưu chuỗi Base64 thay vì link Storage
          is_public: true,
          state: "active",
          user_id: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Document Key vừa tạo:", docRef.id);
        alert(`Đăng ảnh thành công! Key ID: ${docRef.id}`);

        uploadForm.reset();
        loadPhotos();
        btnUpload.disabled = false;
        btnUpload.innerText = "Đăng ảnh";
      };

      reader.onerror = (err) => {
        throw err;
      };
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đăng ảnh: " + err.message);
      btnUpload.disabled = false;
      btnUpload.innerText = "Đăng ảnh";
    }
  });
}

// Đọc danh sách ảnh và lấy Key (doc.id) của từng Document
async function loadPhotos() {
  const photoFeed = document.getElementById("photo-feed");
  if (!photoFeed) return;
  photoFeed.innerHTML = "<p>Đang tải dữ liệu...</p>";

  try {
    // Đã đồng bộ collection 'picture' (thay vì 'image')
    const snapshot = await db.collection("image").get();
    photoFeed.innerHTML = "";

    if (snapshot.empty) {
      photoFeed.innerHTML = "<p>Chưa có hình ảnh nào trong thư viện.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      // doc.id chính là KEY của Firestore
      const docKey = doc.id;
      const data = doc.data();

      if (data.is_public !== false) {
        const card = document.createElement("div");
        card.className = "m3-feature-card";
        card.style.background = "#fff";
        card.style.padding = "12px";
        card.style.borderRadius = "12px";
        card.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";

        card.innerHTML = `
          <img src="${data.img_url || "https://via.placeholder.com/400x200"}" alt="${data.title || "photo"}" style="width:100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px;">${data.title || "Chưa có tiêu đề"}</h3>
          <p style="color: #666; margin: 0 0 6px 0; font-size: 14px;">${data.description || "Không có mô tả"}</p>
          <div style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px;">
            <div>Người đăng: ${data.user_id || "Ẩn danh"}</div>
            <div><strong>Key (ID):</strong> <code style="background:#f1f1f1; padding:2px 4px; border-radius:4px;">${docKey}</code></div>
          </div>
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

// Gọi hàm nạp ảnh khi trang chạy
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

const modalOverlay = document.getElementById("upload-modal-overlay");
const openBtn = document.getElementById("open-upload-btn");
const closeBtn = document.getElementById("close-modal-btn");
const cancelBtn = document.getElementById("cancel-btn");
// Hàm mở Popup
openBtn.addEventListener("click", () => {
  modalOverlay.style.display = "flex";
});

// Hàm đóng Popup
const closeModal = () => {
  modalOverlay.style.display = "none";
};

closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// Đóng Popup khi click ra ngoài vùng trắng nội dung
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});
