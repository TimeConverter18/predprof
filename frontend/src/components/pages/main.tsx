import React, {type FC} from "react";
import styled from "@emotion/styled";
import PrimaryButton from "../public/primaryButton.tsx";
import UserCard from "../public/userCard.tsx";
import {SimpleUserProfile} from "../../api/serverResponses.ts";
import {TrophyOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router";
import CardContainer from "../components/containers/CardContainer.tsx";
import StyledTitle from "../components/textComponents/StyledTitle.tsx";
import StyledLead from "../components/textComponents/StyledLead.tsx";
import PageContainer from "../components/containers/PageContainer.tsx";


const LeaderboardSection = styled.section`
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    max-width: 820px;
    align-items: center;
`;

const SectionTitle = styled.h2`
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 700;
    color: #E0FF25;
`;

const LeaderboardList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const RankBadge = styled.div<{ variant: "gold" | "silver" | "bronze" | "normal" }>`
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-weight: 800;
    color: #0f0f0f;
    background: ${({ variant }) => {
        switch (variant) {
            case "gold":
                return "linear-gradient(135deg, #FFD700, #E0C200)";
            case "silver":
                return "linear-gradient(135deg, #E6E8EA, #C8CCD0)";
            case "bronze":
                return "linear-gradient(135deg, #D1935B, #B9793F)";
            default:
                return "#E0FF25";
        }
    }};
`;

const mockLeaderboardData: SimpleUserProfile[] = [
    { id: 1, name: "alex_master", rate: 2850},
    { id: 2, name: "maria_pro", rate: 2720},
    { id: 3, name: "ivan_genius", rate: 2650},
    { id: 4, name: "kate_smart", rate: 2580},
    { id: 5, name: "dmitry_ace", rate: 2490},
    { id: 6, name: "olga_star", rate: 2430},
    { id: 7, name: "sergey_top", rate: 2370},
    { id: 8, name: "anna_best", rate: 2310},
    { id: 9, name: "tim_fury", rate: 2260},
    { id: 10, name: "max_fast", rate: 2200},
    { id: 11, name: "leo_focus", rate: 2180},
];

const Page: FC = () => {
    const navigate = useNavigate();
    const leaderboard = mockLeaderboardData.slice(0, 10);

    const getVariant = (index: number): "gold" | "silver" | "bronze" | "normal" => {
        if (index === 0) return "gold";
        if (index === 1) return "silver";
        if (index === 2) return "bronze";
        return "normal";
    };

    return (
        <PageContainer>
            <CardContainer>
                <StyledTitle>Ботай олимпиады!</StyledTitle>
                <StyledLead>
                    Тренируйся, набивай рейтинг и поднимайся в топ.
                </StyledLead>
                <PrimaryButton size="large" onClick={() => navigate("/training")}>Начать тренировку</PrimaryButton>
            </CardContainer>

            <LeaderboardSection>
                <SectionTitle><TrophyOutlined/> Таблица лидеров</SectionTitle>
                <LeaderboardList>
                    {leaderboard.map((user, idx) => (
                        <Row key={user.id}>
                            <RankBadge variant={getVariant(idx)}>{idx + 1}</RankBadge>
                            <UserCard {...user} />
                        </Row>
                    ))}
                </LeaderboardList>
            </LeaderboardSection>
        </PageContainer>
    );
};

export default Page;