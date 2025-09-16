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
    subjectsData = [];
}

// Sadece ders günleri (Notlar hariç)
global.schoolDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Global bölümler array'i (ders günleri + notlar)
global.sections = [...global.schoolDays, 'Notlar'];

// Test verileri
global.testData = {
    coaches: [
        {
            id: '1',
            username: 'furkan',
            password: '123', // Gerçek uygulamada hash'lenmiş olmalı
            name: 'Test Koç',
            email: 'test@example.com'
        },
        {
            id: '2',
            username: 'demo_user',
            password: 'kf74Hf3jsa', // Gerçek uygulamada hash'lenmiş olmalı
            name: 'Test Koç 2',
            email: 'test2@example.com'
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


// Ana sayfa - direkt öğrenci detay sayfasına yönlendir
app.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    // Her koç için sabit öğrenci ID'si kullan
    return res.redirect(`/students/student1`);
});

// Server başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 