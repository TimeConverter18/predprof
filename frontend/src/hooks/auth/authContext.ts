import {createContext, type ReactNode} from "react";
import {UserProfile} from "../../api/serverResponses.ts";

export type Props = {
    children: ReactNode;
}

export type AuthContextType = {
    user: UserProfile | null,
    auth: boolean | null,
    reload: () => void,
}

export const AuthContextProvider = createContext<AuthContextType | undefined>(undefined);
