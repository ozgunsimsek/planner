const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Test verileri
global.testData = {
    coaches: [{
        id: '1',
        username: 'admin',
        password: '123456', // Gerçek uygulamada hash'lenmiş olmalı
        name: 'Test Koç',
        email: 'test@example.com'
    }],
    students: [{
        id: 'test123',
        name: 'Furkan Şişli',
        grade: '11',
        email: 'furkan@example.com',
        coach: '1',
        weeklySchedule: [
            {
                day: 'Pazartesi',
                subjects: [
                    {
                        subject: 'Matematik',
                        notes: 'İyi çalış'
                    },
                    {
                        subject: 'Fizik',
                        notes: 'İyi çalış'
                    }
                ]
            },
            {
                day: 'Salı',
                subjects: []
            },
            {
                day: 'Çarşamba',
                subjects: []
            },
            {
                day: 'Perşembe',
                subjects: []
            },
            {
                day: 'Cuma',
                subjects: []
            },
            {
                day: 'Cumartesi',
                subjects: []
            },
            {
                day: 'Pazar',
                subjects: []
            }
        ]
    }]
};

// View engine ayarı
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'gizli-anahtar',
    resave: false,
    saveUninitialized: false
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
    console.log('\nTest kullanıcısı bilgileri:');
    console.log('Kullanıcı adı:', testData.coaches[0].username);
    console.log('Şifre:', testData.coaches[0].password);
}); 