const IMAGE_SERVER_URL = "http://localhost:3900";

// Kiểm tra quyền Admin (dựa trên email)
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    if (user.email !== 'admin@hoanghai.com') {
        alert("Bạn không có quyền truy cập trang quản trị!");
        window.location.href = "./index.html";
        return;
    }

    // Load dữ liệu quản trị
    loadUsers();
    loadAdminPosts();
});

// 1. Quản lý danh sách Người dùng (load từ collection 'users' trên Firestore)
async function loadUsers() {
    const list = document.getElementById('user-management-list');
    const snapshot = await db.collection(COLLECTION_USERS).get();
    list.innerHTML = "";

    // Sắp xếp tài khoản mới tạo lên đầu (xử lý cả doc cũ chưa có createdAt)
    const docs = snapshot.docs.sort((a, b) => {
        const ta = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
        const tb = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
        return tb - ta;
    });

    docs.forEach(doc => {
        const u = doc.data();
        const isActive = u.isActive !== false; // mặc định active nếu chưa có field
        const createdAt = u.createdAt ? u.createdAt.toDate().toLocaleString('vi-VN') : '—';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${u.email}</td>
            <td>${createdAt}</td>
            <td><b style="color: ${isActive ? '#8cd690' : '#ffb4ab'}">${isActive ? 'Hoạt động' : 'Đang bị khóa'}</b></td>
            <td>
                <button class="${isActive ? 'btn-danger' : 'btn-warning'}" onclick="toggleActiveUser('${doc.id}', ${isActive})">
                    ${isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

// Khóa hoặc mở khóa tài khoản
async function toggleActiveUser(userId, currentStatus) {
    await db.collection(COLLECTION_USERS).doc(userId).update({
        isActive: !currentStatus
    });
    alert("Đã cập nhật trạng thái người dùng!");
    loadUsers();
}

// 2. Quản lý & Xóa Ảnh (collection 'image')
async function loadAdminPosts() {
    const grid = document.getElementById('admin-photo-grid');
    const snapshot = await db.collection(COLLECTION_IMAGE).orderBy('createdAt', 'desc').get();
    grid.innerHTML = "";

    // Lấy danh sách users để map uid -> email
    const usersSnapshot = await db.collection(COLLECTION_USERS).get();
    const usersMap = {};
    usersSnapshot.forEach(u => {
        usersMap[u.id] = u.data().email;
    });

    snapshot.forEach(doc => {
        const data = doc.data();
        const userEmail = usersMap[data.user_id] || data.user_id || 'Ẩn danh';
        const card = document.createElement('div');
        card.className = 'm3-feature-card';
        card.innerHTML = `
            <img src="${data.img_url}" alt="photo" style="width:100%; height: 160px; object-fit: cover; border-radius: 8px;">
            <p style="margin: 10px 0px;">${data.title || data.description || ''}</p>
            <p style="margin: 5px 0; font-size: 11px; color: #aaa;">Đăng bởi: ${userEmail}</p>
            <button class="btn-danger" style="margin-top: 10px; width: 100%;" onclick="deletePost('${doc.id}')">
                Xóa bài viết này
            </button>
        `;
        grid.appendChild(card);
    });
}

// Xóa bài viết khỏi Firestore (không xóa ảnh trên Cloudinary)
async function deletePost(postId) {
    if (confirm("Bạn có chắc chắn muốn xóa bức ảnh này?")) {
        try {
            await db.collection(COLLECTION_IMAGE).doc(postId).delete();
            alert("Đã xóa bài đăng thành công!");
            loadAdminPosts();
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            alert("Lỗi khi xóa bài đăng: " + err.message);
        }
    }
}
