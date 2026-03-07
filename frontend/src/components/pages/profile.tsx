import {type FC, Fragment} from "react";
import styled from "@emotion/styled";
import {Avatar, Space} from "antd";
import {useAuth} from "../../hooks/auth/hook.ts";
import PrimaryButton from "../public/primaryButton.tsx";
import {useNavigate} from "react-router";
import {userIconPath} from "../../static.ts";

const ProfileContainer = styled.div`
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
`;

const UserHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 30px;
    margin-bottom: 40px;
    background: #323A7F61;
    padding: 30px;
    border-radius: 20px;
    border: 3px solid #343434;

    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

const UserName = styled.h2`
    margin: 0;
    color: #E0FF25;
    font-size: 32px;
    font-weight: 600;
`;

const UserRating = styled.p`
    margin: 0;
    font-size: 20px;
    color: #fff;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FullWidthCard = styled.div`
    grid-column: span 2;
    @media (max-width: 768px) {
        grid-column: span 1;
    }
`;

const Card = styled.div`
    background: #323A7F61;
    border: 3px solid #343434;
    border-radius: 15px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const CardTitle = styled.h3`
    margin: 0;
    color: #E0FF25;
    font-size: 18px;
    font-weight: 500;
`;

const StatsRow = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-wrap: wrap;
`;

const StatBox = styled.div`
    flex: 1;
    min-width: 100px;
`;

const StatTitle = styled.div`
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    margin-bottom: 4px;
`;

const StatValue = styled.div<{ highlight?: boolean }>`
    color: ${props => props.highlight ? '#E0FF25' : '#fff'};
    font-size: 24px;
    font-weight: 600;
`;

const StatSuffix = styled.span`
    color: rgba(255, 255, 255, 0.4);
    font-size: 16px;
    margin-left: 4px;
    font-weight: normal;
`;

const Page: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <ProfileContainer>
                <Card style={{alignItems: 'center', marginTop: '50px', textAlign: 'center'}}>
                    <CardTitle>Вы не авторизованы</CardTitle>
                    <p style={{color: '#fff'}}>Чтобы просмотреть профиль, пожалуйста, войдите в аккаунт или зарегистрируйтесь.</p>
                    <Space size="middle">
                        <PrimaryButton size="large" onClick={() => navigate('/signin')}>Войти</PrimaryButton>
                        <PrimaryButton size="large" onClick={() => navigate('/signup')}>Регистрация</PrimaryButton>
                    </Space>
                </Card>
            </ProfileContainer>
        );
    }

    return (
        <Fragment>
            <ProfileContainer>
                <UserHeader>
                    <Avatar size={120} src={userIconPath} style={{ border: '2px solid #E0FF25' }}/>
                    <UserInfo>
                        <UserName>{user.name}</UserName>
                        <UserRating>Рейтинг: {user.stats.rate}</UserRating>
                    </UserInfo>
                </UserHeader>

                <StatsGrid>
                    <Card>
                        <CardTitle>Количество активностей</CardTitle>
                        <StatsRow>
                            <StatBox>
                                <StatTitle>Тренировки</StatTitle>
                                <StatValue>{user.stats.trains_count}</StatValue>
                            </StatBox>
                            <StatBox>
                                <StatTitle>PvP</StatTitle>
                                <StatValue>{user.stats.pvp_count}</StatValue>
                            </StatBox>
                        </StatsRow>
                    </Card>

                    <Card>
                        <CardTitle>Точность ответов</CardTitle>
                        <StatsRow>
                            <StatBox>
                                <StatTitle>Тренировки</StatTitle>
                                <StatValue>{user.stats.accuracy_train}<StatSuffix>%</StatSuffix></StatValue>
                            </StatBox>
                            <StatBox>
                                <StatTitle>PvP</StatTitle>
                                <StatValue>{user.stats.accuracy_pvp}<StatSuffix>%</StatSuffix></StatValue>
                            </StatBox>
                            <StatBox>
                                <StatTitle>Всего</StatTitle>
                                <StatValue highlight>{user.stats.accuracy_total}<StatSuffix>%</StatSuffix></StatValue>
                            </StatBox>
                        </StatsRow>
                    </Card>

                    <FullWidthCard>
                        <Card>
                            <CardTitle>Средняя скорость решения <span style={{ whiteSpace: "nowrap" }}>(сек/задачу)</span></CardTitle>
                            <StatsRow>
                                <StatBox>
                                    <StatTitle>Тренировки</StatTitle>
                                    <StatValue>{user.stats.speed_train.toFixed(1)}</StatValue>
                                </StatBox>
                                <StatBox>
                                    <StatTitle>PvP</StatTitle>
                                    <StatValue>{user.stats.speed_pvp.toFixed(1)}</StatValue>
                                </StatBox>
                                <StatBox>
                                    <StatTitle>Всего</StatTitle>
                                    <StatValue highlight>{user.stats.speed_total.toFixed(1)}</StatValue>
                                </StatBox>
                            </StatsRow>
                        </Card>
                    </FullWidthCard>
                </StatsGrid>
            </ProfileContainer>
        </Fragment>
    );
}

export default Page;