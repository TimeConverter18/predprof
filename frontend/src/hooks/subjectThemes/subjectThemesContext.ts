import {createContext} from "react";
import {Subject} from "../../api/serverResponses.ts";

export type SubjectThemesType = {
    subjects: Subject[],
}

export const SubjectThemesContextProvider = createContext<SubjectThemesType | undefined>(undefined);
