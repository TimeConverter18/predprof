import {type JSX, PropsWithChildren, useEffect, useState} from "react";
import {SubjectThemesContextProvider} from "./subjectThemesContext.ts";
import {isSubjects, Subject} from "../../api/serverResponses.ts";

export function SubjectThemesProvider({ children }: PropsWithChildren): JSX.Element {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const reload = async () => {
        // api
        //     .get("/points/subjects/")
        //     .then((res: AxiosResponse) => {
        //         if (res && res.status === 200) {
        //             const data = res.data;
        //             if (isSubjects(data)) {
        //                 setSubjects(data);
        //             }
        //         }
        //     })

        const data: Subject[] = [
            {
                id: 1,
                name: "Математика",
                themes: [
                    { id: 11, name: "Геометрия" },
                    { id: 12, name: "Алгебра" }
                ]
            },
            {
                id: 2,
                name: "Информатика",
                themes: [
                    { id: 21, name: "Программирование" },
                    { id: 22, name: "Алгоритмы" }
                ]
            }
        ];

        if (isSubjects(data)) {
            setSubjects(data);
        }
    }

    useEffect(() => {
        reload();
    }, []);

    return (
        <SubjectThemesContextProvider.Provider value={{ subjects }}>
            {children}
        </SubjectThemesContextProvider.Provider>
    );
}