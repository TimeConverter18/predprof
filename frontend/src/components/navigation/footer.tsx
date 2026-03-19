import styled from "@emotion/styled";
import type {FC} from "react";

const FooterContainer = styled.div`
    display: flex;
    flex-direction: row;
    background-color: #000000;
    width: 100%;
    gap: 5px;
    min-height: 60px;
    padding: 20px;
    box-sizing: border-box;
    align-items: center;
    justify-content: start;
`;

const Footer: FC = () => {
    return (
        <FooterContainer>
            <p>© 2026 <b style={{color: "#E0FF25"}}>Предпроф</b></p>
            <p style={{fontWeight: "bold"}}>|</p>
            <a style={{fontWeight: "bolder", color: "#E0FF25", textDecoration: "underline"}} href="/admin">Админка</a>
        </FooterContainer>
    )
}

export default Footer;