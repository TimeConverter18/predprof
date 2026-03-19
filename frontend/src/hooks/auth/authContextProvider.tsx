import {type JSX, useCallback, useEffect, useRef, useState} from "react";
import type {UserProfile} from "../../api/serverResponses";
import {AuthContextProvider, type Props} from "./authContext";
import api from "../../api/api";
import type {AxiosError, AxiosResponse} from "axios";

function fetchMe(): Promise<{ user: UserProfile | null; auth: boolean | null }> {
    return api
        .get("/users/me/", { withCredentials: true })
        .then((res: AxiosResponse) => {
            if (res && res.status === 200) {
                return {
                    user: {
                        id: res.data.id,
                        name: res.data.username,
                        stats: {
                            rate: res.data.stats?.rate ?? 0,
                            trains_count: res.data.stats?.trains_count ?? 0,
                            pvp_count: res.data.stats?.pvp_count ?? 0,
                            speed_train: res.data.stats?.speed_train ?? 0,
                            speed_pvp: res.data.stats?.speed_pvp ?? 0,
                            speed_total: res.data.stats?.speed_total ?? 0,
                            accuracy_train: res.data.stats?.accuracy_train ?? 0,
                            accuracy_pvp: res.data.stats?.accuracy_pvp ?? 0,
                            accuracy_total: res.data.stats?.accuracy_total ?? 0,
                        },
                        admin: res.data.is_superuser ?? false
                    } as UserProfile,
                    auth: true as boolean | null,
                };
            } else {
                return {
                    user: null,
                    auth: res.status === 401 ? false : null,
                };
            }
        })
        .catch((res: AxiosError) => {
            const httpStatus = res.response?.status;
            return {
                user: null,
                auth: httpStatus === 401 ? false : (false as boolean | null),
            };
        });
}

export function AuthProvider({ children }: Props): JSX.Element {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [auth, setAuth] = useState<boolean | null>(null);
    const mountedRef = useRef(true);

    const reload = useCallback(async () => {
        const result = await fetchMe();
        if (mountedRef.current) {
            setUser(result.user);
            setAuth(result.auth);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        reload();
        return () => { mountedRef.current = false; };
    }, [reload]);

    return (
        <AuthContextProvider.Provider value={{ user, auth, reload }}>
            {children}
        </AuthContextProvider.Provider>
    );
}