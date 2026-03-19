import React, {useEffect, useState} from 'react';
import styled from "@emotion/styled";
import {Tabs, Avatar, Space, Drawer} from 'antd';
import {
    HomeOutlined,
    BookOutlined,
    TeamOutlined,
    LogoutOutlined,
    BarsOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Link } from "react-router";
import {Desktop, Mobile} from "../responsiveWrappers";
import {useAuth} from "../../hooks/auth/hook";
import PrimaryButton from "../public/primaryButton";
import {userIconPath} from "../../static";
import api from "../../api/api";

const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background-color: #000316;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-sizing: border-box;
    
    .ant-tabs {
        width: 100%;
    }

    .ant-tabs-nav {
        margin-bottom: 0 !important;
        height: 70px;
        &::before {
            border-bottom: none !important;
        }
    }

    .ant-tabs-nav-list {
        width: 100%;
    }

    .ant-tabs-tab {
        padding: 20px 0 !important;
        margin: 0 40px 0 0 !important;
        transition: all 0.3s;
    }
    
    .ant-tabs-tab[data-node-key="profile"] {
        margin-left: auto !important;
        margin-right: 20px !important;
    }

    .ant-tabs-tab-btn {
        color: #ffffff !important;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .ant-tabs-tab-active .ant-tabs-tab-btn {
        color: #E0FF25 !important;
    }

    .ant-tabs-ink-bar {
        background: #E0FF25 !important;
        height: 3px !important;
    }
`;

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState<boolean>(false)
    const { user, reload } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout/");
        } catch {
            //
        }
        await reload();
        navigate("/signin");
    };

    const activeKey = location.pathname === "/" || location.pathname.startsWith("/main")
        ? "main"
        : (location.pathname.startsWith("/pvp") || location.pathname.startsWith("/single")
            ? "training"
            : (location.pathname.split('/')[1] || 'main'));

    useEffect(() => {
        if (location.pathname === "/") {
            navigate("/main", { replace: true })
        }
    }, [location.pathname, navigate]);

    const items = [
        {
            key: 'main',
            label: (<span><HomeOutlined /> Главная</span>),
        },
        {
            key: 'bank',
            label: (<span><BookOutlined /> Сборник задач</span>),
        },
        {
            key: 'training',
            label: (<span><TeamOutlined /> Тренировки</span>),
        },
        ...(user ? [{
            key: 'profile',
            label: (
                <Avatar
                    src={userIconPath}
                    style={{
                        cursor: 'pointer'
                    }}
                />
            ),
        }] : [])
    ];

    const onTabChange = (key: string) => {
        if (key === 'profile') {
            navigate('/profile');
        } else {
            navigate(`/${key}`);
        }
    };

    return (
        <HeaderWrapper>
            <Desktop>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Tabs
                        activeKey={activeKey}
                        onTabClick={onTabChange}
                        items={items}
                    />
                    {user ? (
                        <LogoutOutlined
                            onClick={handleLogout}
                            style={{
                                color: '#E0FF25',
                                fontSize: '24px',
                                cursor: 'pointer',
                                marginLeft: '10px'
                            }}
                        />
                    ) : (
                        <Space style={{ marginLeft: '20px' }}>
                            <PrimaryButton onClick={() => navigate('/signin')}>Войти</PrimaryButton>
                            <PrimaryButton onClick={() => navigate('/signup')}>Регистрация</PrimaryButton>
                        </Space>
                    )}
                </div>
            </Desktop>

            <Mobile>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '70px', alignItems: 'center' }}>
                    <BarsOutlined
                        style={{ color: '#E0FF25', fontSize: '26px' }}
                        onClick={() => setOpen(true)}
                    />
                    <Space size={user ? 30 : 10}>
                        {user ? (
                            <>
                                <Avatar
                                    src={userIconPath}
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate('/profile')}
                                />
                                <LogoutOutlined onClick={handleLogout} style={{ color: '#E0FF25', fontSize: '24px', cursor: 'pointer' }} />
                            </>
                        ) : (
                            <>
                                <PrimaryButton size="small" onClick={() => navigate('/signin')}>Войти</PrimaryButton>
                                <PrimaryButton size="small" onClick={() => navigate('/signup')}>Регистрация</PrimaryButton>
                            </>
                        )}
                    </Space>
                </div>
                <Drawer title="Навигация" open={open} placement="left" defaultSize={250} onClose={() => setOpen(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Link to="/main" onClick={() => setOpen(false)}>Главная</Link>
                        <Link to="/bank" onClick={() => setOpen(false)}>Сборник задач</Link>
                        <Link to="/training" onClick={() => setOpen(false)}>Тренировки</Link>
                    </div>
                </Drawer>
            </Mobile>
        </HeaderWrapper>
    );
};

export default Header;