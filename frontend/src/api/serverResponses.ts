import { SubjectThemesType } from "../hooks/subjectThemes/subjectThemesContext.ts";

export type CustomErrorResponse = {
    error: string,
}

export const isCustomError = (data: unknown): data is CustomErrorResponse => {
    return (data !== null && typeof data === 'object' && 'error' in data);
}

export type Error = {
    error: string;
}

export type StartTrainingResponse = {
    training_id: number;
    message: string;
}

export type CurrentSessionResponse = {
    type: 'nothing' | 'pvp' | 'training';
    room_id?: string;
    close_time?: string;
}

export type TokenObtainPair = {
    username: string;
    password?: string;
    access: string;
    refresh: string;
}

export type TokenRefresh = {
    access: string;
    refresh: string;
}

export type UserStats = {
    rate: number;
    trains_count: number;
    pvp_count: number;
    accuracy_train: number;
    accuracy_pvp: number;
    accuracy_total: number;
    speed_train: number;
    speed_pvp: number;
    speed_total: number;
}

export type UserProfile = {
    id: number;
    name: string;
    stats: UserStats;
    picture?: string;
}

export type SimpleUserProfile = {
    id: number;
    name: string;
    rate: number;
    picture?: string;
}

export type SearchUserResponse = {
    users: SimpleUserProfile[];
    page: number;
    items_count: number;
}

export type BaseTask = {
    task_id: number;
    question: string;
    is_correct?: boolean;
}

export type BaseTaskResponse = {
    items: BaseTask[];
    page: number;
    items_count: number;
}

export type SubjectTheme = {
    id: number;
    name: string;
}

export type Subject = {
    id: number;
    name: string;
    themes: SubjectTheme[];
}

export type TrainingTaskResponse = {
    task_id: number;
    question: string;
    my_answer?: string;
    is_correct?: boolean;
    start_time: string;
}

export type TrainingState = {
    tasks: TrainingTaskResponse[];
    solved_count: number;
}

export type PVPTaskResponse = {
    task_id: number;
    question: string;
    my_answer?: string | boolean;
    end_time: string;
}

export const isUserProfile = (data: unknown): data is UserProfile => {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as UserProfile;
    return (
        typeof candidate.id === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.stats === 'object' &&
        candidate.stats !== null &&
        typeof candidate.stats.rate === 'number'
    );
}

export const isBaseTaskResponse = (data: unknown): data is BaseTaskResponse => {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as BaseTaskResponse;
    return (
        Array.isArray(candidate.items) &&
        typeof candidate.page === 'number' &&
        typeof candidate.items_count === 'number'
    );
}

export const isSubjects = (data: unknown): data is Subject[] => {
    if (!Array.isArray(data)) return false;
    return data.every(item => (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'number' &&
        typeof item.name === 'string' &&
        Array.isArray(item.themes)
    ));
}


export type SubjectsThemesResponse = SubjectThemesType[];

export const isSubjectsThemes = (data: unknown): data is SubjectsThemesResponse => {
    if (!Array.isArray(data)) {
        return false;
    }

    return data.every((item): item is SubjectThemesType => {
        if (typeof item !== 'object' || item === null) {
            return false;
        }

        const candidate = item as Record<string, unknown>;

        return (
            typeof candidate.subject === 'string' &&
            Array.isArray(candidate.themes) &&
            candidate.themes.every((t) => typeof t === 'string')
        );
    });
};
