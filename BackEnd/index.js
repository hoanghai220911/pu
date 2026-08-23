const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { upload } = require('./middleware/multer');
const { uploadToCloudinary } = require('./utils/cloudinary');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Chưa có file ảnh nào được upload.' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      message: 'Upload thành công',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload thất bại',
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});