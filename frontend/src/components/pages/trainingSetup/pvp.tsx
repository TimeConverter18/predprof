import {type FC, Fragment, type ReactNode, useState} from "react";
import styled from "@emotion/styled";
import PrimaryButton from "../../public/primaryButton.tsx";
import UserCard from "../../public/userCard.tsx";
import {Input, Pagination, Select} from "antd";
import {useSubjectThemes} from "../../../hooks/subjectThemes/hook.ts";
import {Desktop, Mobile} from "../../responsiveWrappers.tsx";
import {SimpleUserProfile} from "../../../api/serverResponses.ts";

import {useNavigate} from "react-router";

const ChooseEnemyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

const DesktopWrapper = styled.div`
    overflow: auto;
    padding: 5px;
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: center;
    gap: 30px;
`

const MobileWrapper = styled.div`
    overflow: auto;
    padding: 5px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    gap: 30px;
    align-items: center;
`

const { Search } = Input;

interface WrapperProps {
    children: ReactNode;
}

const Wrapper: FC<WrapperProps> = ({children}) => {
    return (
        <Fragment>
            <Mobile>
                <MobileWrapper>
                    {children}
                </MobileWrapper>
            </Mobile>
            <Desktop>
                <DesktopWrapper>
                    {children}
                </DesktopWrapper>
            </Desktop>
        </Fragment>
    )
}

const recentEnemies: SimpleUserProfile[] = [
    {id: 1, name: "Goodman", rate: 154, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 2, name: "Pushkin", rate: 2540, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 3, name: "Lermontov", rate: 2100, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
];

const allUsers: SimpleUserProfile[] = [
    {id: 1, name: "Goodman", rate: 154, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 2, name: "Pushkin", rate: 2540, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 3, name: "Lermontov", rate: 2100, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 4, name: "Gogol", rate: 1900, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 5, name: "Tolstoy", rate: 2800, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 6, name: "Dostoevsky", rate: 2700, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 7, name: "Chekhov", rate: 2400, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 8, name: "Bulgakov", rate: 2600, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 9, name: "Turgenev", rate: 2200, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 10, name: "Akhmatova", rate: 2300, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 11, name: "Yesenin", rate: 2150, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
    {id: 12, name: "Mayakovsky", rate: 2250, picture: "https://www.pngarts.com/files/5/User-Avatar-Download-Transparent-PNG-Image.png"},
];

const Page: FC = () => {
    // const [enemy, setEnemy] = useState<null|string>(null);
    const navigate = useNavigate();
    const {subjects} = useSubjectThemes();
    const [enemySearch, setEnemySearch] = useState<string>("")
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 3;

    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(enemySearch.toLowerCase())
    );

    return (
        <Wrapper>
            <ChooseEnemyContainer>
                <Search 
                    placeholder="Поиск соперника" 
                    onSearch={() => setCurrentPage(1)} 
                    onChange={e => {
                        setEnemySearch(e.target.value);
                        setCurrentPage(1);
                    }} 
                    value={enemySearch}
                />
            </ChooseEnemyContainer>
            
            {enemySearch === "" ? (
                <ChooseEnemyContainer>
                    <h2>Недавние соперники:</h2>
                    {recentEnemies.map((user) => (
                        <UserCard key={user.id} {...user} />
                    ))}
                </ChooseEnemyContainer>
            ) : (
                <ChooseEnemyContainer>
                    <h2>Результаты поиска:</h2>
                    {filteredUsers.length > 0 ? (
                        <Fragment>
                            {filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => (
                                <UserCard key={user.id} {...user} />
                            ))}
                            <Pagination
                                simple
                                current={currentPage}
                                total={filteredUsers.length}
                                pageSize={pageSize}
                                onChange={setCurrentPage}
                                style={{ marginTop: '10px' }}
                            />
                        </Fragment>
                    ) : (
                        <p>Пользователи не найдены</p>
                    )}
                </ChooseEnemyContainer>
            )}

            <Select style={{width: "200px", height: "min-content"}} placeholder="Выберите предмет" options={subjects.map(v => ({value: v.id, label: v.name}))}/>
            <PrimaryButton onClick={() => navigate("/pvp?id=123")}>Начать PVP!</PrimaryButton>
        </Wrapper>
    )
}

export default Page;