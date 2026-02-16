import {type FC, Fragment, useState} from "react"
import styled from "@emotion/styled";
import {Form, InputNumber, Select, Space} from "antd";
import PrimaryButton from "../../public/primaryButton.tsx";
import {useSubjectThemes} from "../../../hooks/subjectThemes/hook.ts";
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";

const ChooseContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 10px;
    overflow: auto;
    margin-top: 20px;
    padding: 5px;
`;

const Page: FC = () => {
    const {subjects} = useSubjectThemes();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const screens = useBreakpoint();

    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    const availableThemes = currentSubject ? currentSubject.themes : subjects.flatMap(s => s.themes);

    return (
        <Fragment>
            <ChooseContainer>
                <Form
                    layout={screens.xl?"inline":"horizontal"}
                    name="single-training"
                >
                    <Form.Item>
                        <Select style={{width: "200px"}} placeholder="Выберите сложность"
                                options={[
                                    { value: 'easy', label: 'Лёгкая' },
                                    { value: 'middle', label: 'Средняя' },
                                    { value: 'high', label: 'Сложная' }
                                ]}/>
                    </Form.Item>
                    <Form.Item>
                        <Select style={{width: "200px"}} placeholder="Выберите предмет"
                                options={subjects.map(v => ({value: v.id, label: v.name}))}
                                onChange={value => setSelectedSubjectId(value)}/>
                    </Form.Item>
                    <Form.Item>
                        <Select style={{width: "200px"}} placeholder="Выберите тему" options={
                            availableThemes.map(v => ({value: v.id, label: v.name}))
                        }/>
                    </Form.Item>
                    <Form.Item>
                        <Space.Compact>
                            <Space.Addon>Количество задач:</Space.Addon>
                            <InputNumber style={{width: "60px", minWidth: "60px"}} type="number" defaultValue={5}
                                         min={1} max={15}/>
                        </Space.Compact>
                    </Form.Item>
                    <Form.Item>
                        <PrimaryButton htmlType="submit">Начать тренировку!</PrimaryButton>
                    </Form.Item>
                </Form>
            </ChooseContainer>
        </Fragment>
    )
}

export default Page;
