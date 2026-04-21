import {Space} from "antd";
import PrimaryButton from "@/components/public/primaryButton.tsx";
import {useNavigate} from "react-router";
import styled from "@emotion/styled";

const ProfileContainer = styled.div`
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
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

const Page = () => {
    const navigate = useNavigate();

    return (
        <ProfileContainer>
            <Card style={{alignItems: 'center', marginTop: '50px', textAlign: 'center'}}>
                <CardTitle>Вы не авторизованы</CardTitle>
                <p style={{color: '#fff'}}>Чтобы просмотреть страницу, пожалуйста, войдите в аккаунт или зарегистрируйтесь.</p>
                <Space size="middle">
                    <PrimaryButton size="large" onClick={() => navigate('/signin')}>Войти</PrimaryButton>
                    <PrimaryButton size="large" onClick={() => navigate('/signup')}>Регистрация</PrimaryButton>
                </Space>
            </Card>
        </ProfileContainer>
    )
}

export default Page