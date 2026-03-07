import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/categories', 
        { name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="category-list">
      <h2>Catégories</h2>
      
      <form onSubmit={addCategory} className="category-form">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nouvelle catégorie"
        />
        <button type="submit">Ajouter</button>
      </form>

      <div className="categories">
        {categories.map(category => (
          <div key={category.id} className="category-item">
            <span>{category.name}</span>
            <button onClick={() => deleteCategory(category.id)}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
