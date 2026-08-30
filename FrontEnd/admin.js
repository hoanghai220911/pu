const db = firebase.firestore();

// Kiểm tra quyền Admin
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        alert("Bạn không có quyền truy cập trang quản trị!");
        window.location.href = "./index.html";
        return;
    }

    // Load dữ liệu quản trị
    loadUsers();
    loadAdminPosts();
});

// 1. Quản lý danh sách Người dùng
async function loadUsers() {
    const list = document.getElementById('user-management-list');
    const snapshot = await db.collection('users').get();
    list.innerHTML = "";

    snapshot.forEach(doc => {
        const u = doc.data();
        const isBanned = u.isBanned || false;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${u.email}</td>
            <td><b style="color: ${isBanned ? '#ffb4ab' : '#8cd690'}">${isBanned ? 'Đang bị khóa' : 'Hoạt động'}</b></td>
            <td>
                <button class="${isBanned ? 'btn-warning' : 'btn-danger'}" onclick="toggleBanUser('${doc.id}', ${isBanned})">
                    ${isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

// Khóa hoặc mở khóa tài khoản
async function toggleBanUser(userId, currentStatus) {
    await db.collection('users').doc(userId).update({
        isBanned: !currentStatus
    });
    alert("Đã cập nhật trạng thái người dùng!");
    loadUsers();
}

// 2. Quản lý & Xóa Ảnh
async function loadAdminPosts() {
    const grid = document.getElementById('admin-photo-grid');
    const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
    grid.innerHTML = "";

    snapshot.forEach(doc => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'm3-feature-card';
        card.innerHTML = `
            <img src="${data.imageUrl}" alt="photo" style="width:100%; height: 160px; object-fit: cover; border-radius: 8px;">
            <p style="margin: 8px 0;">${data.caption}</p>
            <p style="font-size: 11px; color: #aaa;">Đăng bởi: ${data.userEmail}</p>
            <button class="btn-danger" style="margin-top: 10px; width: 100%;" onclick="deletePost('${doc.id}')">
                Xóa bài viết này
            </button>
        `;
        grid.appendChild(card);
    });
}

// Xóa bài viết khỏi Firestore
async function deletePost(postId) {
    if (confirm("Bạn có chắc chắn muốn xóa bức ảnh này?")) {
        await db.collection('posts').doc(postId).delete();
        alert("Đã xóa bài đăng thành công!");
        loadAdminPosts();
    }
}
