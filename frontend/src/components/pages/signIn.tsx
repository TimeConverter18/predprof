import type {FC} from "react";
import {Form, Input, Typography} from "antd";
import styled from "@emotion/styled";
import PrimaryButton from "../public/primaryButton";
import {Link} from "react-router";

const FormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
'`;

const { Title } = Typography;

type FieldType = {
    mail: string;
    password: string;
};

const onFinishFailed = () => {}

const onFinish = () => {

}

const Page: FC = () => {
    return (
        <FormWrapper>
            <Title level={2}>ВХОД</Title>
            <Form
                layout="vertical"
                name="signin"
                labelCol={{span: 8}}
                style={{maxWidth: "90%", width: "450px", alignSelf: "center", justifyContent: "space-between"}}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    label="Почта"
                    name="mail"
                    rules={[{required: true, message: 'Введите свою почту!'}, {type: "email", message: "Некоректная почта!"}]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item<FieldType>
                    label="Пароль"
                    name="password"
                    rules={[{required: true, message: 'Введите свой пароль!'}, {min: 8, message: "Пароль слишком короткий!"}]}
                >
                    <Input.Password/>
                </Form.Item>
                <Form.Item style={{marginTop: "40px"}}>
                    <PrimaryButton htmlType="submit" size="large" style={{ width: "100%"}}>
                        Войти
                    </PrimaryButton>
                    <div style={{marginTop: "10px"}}>
                        <Link to="/signup" style={{color: "white"}}>У меня нет аккаунта</Link>
                    </div>
                </Form.Item>
            </Form>
        </FormWrapper>
    );
}

export default Page;