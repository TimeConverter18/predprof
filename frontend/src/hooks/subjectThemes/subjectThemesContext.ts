import {createContext} from "react";
import type {Subject} from "../../api/serverResponses";

export type SubjectThemesType = {
    subjects: Subject[],
    reload: () => void,
}

export const SubjectThemesContextProvider = createContext<SubjectThemesType | undefined>(undefined);
