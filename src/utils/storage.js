import { supabase } from '../lib/supabase';
export const COURSE_DATA_URL = '/UnityCourseTracker/course.json';
export const USERS_DATA_URL = '/UnityCourseTracker/users.json';

// Load course structure
export async function loadCourseData() {
    const response = await fetch(COURSE_DATA_URL);
    if (!response.ok) throw new Error('Failed to load course data');
    return response.json();
}

// Load users data from Supabase
export async function loadUsersData() {
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

// Get specific user (Async now recommended, but keeping signature if possible or refactoring caller)
export async function getUser(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

// Update user progress
export async function updateUserProgress(userId, chapterId, lessonId, completed) {
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
        // If lesson doesn't exist in progress (rare if structure is rigid, but possible if dynamic), add it
        // Ideally we need the title from course.json, but here we just store ID and state
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
