const mongoose = require('mongoose');
const Coach = require('./models/Coach');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/planner', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Test kullanıcısı bilgileri
const testCoach = {
    username: 'admin',
    password: '123456',
    name: 'Test Koç',
    email: 'test@example.com'
};

// Test kullanıcısını oluştur
async function createTestUser() {
    try {
        // Önce varsa mevcut kullanıcıyı sil
        await Coach.deleteOne({ username: testCoach.username });
        
        // Yeni kullanıcı oluştur
        const coach = new Coach(testCoach);
        await coach.save();
        
        console.log('Test kullanıcısı başarıyla oluşturuldu:');
        console.log('Kullanıcı adı:', testCoach.username);
        console.log('Şifre:', testCoach.password);
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Hata:', error);
        mongoose.connection.close();
    }
}

createTestUser(); 