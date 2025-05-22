const express = require('express');
const router = express.Router();

// Middleware - Giriş yapılmış mı kontrolü
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Login sayfası
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Login işlemi
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const coach = global.testData.coaches.find(c => c.username === username);

        if (!coach) {
            return res.render('auth/login', { error: 'Kullanıcı bulunamadı' });
        }

        if (coach.password !== password) { // Gerçek uygulamada hash karşılaştırması yapılmalı
            return res.render('auth/login', { error: 'Hatalı şifre' });
        }

        req.session.userId = coach.id;
        res.redirect('/');
    } catch (error) {
        res.render('auth/login', { error: 'Giriş yapılırken bir hata oluştu' });
    }
});

// Çıkış işlemi
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = { router, isAuthenticated }; 