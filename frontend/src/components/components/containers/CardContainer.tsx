import styled from "@emotion/styled";

const CardContainer = styled.section`
        display: flex;
        flex-direction: column;
        gap: 18px;
        align-items: center;
        text-align: center;
        max-width: 820px;
        padding: 32px 28px;
        border-radius: 18px;
        background: linear-gradient(160deg, rgba(50, 58, 127, 0.35), rgba(224, 255, 37, 0.12));
        background-size: 200% 200%;
        border: 3px solid rgba(224, 255, 37, 0.35);
        animation: gradientShift 2s ease infinite;
    
        @keyframes gradientShift {
            0% {
                background-position: 0 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0 50%;
            }
`

export default CardContainer;