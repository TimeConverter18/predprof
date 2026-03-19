import {type JSX, type PropsWithChildren, useCallback, useEffect, useState} from "react";
import {SubjectThemesContextProvider} from "./subjectThemesContext";
import {isSubjects, type Subject} from "../../api/serverResponses";
import api from "../../api/api";
import type {AxiosResponse} from "axios";

export function SubjectThemesProvider({ children }: PropsWithChildren): JSX.Element {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const reload = useCallback(() => {
        api
            .get("/tasks/subjects/")
            .then((res: AxiosResponse) => {
                if (res && res.status === 200) {
                    const data = res.data;
                    if (isSubjects(data)) {
                        setSubjects(data);
                    }
                }
            });
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return (
        <SubjectThemesContextProvider.Provider value={{ subjects, reload }}>
            {children}
        </SubjectThemesContextProvider.Provider>
    );
}

