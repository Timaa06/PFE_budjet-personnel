import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Pencil, Trash2, Search, SlidersHorizontal, Download } from 'lucide-react';
import './TransactionList.css';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editForm, setEditForm] = useState({ type: '', amount: '', category_id: '', description: '', date: '' });
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterTransactions();
    setCurrentPage(1);
  }, [transactions, searchTerm, filterType]);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur catégories:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      date: transaction.date ? transaction.date.split('T')[0] : '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/transactions/${editingTransaction.id}`, editForm);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Description', 'Catégorie', 'Type', 'Montant (€)'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('fr-FR'),
      t.description || '',
      t.category_name || '',
      t.type === 'income' ? 'Revenu' : 'Dépense',
      parseFloat(t.amount).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;

    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const pagedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const firstItem = filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem  = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length);

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1>💳 Transactions</h1>
          <p className="subtitle">{filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''} enregistrée{filteredTransactions.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="transactions-filters">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <div className="filter-dropdown-wrap">
            <button
              className={`btn-filter ${showFilterMenu ? 'active' : ''}`}
              onClick={() => setShowFilterMenu(v => !v)}
            >
              <SlidersHorizontal size={15} /> Filtrer
            </button>
            {showFilterMenu && (
              <div className="filter-dropdown">
                {[['all', 'Toutes'], ['income', 'Revenus'], ['expense', 'Dépenses']].map(([val, label]) => (
                  <button
                    key={val}
                    className={filterType === val ? 'active' : ''}
                    onClick={() => { setFilterType(val); setShowFilterMenu(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn-export" onClick={handleExport}>
            <Download size={15} /> Exporter
          </button>
        </div>
      </div>

      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedTransactions.length > 0 ? (
              pagedTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="transaction-date">
                    {new Date(transaction.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="transaction-description">
                    {transaction.description}
                  </td>
                  <td className="transaction-category">
                    <span className={`category-badge ${transaction.type}`}>
                      {transaction.category_name}
                    </span>
                  </td>
                  <td className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {parseFloat(transaction.amount).toFixed(2)} €
                  </td>
                  <td className="transaction-actions">
                    <button
                      className="btn-edit-small"
                      onClick={() => handleEdit(transaction)}
                      title="Modifier"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDelete(transaction.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Aucune transaction trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {filteredTransactions.length > 0 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Affichage de {firstItem} à {lastItem} sur {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn page-num ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* MODALE MODIFIER */}
      {editingTransaction && (
        <div className="modal-overlay" onClick={() => setEditingTransaction(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Modifier la transaction</h2>
              <button className="modal-close" onClick={() => setEditingTransaction(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group">
                <label>Type</label>
                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} required>
                  <option value="income">Revenu</option>
                  <option value="expense">Dépense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Montant (€)</label>
                <input type="number" step="0.01" min="0" value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select value={editForm.category_id} onChange={e => setEditForm({ ...editForm, category_id: e.target.value })}>
                  <option value="">-- Choisir --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingTransaction(null)}>Annuler</button>
                <button type="submit" className="btn-save">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionList;