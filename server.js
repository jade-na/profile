require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// SQLite 데이터베이스 설정
const db = new sqlite3.Database(process.env.DB_PATH || 'feedback.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
    // 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      company TEXT,
      position TEXT,
      email TEXT,
      phone TEXT,
      pain_points TEXT,
      interest TEXT,
      timeline TEXT,
      message TEXT,
      form_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// 이메일 전송을 위한 Nodemailer 설정
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 이메일 설정 확인
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP 서버 연결 오류:', error);
  } else {
    console.log('SMTP 서버가 준비되었습니다.');
  }
});

// 폼 제출 처리 엔드포인트
app.post('/submit-feedback', async (req, res) => {
  const {
    name,
    company,
    position,
    email,
    phone,
    pain_points,
    interest,
    timeline,
    message,
    form_type
  } = req.body;

  try {
    // 데이터베이스에 저장
    const sql = `INSERT INTO feedback (
      name, company, position, email, phone, pain_points,
      interest, timeline, message, form_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
      name,
      company,
      position,
      email,
      phone,
      Array.isArray(pain_points) ? pain_points.join(', ') : pain_points,
      interest,
      timeline,
      message,
      form_type
    ]);

    // 이메일 전송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `새로운 문의가 접수되었습니다 - ${form_type}`,
      html: `
        <h2>새로운 문의 내용</h2>
        <p><strong>문의 양식:</strong> ${form_type}</p>
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>회사:</strong> ${company}</p>
        <p><strong>직책:</strong> ${position}</p>
        <p><strong>이메일:</strong> ${email}</p>
        <p><strong>전화번호:</strong> ${phone}</p>
        <p><strong>관심 분야:</strong> ${interest}</p>
        <p><strong>도입 예상 시기:</strong> ${timeline}</p>
        <p><strong>어려움:</strong> ${Array.isArray(pain_points) ? pain_points.join(', ') : pain_points}</p>
        <p><strong>추가 메시지:</strong> ${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: '문의가 성공적으로 접수되었습니다.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: '문의 접수 중 오류가 발생했습니다.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 