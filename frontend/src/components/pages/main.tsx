import {type FC, useEffect, useState} from "react";
import styled from "@emotion/styled";
import PrimaryButton from "../public/primaryButton";
import UserCard from "../public/userCard";
import type {SimpleUserProfile} from "../../api/serverResponses";
import {TrophyOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router";
import CardContainer from "../components/containers/CardContainer";
import StyledTitle from "../components/textComponents/StyledTitle";
import StyledLead from "../components/textComponents/StyledLead";
import PageContainer from "../components/containers/PageContainer";
import api from "../../api/api";


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

const Page: FC = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<SimpleUserProfile[]>([]);

    useEffect(() => {
        api.get("/users/leaderboard/?limit=10").then((res) => {
            if (res && res.status === 200 && Array.isArray(res.data)) {
                setLeaderboard(res.data);
            }
        });
    }, []);

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