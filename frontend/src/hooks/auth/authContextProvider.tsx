import {type JSX, useEffect, useState} from "react";
import api from "../../api/api";
import type {AxiosError, AxiosResponse} from "axios";
import {UserProfile} from "../../api/serverResponses.ts";
import {AuthContextProvider, type Props} from "./authContext.ts";

export function AuthProvider({ children }: Props): JSX.Element {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [auth, setAuth] = useState<boolean | null>(null);

    const reload = async () => {
        setAuth(null);
        setUser({
            id: 1,
            name: "Александр Пушкин",
            picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png",
            stats: {
                rate: 2540,
                trains_count: 150,
                pvp_count: 45,
                speed_train: 320,
                speed_pvp: 380,
                speed_total: 350,
                accuracy_train: 98.5,
                accuracy_pvp: 94.2,
                accuracy_total: 96.3,
            }
        })
        setAuth(true);
        // api
        //     .get("/users/me", { withCredentials: true })
        //     .then((res: AxiosResponse) => {
        //         if (res && res.status === 200) {
        //             setUser({
        //                 id: res.data.id,
        //                 name: res.data.name,
        //                 picture: res.data.picture,
        //                 stats: {
        //                     rate: res.data.stats?.rate ?? 0,
        //                     trains_count: res.data.stats?.trains_count ?? 0,
        //                     pvp_count: res.data.stats?.pvp_count ?? 0,
        //                     speed_train: res.data.stats?.speed_train ?? 0,
        //                     speed_pvp: res.data.stats?.speed_pvp ?? 0,
        //                     speed_total: res.data.stats?.speed_total ?? 0,
        //                     accuracy_train: res.data.stats?.accuracy_train ?? 0,
        //                     accuracy_pvp: res.data.stats?.accuracy_pvp ?? 0,
        //                     accuracy_total: res.data.stats?.accuracy_total ?? 0,
        //                 }
        //             })
        //             setAuth(true)
        //         }
        //         else {
        //             setUser(null)
        //             if (res.status === 401) {
        //                 setAuth(false)
        //             }
        //             else {
        //                 setAuth(null)
        //             }
        //         }
        //     })
        //     .catch((res: AxiosError) => {
        //         setUser(null);
        //         if (res.status === 401) {
        //             setAuth(false)
        //         }
        //         else {
        //             setAuth(null)
        //         }
        //     })
    }

    useEffect(() => {
        reload();
    }, []);

    return (
        <AuthContextProvider.Provider value={{ user, auth, reload }}>
            {children}
        </AuthContextProvider.Provider>
    );
}