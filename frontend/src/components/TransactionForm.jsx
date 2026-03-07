import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TransactionForm.css';

function TransactionForm({ onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCategories();
  }, [formData.type]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const filtered = response.data.filter(cat => cat.type === formData.type);
      setCategories(filtered);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', formData);
      setFormData({
        type: 'expense',
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>💰 Nouvelle transaction</h2>

      <div className="form-group">
        <label>Type</label>
        <div className="type-selector">
          <button
            type="button"
            className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
            onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
          >
            📈 Revenu
          </button>
          <button
            type="button"
            className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
            onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
          >
            📉 Dépense
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Montant (€)</label>
        <input
          type="number"
          step="0.01"
          placeholder="100.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Catégorie</label>
        <select
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          required
        >
          <option value="">-- Choisir une catégorie --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          placeholder="Ex: Courses du mois"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <button type="submit" className="btn-primary">
        ✅ Ajouter la transaction
      </button>
    </form>
  );
}

export default TransactionForm;