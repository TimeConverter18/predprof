import type { SubjectThemesType } from "../hooks/subjectThemes/subjectThemesContext";

export type Error = {
    error: string;
}

export const isError = (data: unknown): data is Error => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as Error).error === "string"
    );
}

export type StartTrainingResponse = {
    training_id: number;
    started_at: string;
    planed_finish: string;
}

export const isStartTrainingResponse = (data: unknown): data is StartTrainingResponse => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as StartTrainingResponse).training_id === "number"
    );
}

export type CurrentSessionResponse = {
    type: "nothing" | "pvp" | "training";
    room_id?: string;
    close_time?: string;
}

export const isCurrentSessionResponse = (data: unknown): data is CurrentSessionResponse => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as CurrentSessionResponse;
    const typeOk = candidate.type === "nothing" || candidate.type === "pvp" || candidate.type === "training";
    const roomOk = typeof candidate.room_id === "undefined" || typeof candidate.room_id === "string";
    const closeOk = typeof candidate.close_time === "undefined" || typeof candidate.close_time === "string";
    return typeOk && roomOk && closeOk;
}

export type TokenObtainPair = {
    username: string;
    password: string;
    access: string;
    refresh: string;
}

export const isTokenObtainPair = (data: unknown): data is TokenObtainPair => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as TokenObtainPair).username === "string" &&
        typeof (data as TokenObtainPair).password === "string" &&
        typeof (data as TokenObtainPair).access === "string" &&
        typeof (data as TokenObtainPair).refresh === "string"
    );
}

export type TokenRefresh = {
    access: string;
    refresh: string;
}

export const isTokenRefresh = (data: unknown): data is TokenRefresh => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as TokenRefresh).access === "string" &&
        typeof (data as TokenRefresh).refresh === "string"
    );
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

export const isUserStats = (data: unknown): data is UserStats => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as UserStats).rate === "number" &&
        typeof (data as UserStats).trains_count === "number" &&
        typeof (data as UserStats).pvp_count === "number" &&
        typeof (data as UserStats).accuracy_train === "number" &&
        typeof (data as UserStats).accuracy_pvp === "number" &&
        typeof (data as UserStats).accuracy_total === "number" &&
        typeof (data as UserStats).speed_train === "number" &&
        typeof (data as UserStats).speed_pvp === "number" &&
        typeof (data as UserStats).speed_total === "number"
    );
}

export type UserProfile = {
    id: number;
    name: string;
    stats: UserStats;
    admin: boolean;
}

export const isUserProfile = (data: unknown): data is UserProfile => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as UserProfile;
    return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        isUserStats(candidate.stats)
    );
}

export type SimpleUserProfile = {
    id: number;
    name: string;
    rate: number;
}

export const isSimpleUserProfile = (data: unknown): data is SimpleUserProfile => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as SimpleUserProfile;
    return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        typeof candidate.rate === "number"
    );
}

export type BaseTask = {
    task_id: number;
    question: string;
    is_correct: boolean | null;
}

export const isBaseTask = (data: unknown): data is BaseTask => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as BaseTask;
    const correctOk = candidate.is_correct === null || typeof candidate.is_correct === "boolean";
    return (
        typeof candidate.task_id === "number" &&
        typeof candidate.question === "string" &&
        correctOk
    );
}

export type BaseTaskResponse = {
    items: BaseTask[];
    page: number;
    items_count: number;
}

export const isBaseTaskResponse = (data: unknown): data is BaseTaskResponse => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as BaseTaskResponse;
    return (
        Array.isArray(candidate.items) &&
        candidate.items.every(isBaseTask) &&
        typeof candidate.page === "number" &&
        typeof candidate.items_count === "number"
    );
}

export type SubjectTheme = {
    id: number;
    name: string;
}

export const isSubjectTheme = (data: unknown): data is SubjectTheme => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as SubjectTheme).id === "number" &&
        typeof (data as SubjectTheme).name === "string"
    );
}

export type Subject = {
    id: number;
    name: string;
    themes: SubjectTheme[];
}

export const isSubject = (data: unknown): data is Subject => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as Subject;
    return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        Array.isArray(candidate.themes) &&
        candidate.themes.every(isSubjectTheme)
    );
}

export const isSubjects = (data: unknown): data is Subject[] => {
    return Array.isArray(data) && data.every(isSubject);
}

export type TrainingTaskResponse = {
    question: string;
    is_correct: boolean | null;
}

export const isTrainingTaskResponse = (data: unknown): data is TrainingTaskResponse => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as TrainingTaskResponse;
    return (
        typeof candidate.question === "string" &&
        (candidate.is_correct === null || typeof candidate.is_correct === "boolean")
    );
}

export type TrainingState = {
    tasks: TrainingTaskResponse[];
    solved_count: number;
}

export const isTrainingState = (data: unknown): data is TrainingState => {
    if (typeof data !== "object" || data === null) return false;
    const candidate = data as TrainingState;
    return (
        Array.isArray(candidate.tasks) &&
        candidate.tasks.every(isTrainingTaskResponse) &&
        typeof candidate.solved_count === "number"
    );
}

export type PVPTaskResponse = {
    task_order: number;
    question: string;
}

export const isPVPTaskResponse = (data: unknown): data is PVPTaskResponse => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as PVPTaskResponse).task_order === "number" &&
        typeof (data as PVPTaskResponse).question === "string"
    );
}

export type MatchmakingSearchMessage = {
    type: "is_search";
    is_search: boolean;
}

export const isMatchmakingSearchMessage = (data: unknown): data is MatchmakingSearchMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as MatchmakingSearchMessage).type === "is_search" &&
        typeof (data as MatchmakingSearchMessage).is_search === "boolean"
    );
}

export type MatchmakingRoomFoundMessage = {
    type: "room_id";
    room_id: number;
}

export const isMatchmakingRoomFoundMessage = (data: unknown): data is MatchmakingRoomFoundMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as MatchmakingRoomFoundMessage).type === "room_id" &&
        typeof (data as MatchmakingRoomFoundMessage).room_id === "number"
    );
}

export type PVPAnswerMessage = {
    task_index: number;
    answer: string;
}

export const isPVPAnswerMessage = (data: unknown): data is PVPAnswerMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as PVPAnswerMessage).task_index === "number" &&
        typeof (data as PVPAnswerMessage).answer === "string"
    );
}

export type PVPResultMessage = {
    type: "result";
    task_order: number;
    me_is_correct: boolean;
    enemy_is_correct: boolean;
    next_task_order: number | null;
}

export const isPVPResultMessage = (data: unknown): data is PVPResultMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as PVPResultMessage).type === "result" &&
        typeof (data as PVPResultMessage).task_order === "number" &&
        typeof (data as PVPResultMessage).me_is_correct === "boolean" &&
        typeof (data as PVPResultMessage).enemy_is_correct === "boolean" &&
        (typeof (data as PVPResultMessage).next_task_order === "number"
        || (data as PVPResultMessage).next_task_order === null)
    );
}

export type PVPStatsMessage = {
    type: "stats";
    completion_percentage: number;
    correct_percentage: number;
    enemy_correct_percentage: number;
    current_task: number;
}

export const isPVPStatsMessage = (data: unknown): data is PVPStatsMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as PVPStatsMessage).type === "stats" &&
        typeof (data as PVPStatsMessage).completion_percentage === "number" &&
        typeof (data as PVPStatsMessage).correct_percentage === "number" &&
        typeof (data as PVPStatsMessage).enemy_correct_percentage === "number" &&
        typeof (data as PVPStatsMessage).current_task === "number"
    );
}

export type PVPFinishRoundMessage = {
    type: "finish_round";
    my_delta: number;
    my_old_rating: number;
    my_new_rating: number;
    enemy_delta: number;
    enemy_old_rating: number;
    enemy_new_rating: number;
}

export const isPVPFinishRoundMessage = (data: unknown): data is PVPFinishRoundMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as PVPFinishRoundMessage).type === "finish_round" &&
        typeof (data as PVPFinishRoundMessage).my_delta === "number" &&
        typeof (data as PVPFinishRoundMessage).my_old_rating === "number" &&
        typeof (data as PVPFinishRoundMessage).my_new_rating === "number" &&
        typeof (data as PVPFinishRoundMessage).enemy_delta === "number" &&
        typeof (data as PVPFinishRoundMessage).enemy_old_rating === "number" &&
        typeof (data as PVPFinishRoundMessage).enemy_new_rating === "number"
    );
}

export type PVPErrorMessage = {
    type: "error";
    errors: string;
}

export const isPVPErrorMessage = (data: unknown): data is PVPErrorMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as PVPErrorMessage).type === "error" &&
        typeof (data as PVPErrorMessage).errors === "string"
    );
}

export type PVPServerMessage =
    | PVPResultMessage
    | PVPStatsMessage
    | PVPFinishRoundMessage
    | PVPErrorMessage;

export const isPVPServerMessage = (data: unknown): data is PVPServerMessage => {
    return (
        isPVPResultMessage(data) ||
        isPVPStatsMessage(data) ||
        isPVPFinishRoundMessage(data) ||
        isPVPErrorMessage(data)
    );
}

export type TrainingAnswerMessage = {
    task_index: number;
    answer: string;
}

export const isTrainingAnswerMessage = (data: unknown): data is TrainingAnswerMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as TrainingAnswerMessage).task_index === "number" &&
        typeof (data as TrainingAnswerMessage).answer === "string"
    );
}

export type TrainingResultMessage = {
    type: "result";
    task_index: number;
    is_correct: boolean;
}

export const isTrainingResultMessage = (data: unknown): data is TrainingResultMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as TrainingResultMessage).type === "result" &&
        typeof (data as TrainingResultMessage).task_index === "number" &&
        typeof (data as TrainingResultMessage).is_correct === "boolean"
    );
}

export type TrainingFinishMessage = {
    type: "finish_training";
    message: string;
}

export const isTrainingFinishMessage = (data: unknown): data is TrainingFinishMessage => {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as TrainingFinishMessage).type === "finish_training" &&
        typeof (data as TrainingFinishMessage).message === "string"
    );
}

export type TrainingServerMessage = TrainingResultMessage | TrainingFinishMessage;

export const isTrainingServerMessage = (data: unknown): data is TrainingServerMessage => {
    return isTrainingResultMessage(data) || isTrainingFinishMessage(data);
}

export type SubjectsThemesResponse = SubjectThemesType[];

export const isSubjectsThemes = (data: unknown): data is SubjectsThemesResponse => {
    if (!Array.isArray(data)) {
        return false;
    }

    return data.every((item): item is SubjectThemesType => {
        if (typeof item !== "object" || item === null) {
            return false;
        }

        const candidate = item as Record<string, unknown>;

        return (
            typeof candidate.subject === "string" &&
            Array.isArray(candidate.themes) &&
            candidate.themes.every((t) => typeof t === "string")
        );
    });
};
