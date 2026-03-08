import styled from "@emotion/styled";
import {Button, Input} from "antd";
import type {BaseTask} from "../../api/serverResponses";

interface TaskProps extends BaseTask {
    value?: string;
    onChange?: (value: string) => void;
    onCheck?: () => void;
}

const TaskContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 20px;
    border: 3px solid #343434;
    background-color: #00000024;
    width: 100%;
    padding: 16px;
    gap: 10px;
    align-items: flex-start;
    box-sizing: border-box;
`;

const TaskHeader = styled.span`
    color: #83868e;
    font-size: 14px;
    margin-bottom: -8px;
`;

const ConditionText = styled.p`
    color: #ffffff;
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
    text-align: left;
    white-space: pre-line;
`;

const SubmitRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
  margin-top: 10px;
`;

const ActionsGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
`

const StatusText = styled.div`
    font-size: 14px;
    color: #ffffff;
    border-radius: 8px;
    padding: 1px 5px;
    background-color: ${(props) => props.color};
`

const Status = ({is_correct}: {is_correct: boolean | null}) => {
    const statusColor = is_correct === true ? "#00a115" : is_correct === false ? "#bd0000" : "#83868e";
    const statusText = is_correct === true ? "Решено" : is_correct === false ? "Решено неверно" : "Не решено";

    return (
        <StatusText color={statusColor}>{statusText}</StatusText>
    )
}

const Task = ({task_id, question, value, onChange, onCheck, is_correct}: TaskProps) => {
    return (
        <TaskContainer>
            <TopContainer>
                {task_id !== undefined && task_id !== null ? <TaskHeader>
                    №{task_id}:
                </TaskHeader> : <TaskHeader>ID скрыто</TaskHeader>}
                <Status is_correct={is_correct}/>
            </TopContainer>
            <ConditionText>
                {question}
            </ConditionText>
            <SubmitRow>
                <Input
                    style={{maxWidth: "400px", flex: "1 1 300px"}}
                    placeholder="Ответ"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    onPressEnter={onCheck}
                />
                <ActionsGroup>
                    <Button type="dashed" onClick={onCheck}>Проверить</Button>
                </ActionsGroup>
            </SubmitRow>
        </TaskContainer>
    );
}

export default Task;