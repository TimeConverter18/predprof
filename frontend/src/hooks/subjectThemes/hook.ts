import {useContext} from "react";
import {SubjectThemesContextProvider} from "./subjectThemesContext.ts";

export function useSubjectThemes() {
    const context = useContext(SubjectThemesContextProvider);
    if (!context) {
        throw new Error("useSubjectThemes must be used inside <SubjectThemesProvider>");
    }
    return context;
}