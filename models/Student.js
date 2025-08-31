const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    grade: {
        type: String,
        required: true
    },
    weeklySchedule: [{
        day: {
            type: String,
            enum: global.days || ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
            required: true
        },
        subjects: [{
            subject: String,
            notes: String
        }]
    }],
    generalNotes: {
        type: String,
        default: ''
    },
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema); 