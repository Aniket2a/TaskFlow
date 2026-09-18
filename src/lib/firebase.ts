import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { Task, Project, Tag, UserProfile } from '../types';

// Firebase Web SDK Configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that required Firebase Web App configuration variables are present
const requiredConfigMap: Record<string, string | undefined> = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

const missingEnvVars = Object.entries(requiredConfigMap)
  .filter(([, val]) => !val)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(
      ', '
    )}. Please configure them in your .env file or environment.`
  );
}

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Diagnostic connection test on client boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

// Structured Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));

  let userMessage = 'Database operation failed. Please try again.';
  if (rawMsg.includes('permission') || rawMsg.includes('Permission') || rawMsg.includes('Missing or insufficient permissions')) {
    userMessage = 'Permission denied. Please check your sign-in status and try again.';
  } else if (rawMsg.includes('unavailable') || rawMsg.includes('network') || rawMsg.includes('Failed to get document')) {
    userMessage = 'Network connection issue. Please check your internet connection.';
  } else if (rawMsg.includes('not-found')) {
    userMessage = 'The requested document was not found.';
  }

  throw new Error(userMessage);
}

/**
 * Authentication Helpers
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Student',
    email: user.email || '',
    avatar: user.photoURL || undefined,
    role: 'Student & Developer',
  };
}

export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Student',
    email: user.email || '',
    avatar: user.photoURL || undefined,
    role: 'Student & Developer',
  };
}

export async function signUpWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  if (name.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }
  return {
    id: user.uid,
    name: name.trim() || user.email?.split('@')[0] || 'Student',
    email: user.email || '',
    avatar: user.photoURL || undefined,
    role: 'Student & Developer',
  };
}

export async function signInGuestUser(): Promise<UserProfile> {
  const result = await signInAnonymously(auth);
  const user = result.user;
  return {
    id: user.uid,
    name: 'Guest Scholar',
    email: 'guest@taskflow.local',
    role: 'Guest Mode',
  };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function getIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    callback({
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
      email: fbUser.email || (fbUser.isAnonymous ? 'guest@taskflow.local' : ''),
      avatar: fbUser.photoURL || undefined,
      role: fbUser.isAnonymous ? 'Guest Mode' : 'Student & Developer',
    });
  });
}

/**
 * Firestore Real-Time Sync & CRUD
 */

/**
 * Helper to ensure operations use the authenticated Firebase UID.
 */
function getAuthenticatedUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User must be authenticated to perform Firestore operations.');
  }
  return uid;
}

/**
 * Parses a raw Firestore document snapshot data into a typed Task.
 */
function parseTaskDoc(id: string, data: Record<string, any>, fallbackUid: string): Task {
  return {
    id,
    userId: data.userId || fallbackUid,
    title: data.title || 'Untitled',
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    projectId: data.projectId || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    dueDate: data.dueDate || undefined,
    dueTime: data.dueTime || undefined,
    recurrence: data.recurrence || 'none',
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    completedAt: data.completedAt || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Parses a raw Firestore document snapshot data into a typed Project.
 */
function parseProjectDoc(id: string, data: Record<string, any>): Project {
  return {
    id,
    name: data.name || 'Untitled Project',
    color: data.color || '#6366f1',
    icon: data.icon || undefined,
    description: data.description || undefined,
  };
}

/**
 * Parses a raw Firestore document snapshot data into a typed Tag.
 */
function parseTagDoc(id: string, data: Record<string, any>): Tag {
  return {
    id,
    name: data.name || 'untagged',
    color: data.color || '#64748b',
  };
}

/**
 * Scoped User Tasks Firestore Operations: users/{uid}/tasks/{taskId}
 */

export function subscribeToUserTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const uid = getAuthenticatedUid();
    const tasksRef = collection(db, 'users', uid, 'tasks');

    return onSnapshot(
      tasksRef,
      (snapshot) => {
        const loadedTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          loadedTasks.push(parseTaskDoc(docSnap.id, docSnap.data(), uid));
        });
        onUpdate(loadedTasks);
      },
      (error) => {
        console.warn('Firestore tasks listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Firestore subscription setup warning:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

export async function getUserTasks(userId?: string): Promise<Task[]> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/tasks`;
  try {
    const tasksRef = collection(db, 'users', uid, 'tasks');
    const snapshot = await getDocs(tasksRef);
    const tasks: Task[] = [];
    snapshot.forEach((docSnap) => {
      tasks.push(parseTaskDoc(docSnap.id, docSnap.data(), uid));
    });
    return tasks;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Sanitizes and serializes a Task object into a clean Firestore document.
 * Ensures NO undefined values are present, strictly adhering to existing schemas and types.
 */
export function cleanTaskForFirestore(
  task: Partial<Task> & { id: string },
  fallbackUid: string
): Record<string, any> {
  const uid = getAuthenticatedUid();
  const now = new Date().toISOString();

  // Subtasks: preserve boolean completed, sanitize string title, empty array if none
  const cleanSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map((st) => ({
        id: st.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: st.title ? String(st.title).trim() : '',
        completed: Boolean(st.completed),
      }))
    : [];

  // Tags: string array, empty array if none
  const cleanTags = Array.isArray(task.tags)
    ? task.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : [];

  const cleanDoc: Record<string, any> = {
    id: task.id,
    userId: uid,
    title: task.title ? String(task.title).trim() : 'Untitled',
    description: task.description ? String(task.description).trim() : '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    projectId: task.projectId ? String(task.projectId).trim() : '',
    tags: cleanTags,
    subtasks: cleanSubtasks,
    recurrence: task.recurrence || 'none',
    createdAt: task.createdAt || now,
    updatedAt: now,
  };

  // Optional string fields: only included when non-empty string, omitted when empty/undefined
  if (task.dueDate && typeof task.dueDate === 'string' && task.dueDate.trim() !== '') {
    cleanDoc.dueDate = task.dueDate.trim();
  }

  if (task.dueTime && typeof task.dueTime === 'string' && task.dueTime.trim() !== '') {
    cleanDoc.dueTime = task.dueTime.trim();
  }

  if (task.status === 'completed') {
    if (task.completedAt && typeof task.completedAt === 'string' && task.completedAt.trim() !== '') {
      cleanDoc.completedAt = task.completedAt.trim();
    } else {
      cleanDoc.completedAt = now;
    }
  }

  // Safety filter: strip any undefined keys under all circumstances
  for (const key of Object.keys(cleanDoc)) {
    if (cleanDoc[key] === undefined) {
      delete cleanDoc[key];
    }
  }

  return cleanDoc;
}

export async function saveTaskToFirestore(task: Task, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const cleanDoc = cleanTaskForFirestore(task, uid);
  const path = `users/${uid}/tasks/${task.id}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', task.id);
    await setDoc(docRef, cleanDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromFirestore(taskId: string, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Scoped User Projects Firestore Operations: users/{uid}/projects/{projectId}
 */

export function subscribeToUserProjects(
  userId: string,
  onUpdate: (projects: Project[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const uid = getAuthenticatedUid();
    const projectsRef = collection(db, 'users', uid, 'projects');

    return onSnapshot(
      projectsRef,
      (snapshot) => {
        const loadedProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          loadedProjects.push(parseProjectDoc(docSnap.id, docSnap.data()));
        });
        onUpdate(loadedProjects);
      },
      (error) => {
        console.warn('Firestore projects listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Firestore projects subscription setup warning:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

export async function getUserProjects(userId?: string): Promise<Project[]> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/projects`;
  try {
    const projectsRef = collection(db, 'users', uid, 'projects');
    const snapshot = await getDocs(projectsRef);
    const projects: Project[] = [];
    snapshot.forEach((docSnap) => {
      projects.push(parseProjectDoc(docSnap.id, docSnap.data()));
    });
    return projects;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export function cleanProjectForFirestore(project: Project, userId?: string): Record<string, any> {
  const uid = userId || auth.currentUser?.uid;
  const cleanDoc: Record<string, any> = {
    id: project.id,
    name: project.name ? project.name.trim() : 'Untitled Project',
    color: project.color || '#6366f1',
    description: project.description ? project.description.trim() : '',
    updatedAt: new Date().toISOString(),
  };

  if (uid) {
    cleanDoc.userId = uid;
  }

  if (project.icon && project.icon.trim() !== '') {
    cleanDoc.icon = project.icon.trim();
  }

  for (const key of Object.keys(cleanDoc)) {
    if (cleanDoc[key] === undefined) {
      delete cleanDoc[key];
    }
  }

  return cleanDoc;
}

export async function saveProjectToFirestore(project: Project, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const cleanDoc = cleanProjectForFirestore(project, uid);
  const path = `users/${uid}/projects/${project.id}`;
  try {
    const docRef = doc(db, 'users', uid, 'projects', project.id);
    await setDoc(docRef, cleanDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromFirestore(projectId: string, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/projects/${projectId}`;
  try {
    const docRef = doc(db, 'users', uid, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Scoped User Tags Firestore Operations: users/{uid}/tags/{tagId}
 */

export function subscribeToUserTags(
  userId: string,
  onUpdate: (tags: Tag[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const uid = getAuthenticatedUid();
    const tagsRef = collection(db, 'users', uid, 'tags');

    return onSnapshot(
      tagsRef,
      (snapshot) => {
        const loadedTags: Tag[] = [];
        snapshot.forEach((docSnap) => {
          loadedTags.push(parseTagDoc(docSnap.id, docSnap.data()));
        });
        onUpdate(loadedTags);
      },
      (error) => {
        console.warn('Firestore tags listener warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Firestore tags subscription setup warning:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

export async function getUserTags(userId?: string): Promise<Tag[]> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/tags`;
  try {
    const tagsRef = collection(db, 'users', uid, 'tags');
    const snapshot = await getDocs(tagsRef);
    const tags: Tag[] = [];
    snapshot.forEach((docSnap) => {
      tags.push(parseTagDoc(docSnap.id, docSnap.data()));
    });
    return tags;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveTagToFirestore(tag: Tag, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const cleanDoc: Record<string, any> = {
    id: tag.id,
    userId: uid,
    name: tag.name ? tag.name.trim() : 'untagged',
    color: tag.color || '#64748b',
    updatedAt: new Date().toISOString(),
  };
  const path = `users/${uid}/tags/${tag.id}`;
  try {
    const docRef = doc(db, 'users', uid, 'tags', tag.id);
    await setDoc(docRef, cleanDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTagFromFirestore(tagId: string, userId?: string): Promise<void> {
  const uid = getAuthenticatedUid();
  const path = `users/${uid}/tags/${tagId}`;
  try {
    const docRef = doc(db, 'users', uid, 'tags', tagId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
