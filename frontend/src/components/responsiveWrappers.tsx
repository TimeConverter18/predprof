import {type FC, type PropsWithChildren} from "react";
import {useMediaQuery} from "react-responsive";

export const Desktop: FC<PropsWithChildren> = ({children}: PropsWithChildren) => {
    const isMobile = useMediaQuery({ minWidth: 768 });
    return isMobile ? children : null;
}

export const Mobile: FC<PropsWithChildren> = ({children}: PropsWithChildren) => {
    const isDesktop = useMediaQuery({ maxWidth: 767.97 });
    return isDesktop ? children : null;
}