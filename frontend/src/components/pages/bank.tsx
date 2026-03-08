import {type FC, useEffect, useState} from "react";
import {Input, Pagination, Select} from "antd";
import {SearchOutlined} from "@ant-design/icons"
import Task from "../public/task";
import styled from "@emotion/styled";
import TasksContainer from "../public/taskContainer";
import {useSubjectThemes} from "../../hooks/subjectThemes/hook";
import StyledTitle from "../components/textComponents/StyledTitle";
import api from "../../api/api";

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

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [tasks, setTasks] = useState<BaseTask[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
    const pageSize = 20;

    const fetchTasks = (page: number, subjectId?: number, difficulty?: string) => {
        const params: Record<string, string | number> = { page, page_size: pageSize };
        if (subjectId) params.subject_id = subjectId;
        if (difficulty) params.difficulty = difficulty;

        api.get("/tasks/", { params }).then((res) => {
            if (res && res.status === 200 && res.data) {
                setTasks(
                    (res.data.items || []).map((item: { task_id: number; question: string; is_correct?: boolean | null }) => ({
                        task_id: item.task_id,
                        question: item.question,
                        is_correct: item.is_correct ?? null,
                    }))
                );
                setTotalCount(res.data.items_count || 0);
            }
        });
    };

    useEffect(() => {
        fetchTasks(currentPage, selectedSubject, selectedDifficulty);
    }, [currentPage, selectedSubject, selectedDifficulty]);

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
                        value={selectedSubject}
                        onChange={(val) => { setSelectedSubject(val); setCurrentPage(1); }}
                        style={{ width: 200 }}
                        options={subjects.map((it) => ({ label: it.name, value: it.id }))}
                        placeholder="Выберите предмет"
                    />
                    <Select
                        allowClear
                        value={selectedDifficulty}
                        onChange={(val) => { setSelectedDifficulty(val); setCurrentPage(1); }}
                        style={{ width: 200 }}
                        options={difficultyOptions}
                        placeholder="Выберите сложность"
                    />
                </SortContainer>
                <Input placeholder="Поиск по номеру" suffix={<SearchOutlined />} style={{minWidth: 200, marginLeft: "auto", maxWidth: 200}}/>
            </TopRow>
            <TasksContainer>
                {tasks.map((task) => {
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
                    total={totalCount}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                />
            </div>
        </PageShell>
    );
}

export default  Page;