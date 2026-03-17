import {type FC, type PropsWithChildren} from "react";
import styled from "@emotion/styled";
import Header from "./header";
import Footer from "./footer";

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100dvh;
`;

const Main = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
`;

const Page: FC<PropsWithChildren> = ({children}: PropsWithChildren) => {
    return (
        <Wrapper>
            <Header/>
            <Main>
                {children}
            </Main>
            <Footer/>
        </Wrapper>
    );
}

export default Page;