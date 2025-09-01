const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');

const app = express();

// Dersleri ve konuları JSON dosyasından oku
let subjectsData = [];
try {
    const subjectsPath = path.join(__dirname, 'data', 'subjects.json');
    const subjectsContent = fs.readFileSync(subjectsPath, 'utf8');
    subjectsData = JSON.parse(subjectsContent);
} catch (error) {
    console.error('Dersler JSON dosyası okunamadı:', error);
    subjectsData = [];
}

// Sadece ders günleri (Notlar hariç)
global.schoolDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Global bölümler array'i (ders günleri + notlar)
global.sections = [...global.schoolDays, 'Notlar'];

// Test verileri
global.testData = {
    coaches: [{
        id: '1',
        username: 'furkan',
        password: '123', // Gerçek uygulamada hash'lenmiş olmalı
        name: 'Test Koç',
        email: 'test@example.com'
    }],
    students: [
        {
            id: 'test123',
            name: 'Furkan Şişli',
            grade: '11',
            email: 'furkan@example.com',
            coach: '1',
            weeklySchedule: global.schoolDays.map(day => ({
                day: day,
                subjects: []
            }))
        },
        {
            id: 'test456',
            name: 'Damla ŞİŞLİ',
            grade: '12',
            email: 'damla@example.com',
            coach: '1',
            weeklySchedule: global.schoolDays.map(day => ({
                day: day,
                subjects: []
            }))
        }
    ],
    subjects: subjectsData
};

// View engine ayarı
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.set('trust proxy', 1); // Railway ve benzeri platformlar için
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'gizli-anahtar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');

app.use('/auth', authRoutes.router);
app.use('/students', studentRoutes);

// Yazdırma şablonu route'u
app.get('/print-template/:studentId', (req, res) => {
    const student = global.testData.students.find(s => s.id === req.params.studentId);
    if (!student) {
        return res.redirect('/students');
    }
    res.render('print-template', { layout: false, student });
});

// Ana sayfa
app.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    res.render('index');
});

// Server başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 