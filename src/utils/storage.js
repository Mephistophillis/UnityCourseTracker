export const COURSE_DATA_URL = '/cource-runners/course.json';
export const USERS_DATA_URL = '/cource-runners/users.json';

// Load course structure
export async function loadCourseData() {
    const response = await fetch(COURSE_DATA_URL);
    if (!response.ok) throw new Error('Failed to load course data');
    return response.json();
}

// Load users data (only once, then cache in localStorage)
export async function loadUsersData() {
    const cached = localStorage.getItem('usersData');
    if (cached) {
        return JSON.parse(cached);
    }

    const response = await fetch(USERS_DATA_URL);
    if (!response.ok) throw new Error('Failed to load users data');
    const data = await response.json();

    localStorage.setItem('usersData', JSON.stringify(data));
    return data;
}

// Get all users
export function getUsers() {
    const data = localStorage.getItem('usersData');
    return data ? JSON.parse(data).users : [];
}

// Get specific user
export function getUser(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId);
}

// Update user progress
export function updateUserProgress(userId, chapterId, lessonId, completed) {
    const data = JSON.parse(localStorage.getItem('usersData'));
    const user = data.users.find(u => u.id === userId);

    if (user && user.progress[chapterId]) {
        const lesson = user.progress[chapterId].lessons.find(l => l.id === lessonId);
        if (lesson) {
            lesson.completed = completed;
            localStorage.setItem('usersData', JSON.stringify(data));
            return true;
        }
    }
    return false;
}

// Auth helpers
export function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

export function loginUser(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
}

export function logoutUser() {
    localStorage.removeItem('currentUser');
}
