import {createContext, type ReactNode} from "react";
import type {UserProfile} from "../../api/serverResponses";

export type Props = {
    children: ReactNode;
}

export type AuthContextType = {
    user: UserProfile | null,
    auth: boolean | null,
    reload: () => void,
}

export const AuthContextProvider = createContext<AuthContextType | undefined>(undefined);
