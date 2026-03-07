import {type FC, useState} from "react";
import {Input, Pagination, Select} from "antd";
import {SearchOutlined} from "@ant-design/icons"
import Task from "../public/task.tsx";
import styled from "@emotion/styled";
import TasksContainer from "../public/taskContainer.tsx";
import {useSubjectThemes} from "../../hooks/subjectThemes/hook.ts";
import StyledTitle from "../components/textComponents/StyledTitle.tsx";

const difficultyOptions = [
    { label: 'Лёгкая', value: 'easy' },
    { label: 'Средняя', value: 'middle' },
    { label: 'Сложная', value: 'high' }
];

const PageShell = styled.div`
    width: 100%;
    max-width: 1280px;
`

const TopRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    gap: 20px;
    overflow: auto;
    padding: 5px 5px 8px 5px;
`;

const SortContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
`;

type BaseTask = {
    task_id: number;
    question: string;
    is_correct: boolean | null;
}

const tasks: BaseTask[] = [
    { task_id: 1, question: "2 + 2", is_correct: null },
    { task_id: 2, question: "5 * 3", is_correct: null },
    { task_id: 3, question: "10 - 4", is_correct: null },
    { task_id: 4, question: "12 / 4", is_correct: null },
    { task_id: 5, question: "7 + 8", is_correct: null },
    { task_id: 6, question: "9 * 6", is_correct: null },
    { task_id: 7, question: "15 - 7", is_correct: null },
    { task_id: 8, question: "20 / 5", is_correct: null },
    { task_id: 9, question: "3 + 4", is_correct: null },
    { task_id: 10, question: "8 * 2", is_correct: null },
    { task_id: 11, question: "14 - 5", is_correct: null },
    { task_id: 12, question: "18 / 3", is_correct: null },
    { task_id: 13, question: "6 + 7", is_correct: null },
    { task_id: 14, question: "4 * 5", is_correct: null },
    { task_id: 15, question: "11 - 3", is_correct: null },
    { task_id: 16, question: "16 / 4", is_correct: null },
    { task_id: 17, question: "9 + 2", is_correct: null },
    { task_id: 18, question: "7 * 3", is_correct: null },
    { task_id: 19, question: "13 - 6", is_correct: null },
    { task_id: 20, question: "24 / 6", is_correct: null },
    { task_id: 21, question: "5 + 9", is_correct: null },
    { task_id: 22, question: "6 * 4", is_correct: null },
    { task_id: 23, question: "17 - 8", is_correct: null },
    { task_id: 24, question: "30 / 5", is_correct: null },
    { task_id: 25, question: "8 + 3", is_correct: null },
    { task_id: 26, question: "10 * 2", is_correct: null },
]

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [id]: value
        }));
    };

    return (
        <PageShell>
            <StyledTitle>Банк задач</StyledTitle>
            <TopRow>
                <SortContainer>
                    <Select
                        allowClear
                        defaultValue={subjects[0]?.id}
                        style={{ width: 200 }}
                        options={subjects.map((it) => ({ label: it.name, value: it.id }))}
                        placeholder="Выберите предмет"
                    />
                    <Select
                        allowClear
                        defaultValue={difficultyOptions[0].value}
                        style={{ width: 200 }}
                        options={difficultyOptions}
                        placeholder="Выберите сложность"
                    />
                </SortContainer>
                <Input placeholder="Поиск по номеру" suffix={<SearchOutlined />} style={{minWidth: 200, marginLeft: "auto", maxWidth: 200}}/>
            </TopRow>
            <TasksContainer>
                {tasks.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((task) => {
                    const taskId = task.task_id.toString();
                    return (
                        <Task
                            key={taskId}
                            {...task}
                            value={answers[taskId] || ""}
                            onChange={(val) => handleAnswerChange(taskId, val)}
                        />
                    );
                })}
            </TasksContainer>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                <Pagination
                    current={currentPage}
                    total={tasks.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                />
            </div>
        </PageShell>
    );
}

export default  Page;