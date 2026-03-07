import styled from "@emotion/styled";
import {Avatar} from "antd";
import {SimpleUserProfile} from "../../api/serverResponses.ts";
import {userIconPath} from "../../static.ts";

const CardWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #323A7F61;
    height: 60px;
    border: 1px solid #343434;
    border-radius: 15px;
    width: 240px;
    padding: 0 15px;
    cursor: pointer;
`

const UsernameContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
`

const RatingText = styled.p`
    font-size: 16px;
    color: #E0FF25;
    font-weight: bold;
`

const UserCard = ({name, rate}: SimpleUserProfile) => {
    return (
        <CardWrapper>
            <UsernameContainer>
                <Avatar src={userIconPath} size={30} />
                <div style={{display: "flex", flexDirection: "row"}}>
                    <p style={{color: "#E0FF25", fontWeight: "bold"}}>@</p>
                    <p style={{ fontWeight: "bold" }}>
                        {name}
                    </p>
                </div>
            </UsernameContainer>
            <RatingText>
                {rate}
            </RatingText>
        </CardWrapper>
    );
}

export default UserCard;