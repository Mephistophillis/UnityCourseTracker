# PRD: Unity Course Progress Tracker

## Обзор проекта

**Название:** Unity Course Progress Tracker  
**Описание:** Минималистичный веб-сервис для совместного отслеживания прогресса по курсу Unity  
**Целевая аудитория:** Группа студентов, проходящих курс  
**Платформа:** Web (SPA на GitHub Pages)  
**Технический стек:** React + Vite, Telegram OAuth, JSON-файлы для данных

---

## 1. Функциональные требования

### 1.1 Страница авторизации
- **Доступна:** Для всех неавторизованных пользователей
- **Механизм:** Telegram OAuth (Telegram Login Widget)
- **Действия:**
  - Пользователь нажимает кнопку "Войти через Telegram"
  - Telegram возвращает данные пользователя (id, username, avatar)
  - Данные сохраняются в `localStorage`
  - Редирект на главную страницу

### 1.2 Главная страница
- **Доступна:** Только авторизованным пользователям
- **Содержимое:**
  - Таблица со списком всех участников
  - 2 столбца:
    1. **Аватар + Имя** (кликабельно, ведет на страницу участника)
    2. **Прогресс-бар** (общий прогресс по всему курсу в %)
  - Сортировка: по имени или по прогрессу (опционально)
  - Текущий пользователь отмечен визуально (например, жирным шрифтом или背景)

### 1.3 Страница участника
- **URL:** `/participant/:userId`
- **Доступна:** Авторизованным пользователям
- **Содержимое для любого участника:**
  - Аватар (крупный)
  - Имя пользователя
  - Прогресс-бар с общим прогрессом по курсу

- **Дополнительное содержимое (только для своего профиля):**
  - Серия таблиц, одна для каждой главы курса
  - В каждой таблице:
    - Чекбокс "Изучено"
    - Название урока
  - По изменению состояния чекбокса данные сохраняются в JSON

### 1.4 Выход из аккаунта
- **Размещение:** В шапке на главной/странице участника
- **Действие:** Очистка `localStorage` + редирект на страницу авторизации

---

## 2. Структура данных

### 2.1 JSON структура (users.json)
```json
{
  "users": [
    {
      "id": "123456789",
      "username": "john_doe",
      "avatar": "https://t.me/john_doe/avatar.jpg",
      "progress": {
        "chapter_1": {
          "lessons": [
            { "id": "lesson_1_1", "title": "Введение в Unity", "completed": true },
            { "id": "lesson_1_2", "title": "Установка", "completed": true },
            { "id": "lesson_1_3", "title": "First Scene", "completed": false }
          ]
        },
        "chapter_2": {
          "lessons": [
            { "id": "lesson_2_1", "title": "C# Basics", "completed": false },
            { "id": "lesson_2_2", "title": "Скрипты", "completed": false }
          ]
        }
      }
    },
    {
      "id": "987654321",
      "username": "jane_smith",
      "avatar": "https://t.me/jane_smith/avatar.jpg",
      "progress": {
        "chapter_1": {
          "lessons": [
            { "id": "lesson_1_1", "title": "Введение в Unity", "completed": true },
            { "id": "lesson_1_2", "title": "Установка", "completed": false },
            { "id": "lesson_1_3", "title": "First Scene", "completed": false }
          ]
        },
        "chapter_2": {
          "lessons": [
            { "id": "lesson_2_1", "title": "C# Basics", "completed": false },
            { "id": "lesson_2_2", "title": "Скрипты", "completed": false }
          ]
        }
      }
    }
  ]
}
```

### 2.2 Структура курса (course.json)
```json
{
  "chapters": [
    {
      "id": "chapter_1",
      "title": "Основы Unity",
      "lessons": [
        { "id": "lesson_1_1", "title": "Введение в Unity" },
        { "id": "lesson_1_2", "title": "Установка" },
        { "id": "lesson_1_3", "title": "First Scene" }
      ]
    },
    {
      "id": "chapter_2",
      "title": "C# и Скрипты",
      "lessons": [
        { "id": "lesson_2_1", "title": "C# Basics" },
        { "id": "lesson_2_2", "title": "Скрипты" }
      ]
    }
  ]
}
```

### 2.3 Хранение в localStorage
```javascript
// После авторизации через Telegram
localStorage.setItem('currentUser', JSON.stringify({
  id: '123456789',
  username: 'john_doe',
  avatar: 'https://...'
}));

// Кэширование данных пользователей (обновляется при загрузке)
localStorage.setItem('usersData', JSON.stringify(users));
```

---

## 3. Схема роутинга

| Путь | Компонент | Требует авторизации | Описание |
|------|-----------|-------------------|---------|
| `/` | LoginPage | Нет | Страница входа (или редирект на главную, если авторизован) |
| `/home` | HomePage | Да | Таблица участников |
| `/participant/:userId` | ParticipantPage | Да | Профиль участника |

---

## 4. Расчет прогресса

```javascript
// Функция расчета общего прогресса пользователя
function calculateOverallProgress(userProgress) {
  let totalLessons = 0;
  let completedLessons = 0;

  Object.values(userProgress).forEach(chapter => {
    chapter.lessons.forEach(lesson => {
      totalLessons++;
      if (lesson.completed) {
        completedLessons++;
      }
    });
  });

  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
}

// Функция расчета прогресса по главе
function calculateChapterProgress(chapter) {
  const completed = chapter.lessons.filter(l => l.completed).length;
  return Math.round((completed / chapter.lessons.length) * 100);
}
```

---

## 5. Интеграция Telegram OAuth

### 5.1 Настройка
1. Создать бота через BotFather в Telegram (@BotFather)
2. Получить `TELEGRAM_BOT_TOKEN` и `BOT_USERNAME`
3. Добавить домен в настройки бота через BotFather

### 5.2 Реализация (React компонент)
```jsx
// LoginPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка авторизации
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      navigate('/home');
      return;
    }

    // Загрузка Telegram скрипта
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    document.body.appendChild(script);

    // Обработчик callback от Telegram
    window.onTelegramAuth = (user) => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id.toString(),
        username: user.username,
        avatar: user.photo_url
      }));
      navigate('/home');
    };
  }, [navigate]);

  return (
    <div className="login-container">
      <h1>Unity Course Tracker</h1>
      <script
        async
        src="https://telegram.org/js/telegram-web-app.js"
        data-telegram-login="YOUR_BOT_USERNAME"
        data-size="large"
        data-onauth="onTelegramAuth(user)"
      ></script>
      <noscript>Please enable JavaScript to use this service</noscript>
    </div>
  );
}
```

---

## 6. Управление данными

### 6.1 Загрузка данных при старте
```javascript
// API для получения данных из JSON-файлов в public/
async function loadUsersData() {
  const response = await fetch('/users.json');
  return response.json();
}

async function loadCourseData() {
  const response = await fetch('/course.json');
  return response.json();
}
```

### 6.2 Сохранение изменений (чекбоксы урока)
```javascript
// Функция сохранения прогресса
async function updateUserProgress(userId, chapterId, lessonId, completed) {
  // 1. Обновить localStorage
  const userData = JSON.parse(localStorage.getItem('usersData'));
  const user = userData.users.find(u => u.id === userId);
  
  const lesson = user.progress[chapterId].lessons.find(l => l.id === lessonId);
  lesson.completed = completed;
  
  localStorage.setItem('usersData', JSON.stringify(userData));

  // 2. Опционально: отправить на бэкенд (для постоянного хранения)
  // await fetch('/api/update-progress', { 
  //   method: 'POST', 
  //   body: JSON.stringify({ userId, chapterId, lessonId, completed }) 
  // });
}
```

**Примечание:** Для MVP данные сохраняются только в `localStorage`. Для постоянного хранения требуется простой бэкенд (Node.js/Express).

---

## 7. Дизайн и UX

### 7.1 Палитра цветов
- **Primary:** #007AFF (синий)
- **Secondary:** #34C759 (зелёный)
- **Background:** #F2F2F7 (серый)
- **Text:** #000000 (чёрный)
- **Border:** #E5E5EA (светло-серый)

### 7.2 Компоненты
- **Прогресс-бар:** Высота 8px, радиус 4px, зелёный (#34C759)
- **Чекбокс:** Стандартный HTML input[type="checkbox"]
- **Таблица:** Простая HTML-таблица с чередованием цветов строк
- **Аватар:** Круглая картинка, размер 40x40px (на главной), 80x80px (на странице профиля)

### 7.3 Responsiveness
- **Desktop:** Таблицы в полную ширину
- **Mobile:** Таблица можно оставить как есть или переделать в карточки (опционально)

---

## 8. Технический стек

| Компонент | Технология | Причина выбора |
|-----------|-----------|---|
| **Frontend Framework** | React 18 | Популярен, легко деплоить на GitHub Pages |
| **Bundler** | Vite | Быстро, минимальная конфигурация |
| **Router** | React Router v6 | Стандарт для SPA |
| **Styling** | CSS Modules или Tailwind | Простота и масштабируемость |
| **Auth** | Telegram OAuth | Встроено, не требует бэкенда |
| **Database** | JSON-файлы + localStorage | Максимальная простота, деплой на GitHub Pages |
| **Hosting** | GitHub Pages | Бесплатно, просто |

---

## 9. Фазы разработки

### Phase 1: MVP (Неделя 1-2)
- [ ] Настройка React + Vite проекта
- [ ] Telegram авторизация
- [ ] Главная страница с таблицей участников
- [ ] Страница профиля участника (только чтение)
- [ ] Расчёт и отображение прогресс-баров
- [ ] Деплой на GitHub Pages

### Phase 2: Редактирование (Неделя 3)
- [ ] Редактирование чекбоксов на своей странице профиля
- [ ] Сохранение в localStorage
- [ ] Обновление прогресс-баров в реальном времени

### Phase 3: Оптимизация (Неделя 4)
- [ ] Кеширование данных
- [ ] Загрузка из JSON-файлов
- [ ] Обработка ошибок

### Phase 4+: Расширения (опционально)
- [ ] Бэкенд для постоянного хранения (Firebase/Supabase)
- [ ] Экспорт прогресса (PDF)
- [ ] Уведомления о достижениях
- [ ] Сложные сортировки и фильтры

---

## 10. Развёртывание на GitHub Pages

### 10.1 Инструкции
```bash
# 1. Создать репозиторий на GitHub
# Назвать: unity-course-tracker

# 2. Клонировать и инициализировать Vite
npm create vite@latest . -- --template react
npm install

# 3. Установить зависимости
npm install react-router-dom

# 4. Добавить в vite.config.js
export default {
  base: '/unity-course-tracker/',
  // ... остальная конфигурация
}

# 5. Поместить JSON-файлы в public/
public/
  ├── users.json
  └── course.json

# 6. Сборка и деплой
npm run build
# GitHub Pages будет автоматически деплоить из dist/
```

### 10.2 Конфигурация GitHub Actions (optional)
Добавить `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 11. Примеры кода

### 11.1 HomePage.jsx
```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export function HomePage() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);

    // Загрузить данные пользователей
    fetch('/users.json')
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, [navigate]);

  const calculateProgress = (userProgress) => {
    let total = 0, completed = 0;
    Object.values(userProgress).forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        total++;
        if (lesson.completed) completed++;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="home-page">
      <header>
        <h1>Unity Course Tracker</h1>
        <button onClick={handleLogout}>Выход</button>
      </header>
      <main>
        <table className="users-table">
          <thead>
            <tr>
              <th>Участник</th>
              <th>Прогресс</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.id === currentUser?.id ? 'current-user' : ''}>
                <td className="user-cell">
                  <img src={user.avatar} alt={user.username} className="avatar" />
                  <a href={`/participant/${user.id}`}>{user.username}</a>
                </td>
                <td>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${calculateProgress(user.progress)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{calculateProgress(user.progress)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
```

### 11.2 ParticipantPage.jsx (фрагмент)
```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function ParticipantPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const curr = JSON.parse(localStorage.getItem('currentUser'));
    if (!curr) {
      navigate('/');
      return;
    }
    setCurrentUser(curr);
    setIsOwnProfile(curr.id === userId);

    // Загрузить данные
    Promise.all([
      fetch('/users.json').then(r => r.json()),
      fetch('/course.json').then(r => r.json())
    ]).then(([userData, courseData]) => {
      const foundUser = userData.users.find(u => u.id === userId);
      setUser(foundUser);
      setCourse(courseData);
    });
  }, [userId, navigate]);

  const handleCheckboxChange = (chapterId, lessonId, completed) => {
    if (!isOwnProfile) return;

    const updatedUser = { ...user };
    const lesson = updatedUser.progress[chapterId].lessons.find(l => l.id === lessonId);
    lesson.completed = !completed;
    setUser(updatedUser);

    // Сохранить в localStorage
    const usersData = JSON.parse(localStorage.getItem('usersData'));
    const userToUpdate = usersData.users.find(u => u.id === userId);
    userToUpdate.progress = updatedUser.progress;
    localStorage.setItem('usersData', JSON.stringify(usersData));
  };

  if (!user || !course) return <div>Загрузка...</div>;

  const progress = Math.round(
    Object.values(user.progress).reduce((sum, chapter) => {
      const completed = chapter.lessons.filter(l => l.completed).length;
      return sum + (completed / chapter.lessons.length);
    }, 0) / Object.keys(user.progress).length * 100
  );

  return (
    <div className="participant-page">
      <header>
        <a href="/home">← Назад</a>
        <h1>{user.username}</h1>
      </header>
      <section className="profile-info">
        <img src={user.avatar} alt={user.username} className="avatar-large" />
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span>{progress}%</span>
        </div>
      </section>

      {isOwnProfile && (
        <section className="chapters">
          {course.chapters.map(chapter => (
            <div key={chapter.id} className="chapter">
              <h3>{chapter.title}</h3>
              <ul className="lessons">
                {chapter.lessons.map(lesson => {
                  const userLesson = user.progress[chapter.id].lessons.find(l => l.id === lesson.id);
                  return (
                    <li key={lesson.id}>
                      <input 
                        type="checkbox" 
                        checked={userLesson?.completed || false}
                        onChange={() => handleCheckboxChange(chapter.id, lesson.id, userLesson?.completed)}
                      />
                      <label>{lesson.title}</label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
```

---

## 12. Тестирование

### 12.1 Сценарии тестирования
1. **Авторизация:** Вход через Telegram, редирект на главную
2. **Главная страница:** Отображение всех участников, корректный расчёт прогресса
3. **Страница профиля (чужая):** Просмотр профиля без редактирования
4. **Страница профиля (своя):** Редактирование чекбоксов, обновление прогресс-баров
5. **Выход:** Очистка localStorage, редирект на страницу входа

### 12.2 Инструменты
- Chrome DevTools для проверки localStorage
- Manual тестирование на разных браузерах
- GitHub Pages для финального тестирования

---

## 13. Метрики успеха

- ✅ Проект запущен на GitHub Pages
- ✅ Авторизация работает без бэкенда
- ✅ Все 3 страницы функциональны
- ✅ Прогресс-бары обновляются в реальном времени
- ✅ Данные сохраняются в localStorage
- ✅ Время загрузки < 2 сек
- ✅ Работает на мобильных устройствах

---

## 14. Возможные улучшения в будущем

1. **Бэкенд интеграция** (Firebase, Supabase)
   - Постоянное хранение данных
   - Синхронизация между устройствами

2. **Расширенный функционал**
   - Сортировка и фильтрация участников
   - Экспорт прогресса (PDF, CSV)
   - Чат или комментарии по урокам
   - Система достижений/бейджей

3. **Оптимизация**
   - Service Worker для работы офлайн
   - Кеширование аватаров
   - Компрессия JSON-файлов

4. **Интеграции**
   - Discord вместо Telegram (альтернатива)
   - Синхронизация с внешними платформами обучения

---

## 15. Контакты и поддержка

- **Вопросы по разработке:** GitHub Issues
- **Предложения по функциям:** GitHub Discussions
- **Баги:** GitHub Issues с тегом `bug`

---

**Версия PRD:** 1.0  
**Дата создания:** 2025-12-09  
**Последнее обновление:** 2025-12-09