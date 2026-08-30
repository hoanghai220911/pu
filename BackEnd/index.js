require('dotenv').config();
const express = require('express');
const cors = require('cors');
const upload = require('./middleware/multer');
const { uploadToCloudinary } = require('./utils/cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint Upload Ảnh minh họa
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file!' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Upload thành công!',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message || 'Lỗi Server!' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});