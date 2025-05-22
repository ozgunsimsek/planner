const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./auth');

// Yardımcı fonksiyonlar
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Öğrenci listesi
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const students = global.testData.students.filter(s => s.coach === req.session.userId);
        res.render('students/list', { students });
    } catch (error) {
        res.render('students/list', { error: 'Öğrenciler listelenirken bir hata oluştu' });
    }
});

// Yeni öğrenci ekleme sayfası
router.get('/new', isAuthenticated, (req, res) => {
    res.render('students/new');
});

// Yeni öğrenci ekleme işlemi
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, email, grade } = req.body;
        const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        
        const newStudent = {
            id: generateId(),
            name,
            email,
            grade,
            coach: req.session.userId,
            weeklySchedule: days.map(day => ({
                day,
                subjects: []
            }))
        };
        
        global.testData.students.push(newStudent);
        res.redirect('/students');
    } catch (error) {
        res.render('students/new', { 
            error: 'Öğrenci eklenirken bir hata oluştu',
            formData: req.body 
        });
    }
});

// Öğrenci detay sayfası
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const student = global.testData.students.find(
            s => s.id === req.params.id && s.coach === req.session.userId
        );
        
        if (!student) {
            return res.redirect('/students');
        }
        res.render('students/detail', { student });
    } catch (error) {
        res.redirect('/students');
    }
});

// Haftalık program güncelleme
router.post('/:id/schedule', isAuthenticated, async (req, res) => {
    try {
        const weeklySchedule = JSON.parse(req.body.weeklySchedule);
        const studentIndex = global.testData.students.findIndex(
            s => s.id === req.params.id && s.coach === req.session.userId
        );
        
        if (studentIndex !== -1) {
            global.testData.students[studentIndex].weeklySchedule = weeklySchedule;
            global.testData.students[studentIndex].generalNotes = req.body.generalNotes || '';
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Program güncellenirken bir hata oluştu' });
    }
});

module.exports = router; 