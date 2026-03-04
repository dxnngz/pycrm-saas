import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Task } from '../types';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.tasks.getAll();
            setTasks(data);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = async (data: Partial<Task>) => {
        const newTask = await api.tasks.create(data);
        setTasks(prev => [...prev, newTask]);
        return newTask;
    };

    const toggleTask = async (id: number) => {
        await api.tasks.toggle(id);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = async (id: number) => {
        await api.tasks.delete(id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return {
        tasks,
        loading,
        loadTasks,
        createTask,
        toggleTask,
        deleteTask,
    };
};
