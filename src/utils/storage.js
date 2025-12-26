import { supabase } from '../lib/supabase';

const isDev = import.meta.env.DEV;
const basePath = isDev ? '' : '/UnityCourseTracker';
export const COURSE_DATA_URL = `${basePath}/course.json`;
export const DEV_USERS_URL = '/dev-users.json';

// Load course structure
export async function loadCourseData() {
    const response = await fetch(COURSE_DATA_URL);
    if (!response.ok) throw new Error('Failed to load course data');
    return response.json();
}

// Load users data - from JSON in dev mode, from Supabase in production
export async function loadUsersData() {
    if (isDev || !supabase) {
        const response = await fetch(DEV_USERS_URL);
        if (!response.ok) return { users: [] };
        const data = await response.json();

        // Merge current user's progress from localStorage
        const currentUser = getCurrentUser();
        if (currentUser) {
            const userIndex = data.users.findIndex(u => String(u.id) === String(currentUser.id));
            if (userIndex >= 0) {
                // Update existing user with localStorage progress
                data.users[userIndex] = { ...data.users[userIndex], progress: currentUser.progress || {} };
            } else {
                // Add current user to the list
                data.users.push(currentUser);
            }
        }
        return data;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error loading users:', error);
        return { users: [] };
    }

    return { users: data || [] };
}

// Get all users
export function getUsers() {
    // This is now synchronous but realistically should be async or cached. 
    // For now, we rely on the Home component calling loadUsersData to fetch fresh data.
    // To keep existing sync references working (if any), we might need a cache, 
    // but the proper way is to fetch async.
    // Returning empty array here as `getUsers` was sync and we can't make it async easily without breaking call sites if they are sync.
    // However, existing usage in Participant.jsx might need updating.
    return [];
}

// Get specific user - from JSON in dev mode, from Supabase in production
export async function getUser(userId) {
    if (isDev || !supabase) {
        // For current user, return from localStorage (has latest progress)
        const currentUser = getCurrentUser();
        if (currentUser && String(currentUser.id) === String(userId)) {
            return currentUser;
        }
        // For other users, load from JSON
        const { users } = await loadUsersData();
        return users.find(u => String(u.id) === String(userId)) || null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

// Update user progress - localStorage in dev mode, Supabase in production
export async function updateUserProgress(userId, chapterId, lessonId, completed) {
    if (isDev || !supabase) {
        // In dev mode, update progress in localStorage (currentUser)
        const currentUser = getCurrentUser();
        if (!currentUser || String(currentUser.id) !== String(userId)) return false;

        let progress = currentUser.progress || {};
        if (!progress[chapterId]) progress[chapterId] = { lessons: [] };

        let lessonIndex = progress[chapterId].lessons.findIndex(l => l.id === lessonId);
        if (lessonIndex >= 0) {
            progress[chapterId].lessons[lessonIndex].completed = completed;
        } else {
            progress[chapterId].lessons.push({ id: lessonId, completed });
        }

        currentUser.progress = progress;
        loginUser(currentUser);
        return true;
    }

    // Production: use Supabase
    // 1. Get current progress
    const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('progress')
        .eq('id', userId)
        .single();

    if (fetchError || !user) return false;

    // 2. Update local object
    let progress = user.progress || {};

    // Ensure structure exists
    if (!progress[chapterId]) progress[chapterId] = { lessons: [] };

    // Find or create lesson
    let lessonIndex = progress[chapterId].lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex >= 0) {
        progress[chapterId].lessons[lessonIndex].completed = completed;
    } else {
        progress[chapterId].lessons.push({ id: lessonId, completed });
    }

    // 3. Save back to Supabase
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ progress })
        .eq('id', userId);

    return !updateError;
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

export async function registerUser(userData) {
    // In dev mode, don't register to Supabase
    if (isDev || !supabase) {
        return userData;
    }

    const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', String(userData.id))
        .single();

    if (!existingUser) {
        const newUser = {
            id: String(userData.id),
            username: userData.username,
            avatar: userData.avatar,
            progress: userData.progress || {},
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(newUser);

        if (error) {
            console.error('Error registering user:', error);
        }
        return newUser;
    }
    return existingUser;
}
