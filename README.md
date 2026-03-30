# 💰 Budget Manager

Application web de gestion de budget personnel, développée avec React et Node.js/Express. Elle permet de suivre ses revenus et dépenses, gérer des objectifs d'épargne, planifier des besoins et recevoir des rappels par email ou notification.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Base de données](#-base-de-données)
- [API — Endpoints](#-api--endpoints)
- [Authentification](#-authentification)
- [Notifications email](#-notifications-email)
- [Export PDF](#-export-pdf)
- [Multilingue](#-multilingue)
- [Rôles utilisateurs](#-rôles-utilisateurs)

---

## ✨ Fonctionnalités

### Gestion financière
- ➕ Ajout de transactions (revenus / dépenses)
- 📂 Catégorisation personnalisée
- 🔍 Recherche et filtres sur les transactions
- 📄 Export CSV et PDF des transactions

### Tableau de bord
- 💳 Solde disponible en temps réel
- 🐷 Tirelire virtuelle (épargne)
- 📊 Graphiques de dépenses par catégorie
- 📈 Statistiques mensuelles et par période (7j, 30j, 6m, 1an)
- 🏆 Palmarès des objectifs atteints

### Objectifs d'épargne
- 🎯 Création d'objectifs avec montant cible et date limite
- 💸 Alimentation de la tirelire par objectif
- 📉 Suivi de la progression en pourcentage
- ✅ Archivage des objectifs complétés

### Besoins & Tâches
- 📋 Création de besoins (études, santé, finances, loisirs, autre)
- ✅ Tâches liées à chaque besoin
- 🔄 Statut des tâches : À faire → En cours → Terminé
- ⏰ Dates limites avec alertes de retard
- 📊 Barre de progression par besoin

### Rappels & Notifications
- 🔔 Rappels dans l'application (panneau cloche)
- 📧 Notifications par email (Gmail SMTP)
- 🔀 Type de notification : application, email, ou les deux
- ⏱️ Job automatique toutes les 60 secondes

### Compte démo
- 🎮 Connexion démo en un clic (données pré-remplies)
- Token JWT valide 2 heures

### Multilingue
- 🌍 13 langues disponibles sur la landing page :
  FR · EN · ES · AR · DE · PT · ZH · HI · IT · KO · JA · NL · RU
- Langue mémorisée dans le navigateur (localStorage)
- Support RTL pour l'arabe

### Administration
- 👥 Gestion des utilisateurs (activer, désactiver, supprimer)
- 📊 Statistiques globales de la plateforme
- 🗂️ Gestion des catégories
- 📜 Journaux d'activité

---

## 🛠 Stack technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19 | Framework UI |
| React Router | 7.13 | Navigation |
| Axios | 1.13 | Appels API |
| Chart.js + react-chartjs-2 | 4.5 / 5.3 | Graphiques |
| Lucide React | 0.575 | Icônes |
| jsPDF + autotable | 4.2 / 5.0 | Export PDF |
| React Toastify | 11.0 | Notifications toast |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js + Express | 5.2 | Serveur API REST |
| MySQL2 | 3.19 | Base de données |
| JWT (jsonwebtoken) | 9.0 | Authentification |
| bcryptjs | 3.0 | Hachage mot de passe |
| Nodemailer | 8.0 | Envoi d'emails |
| dotenv | 17 | Variables d'environnement |
| Nodemon | 3.1 | Rechargement auto (dev) |

---

## 📁 Structure du projet

```
Budjet_personnel/
├── frontend/                       # Application React
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/             # Composants réutilisables
│   │   │   ├── Dashboard.jsx       # Tableau de bord principal
│   │   │   ├── TransactionList.jsx # Liste des transactions
│   │   │   ├── TransactionForm.jsx # Formulaire transaction
│   │   │   ├── GoalList.jsx        # Objectifs d'épargne
│   │   │   ├── Stats.jsx           # Statistiques & graphiques
│   │   │   ├── NeedsManager.jsx    # Besoins & tâches
│   │   │   ├── RemindersPanel.jsx  # Panneau de rappels
│   │   │   └── ProfileModal.jsx    # Modal profil
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Page d'accueil publique
│   │   │   ├── Login.jsx           # Connexion
│   │   │   ├── Register.jsx        # Inscription
│   │   │   ├── Home.jsx            # App principale (tabs)
│   │   │   ├── ForgotPassword.jsx  # Mot de passe oublié
│   │   │   ├── ResetPassword.jsx   # Réinitialisation
│   │   │   └── AdminDashboard.jsx  # Tableau de bord admin
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Contexte d'authentification
│   │   ├── services/
│   │   │   └── api.js              # Client Axios configuré
│   │   ├── i18n/
│   │   │   └── landing.js          # Traductions landing page
│   │   └── App.js
│   ├── .env.local                  # Variables d'environnement frontend
│   └── package.json
│
├── backend/                        # Serveur Node.js
│   ├── config/
│   │   └── db.js                   # Connexion MySQL
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── transaction.controller.js
│   │   ├── goal.controller.js
│   │   ├── stats.controller.js
│   │   ├── needs.controller.js
│   │   ├── tasks.controller.js
│   │   ├── reminders.controller.js
│   │   ├── category.controller.js
│   │   └── admin.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── transaction.routes.js
│   │   ├── goal.routes.js
│   │   ├── stats.routes.js
│   │   ├── needs.routes.js
│   │   ├── tasks.routes.js
│   │   ├── reminders.routes.js
│   │   ├── category.routes.js
│   │   └── admin.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Vérification JWT
│   │   └── admin.middleware.js     # Vérification rôle admin
│   ├── models/
│   │   └── user.model.js
│   ├── services/
│   │   └── email.service.js        # Envoi d'emails (Nodemailer)
│   ├── jobs/
│   │   └── reminderJob.js          # Job rappels email (60s)
│   ├── migrate-needs-tasks.js      # Migration tables besoins/tâches/rappels
│   ├── migrate-profile.js          # Migration champs profil
│   ├── migrate-reminders-email.js  # Migration notification_type
│   ├── app.js                      # Configuration Express
│   ├── server.js                   # Point d'entrée
│   └── package.json
│
└── README.md
```

---

## 🚀 Installation

### Prérequis
- Node.js ≥ 18
- MySQL ≥ 8
- npm

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd Budjet_personnel
```

### 2. Installer les dépendances backend

```bash
cd backend
npm install
```

### 3. Installer les dépendances frontend

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend — `backend/.env`

Créer un fichier `.env` dans le dossier `backend/` :

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=budjet_personnel
JWT_SECRET=votre_secret_jwt_ici

# Configuration email Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Budget Manager <votre.email@gmail.com>

FRONTEND_URL=http://localhost:3000
```

> **Note EMAIL_PASS** : Il faut un **mot de passe d'application Gmail** (pas votre mot de passe habituel).
> Pour l'obtenir : myaccount.google.com → Sécurité → Validation 2 étapes → Mots de passe des applications

### Frontend — `frontend/.env.local`

```env
REACT_APP_API_URL=http://localhost:5000
```

> Pour tester sur mobile via WiFi, remplacer `localhost` par l'IP de votre machine (ex: `192.168.1.54`).

---

## 🗄️ Base de données

### Créer la base

```sql
CREATE DATABASE budjet_personnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Lancer les migrations

```bash
cd backend
node migrate-needs-tasks.js
node migrate-profile.js
node migrate-reminders-email.js
```

### Schéma des tables

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs (email, mot de passe hashé, rôle admin) |
| `transactions` | Revenus et dépenses |
| `categories` | Catégories de transactions |
| `goals` | Objectifs d'épargne |
| `needs` | Besoins personnels (projets) |
| `tasks` | Tâches liées aux besoins |
| `reminders` | Rappels avec type de notification |
| `activity_logs` | Journal d'activité |

---

## ▶️ Lancement

### Développement

**Backend** (terminal 1) :
```bash
cd backend
npm run dev
```

**Frontend** (terminal 2) :
```bash
cd frontend
npm start
```

L'application est accessible sur `http://localhost:3000`

### Tester sur mobile (même réseau WiFi)

```bash
# Frontend
cd frontend
set HOST=0.0.0.0 && npm start   # Windows CMD
# ou
HOST=0.0.0.0 npm start           # Mac/Linux
```

Puis dans `.env.local`, mettre votre IP locale :
```env
REACT_APP_API_URL=http://192.168.1.XX:5000
```

Accéder depuis le téléphone : `http://192.168.1.XX:3000`

---

## 📡 API — Endpoints

### Authentification `/auth`
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/register` | Inscription | ❌ |
| POST | `/login` | Connexion → JWT | ❌ |
| POST | `/demo` | Connexion démo | ❌ |
| POST | `/forgot-password` | Email de réinitialisation | ❌ |
| POST | `/reset-password` | Nouveau mot de passe | ❌ |
| GET | `/profile` | Profil utilisateur | ✅ |
| PUT | `/profile` | Modifier le profil | ✅ |

### Transactions `/transactions`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des transactions |
| POST | `/` | Créer une transaction |
| PUT | `/:id` | Modifier |
| DELETE | `/:id` | Supprimer |

### Statistiques `/stats`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/balance` | Solde actuel |
| GET | `/summary` | Résumé global |
| GET | `/by-category` | Par catégorie |
| GET | `/monthly` | Par mois |
| GET | `/period-summary` | Par période |
| GET | `/top-expenses` | Top dépenses |

### Objectifs `/goals`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des objectifs |
| POST | `/` | Créer un objectif |
| PUT | `/:id` | Modifier |
| PATCH | `/:id/add` | Ajouter des fonds |
| DELETE | `/:id` | Supprimer |

### Besoins `/needs` · Tâches `/tasks` · Rappels `/reminders`
Routes CRUD standard + `PATCH /tasks/:id/status` + `PATCH /reminders/:id/trigger`

### Administration `/admin` *(admin uniquement)*
Gestion utilisateurs, statistiques globales, journaux, catégories.

---

## 🔐 Authentification

- Basée sur **JWT (JSON Web Token)**
- Token stocké dans `localStorage`
- Durée de validité : **7 jours** (2h pour le compte démo)
- Toutes les routes protégées nécessitent le header :
  ```
  Authorization: Bearer <token>
  ```

---

## 📧 Notifications email

Les rappels peuvent être envoyés par email via Gmail SMTP.

**Types de notification :**
- `app` — notification uniquement dans l'application
- `email` — email uniquement
- `both` — les deux

**Fonctionnement :**
Un job tourne toutes les **60 secondes** et vérifie les rappels dont `remind_at <= NOW()` et `email_sent = 0`. Il envoie l'email HTML et marque le rappel comme traité.

**Tester l'envoi email :**
```
GET /reminders/test-email
Authorization: Bearer <token>
```

---

## 📄 Export PDF

Depuis la page Transactions, le bouton **PDF** génère un fichier téléchargeable avec :
- En-tête avec les totaux (revenus, dépenses, solde)
- Tableau de toutes les transactions filtrées
- Montants colorés (vert = revenu, rouge = dépense)

---

## 🌍 Multilingue

La landing page supporte 13 langues :

| Code | Langue | Direction |
|------|--------|-----------|
| fr | Français | LTR |
| en | English | LTR |
| es | Español | LTR |
| ar | العربية | **RTL** |
| de | Deutsch | LTR |
| pt | Português | LTR |
| zh | 中文 | LTR |
| hi | हिन्दी | LTR |
| it | Italiano | LTR |
| ko | 한국어 | LTR |
| ja | 日本語 | LTR |
| nl | Nederlands | LTR |
| ru | Русский | LTR |

La langue choisie est mémorisée dans `localStorage` et rechargée à la prochaine visite.

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Utilisateur** | Tableau de bord, transactions, objectifs, besoins, rappels, profil |
| **Admin** | Tout + gestion utilisateurs, catégories, journaux, statistiques globales |

Pour créer un admin, modifier directement en base :
```sql
UPDATE users SET is_admin = 1 WHERE email = 'votre@email.com';
```

---

## 📱 Mobile

L'application est responsive et s'adapte aux écrans mobiles :
- Navigation par barre du bas (5 onglets)
- Cartes transactions adaptées
- Landing page optimisée mobile

---

## 📝 Licence

Projet personnel — tous droits réservés © 2026
