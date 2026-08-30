const db = firebase.firestore();

// Cấu hình Cloudinary (Thay thông tin của bạn vào đây)
const CLOUD_NAME = "YOUR_CLOUD_NAME"; 
const UPLOAD_PRESET = "YOUR_UNSIGNED_PRESET";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

let currentUser = null;

// Kiểm tra Auth State
firebase.auth().onAuthStateChanged(async (user) => {
    const authActions = document.getElementById('auth-actions');
    const userProfile = document.getElementById('user-profile');
    const userEmailDisplay = document.getElementById('user-email-display');
    const uploadContainer = document.getElementById('upload-container');

    if (user) {
        // Kiểm tra tài khoản có bị khóa/cấm hay không
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().isBanned) {
            alert("Tài khoản của bạn tạm thời đã bị khóa bởi Quản trị viên!");
            firebase.auth().signOut();
            return;
        }

        currentUser = user;
        authActions.style.display = 'none';
        userProfile.style.display = 'flex';
        uploadContainer.style.display = 'block';
        userEmailDisplay.textContent = user.email;

        // Phân quyền hiển thị nút Admin
        if (userDoc.exists && userDoc.data().role === 'admin') {
            document.getElementById('admin-link').style.display = 'inline-flex';
        }
    } else {
        currentUser = null;
        authActions.style.display = 'flex';
        userProfile.style.display = 'none';
        uploadContainer.style.display = 'none';
    }
});

// Xử lý Upload Ảnh lên Cloudinary -> Lưu Firestore
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Vui lòng đăng nhập!");

        const fileInput = document.getElementById('img-file');
        const captionInput = document.getElementById('img-caption');
        const btnUpload = document.getElementById('btn-upload');

        const file = fileInput.files[0];
        if (!file) return;

        try {
            btnUpload.disabled = true;
            btnUpload.innerText = "Đang tải...";

            // 1. Tải lên Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);

            const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            const data = await res.json();

            if (!data.secure_url) throw new Error("Upload Cloudinary thất bại");

            // 2. Lưu Metadata bài đăng vào Firestore
            await db.collection('posts').add({
                imageUrl: data.secure_url,
                caption: captionInput.value,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
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

// Tải danh sách bài đăng ra Feed
async function loadPhotos() {
    const photoFeed = document.getElementById('photo-feed');
    photoFeed.innerHTML = "<p>Đang tải dữ liệu...</p>";

    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        photoFeed.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'm3-feature-card';
            card.innerHTML = `
                <img src="${data.imageUrl}" alt="photo" style="width:100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;">
                <h3>${data.caption || 'Không có mô tả'}</h3>
                <p>Đăng bởi: <b>${data.userEmail}</b></p>
            `;
            photoFeed.appendChild(card);
        });
    } catch (err) {
        console.error("Lỗi lấy bài đăng:", err);
    }
}

// Chạy hàm nạp ảnh khi vào trang
loadPhotos();

// Đăng xuất
document.getElementById('btn-logout').addEventListener('click', () => {
    firebase.auth().signOut().then(() => window.location.reload());
});
