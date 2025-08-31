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
        // Session'da students yoksa global'den al
        if (!req.session.students) {
            req.session.students = global.testData.students;
        }
        const students = req.session.students.filter(s => s.coach === req.session.userId);
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
        const days = global.sections;
        
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
        
        if (!req.session.students) {
            req.session.students = global.testData.students;
        }
        req.session.students.push(newStudent);
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

// Print template
router.get('/print-template/:id', isAuthenticated, async (req, res) => {
    try {
        const student = global.testData.students.find(
            s => s.id === req.params.id && s.coach === req.session.userId
        );
        
        if (!student) {
            return res.redirect('/students');
        }

        // Tüm dersleri tek bir array'de topla
        const allSubjects = student.weeklySchedule.reduce((acc, schedule) => {
            return [...acc, ...schedule.subjects];
        }, []);

        // Student objesine subjects array'ini ekle
        const studentWithSubjects = {
            ...student,
            subjects: allSubjects
        };

        res.render('print-template', { student: studentWithSubjects });
    } catch (error) {
        res.redirect('/students');
    }
});

// Haftalık program güncelleme
router.post('/:id/schedule', isAuthenticated, async (req, res) => {
    try {
        const studentIndex = global.testData.students.findIndex(
            s => s.id === req.params.id && s.coach === req.session.userId
        );
        
        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }

        const { subjects } = req.body;
        
        if (!Array.isArray(subjects)) {
            return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }

        // Boş dersleri filtrele
        const filteredSubjects = subjects.filter(subject => 
            subject.subject && subject.subject.trim() !== ''
        );

        // Dersleri günlere sırayla dağıt (sadece ders günleri)
        const weeklySchedule = global.schoolDays.map(day => ({ day, subjects: [] }));
        
        // Her dersi sırayla günlere dağıt
        filteredSubjects.forEach((subject, index) => {
            const dayIndex = index % global.schoolDays.length; // 0-6 arası döngüsel indeks
            weeklySchedule[dayIndex].subjects.push(subject);
        });

        // Haftalık programı güncelle
        global.testData.students[studentIndex].weeklySchedule = weeklySchedule;

        res.json({ success: true });
    } catch (error) {
        console.error('Program güncelleme hatası:', error);
        res.status(500).json({ error: 'Program güncellenirken bir hata oluştu' });
    }
});

module.exports = router; 