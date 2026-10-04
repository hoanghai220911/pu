// Cấu hình Cloudinary Backend Server
const IMAGE_SERVER_URL = "http://localhost:5000";

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
      const userDoc = await db.collection(COLLECTION_USERS).doc(user.uid).get();
      if (userDoc.exists && userDoc.data().isActive === false) {
        alert("Tài khoản của bạn đã bị khóa!");
        firebase.auth().signOut();
        return;
      }

      if (user.email === "xbuithimy@gmail.com") {
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
    const descriptionInput = document.getElementById("img-description");
    const btnUpload = document.getElementById("btn-upload");

    const file = fileInput.files[0];
    if (!file) return;

    try {
      btnUpload.disabled = true;
      btnUpload.innerText = "Đang tải lên...";

      // 1. Gửi file lên Backend -> Backend upload lên Cloudinary
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${IMAGE_SERVER_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload thất bại!");
      }

      // 2. Lưu link ảnh Cloudinary vào Firestore collection 'image'
      const docRef = await db.collection(COLLECTION_IMAGE).add({
        title: captionInput.value,
        description: descriptionInput.value,
        img_url: result.url,
        public_id: result.public_id, // lưu lại để xóa ảnh trên Cloudinary khi cần
        is_public: true,
        state: "active",
        user_id: currentUser.uid,
        user_email: currentUser.email, // lưu thêm email để hiển thị
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Document Key vừa tạo:", docRef.id);
      alert("Đăng ảnh thành công!");

      uploadForm.reset();
      loadPhotos();
      btnUpload.disabled = false;
      btnUpload.innerText = "Đăng ảnh";
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đăng ảnh: " + err.message);
      btnUpload.disabled = false;
      btnUpload.innerText = "Đăng ảnh";
    }
  });
}

// Tab hiện tại: 'community' (tất cả ảnh) hoặc 'mine' (chỉ ảnh của tôi)
let currentTab = 'community';

// Chuyển đổi tab Cộng đồng / Của tôi
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-community').className = tab === 'community' ? 'btn-primary' : 'btn-secondary';
  document.getElementById('tab-mine').className = tab === 'mine' ? 'btn-primary' : 'btn-secondary';
  loadPhotos();
}

// Đọc danh sách ảnh và lấy Key (doc.id) của từng Document
async function loadPhotos() {
  const photoFeed = document.getElementById("photo-feed");
  if (!photoFeed) return;
  photoFeed.innerHTML = "<p>Đang tải dữ liệu...</p>";

  try {
    // Đã đồng bộ collection 'picture' (thay vì 'image')
    const snapshot = await db.collection(COLLECTION_IMAGE).get();
    photoFeed.innerHTML = "";

    // Lấy danh sách users để map uid -> email
    const usersSnapshot = await db.collection(COLLECTION_USERS).get();
    const usersMap = {};
    usersSnapshot.forEach(u => {
      usersMap[u.id] = u.data().email;
    });

    if (snapshot.empty) {
      photoFeed.innerHTML = "<p>Chưa có hình ảnh nào trong thư viện.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      // doc.id chính là KEY của Firestore
      const docKey = doc.id;
      const data = doc.data();
      const userEmail = usersMap[data.user_id] || data.user_email || data.user_id || "Ẩn danh";

      // Lọc theo tab: 'mine' chỉ hiện ảnh của user hiện tại
      if (currentTab === 'mine') {
        if (!currentUser || data.user_id !== currentUser.uid) return;
      }

      if (data.is_public !== false) {
        const card = document.createElement("div");
        card.className = "m3-feature-card";
        card.style.background = "#222428";
        card.style.padding = "12px";
        card.style.borderRadius = "12px";
        card.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";

        card.innerHTML = `
          <img src="${data.img_url || "https://via.placeholder.com/400x200"}" alt="${data.title || "photo"}" style="width:100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px;">${data.title || "Chưa có tiêu đề"}</h3>
          <p style="color: #666; margin: 0 0 6px 0; font-size: 14px;">${data.description || "Không có mô tả"}</p>
          <div style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px;">
            <div style="margin: 5px 0;">Người đăng: ${userEmail}</div>
            <div><strong>Key (ID):</strong> <code style="background:#121212; padding:2px 4px; border-radius:4px;">${docKey}</code></div>
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
