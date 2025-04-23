// models/Contact.js
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
    trim: true
  },

  email: {
    type: String,
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide']
  },
  telephone: {
    type: String,
    required: true, 
    trim: true
  },
  sujet: {
    type: String,
    required: true, 
    trim: true
  },
  message: {
    type: String,
    required: true, 
    trim: true
  },
  dateEnvoi: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['non_lu', 'lu', 'en_cours', 'traité'],
    default: 'non_lu'
  }
});

module.exports = mongoose.model('Contact', contactSchema);