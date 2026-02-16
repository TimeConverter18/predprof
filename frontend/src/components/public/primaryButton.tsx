import { Button, type ButtonProps } from "antd";

const PrimaryButton = ({ children, style, ...props }: ButtonProps) => {
    return (
        <Button
            type="primary"
            style={{ color: "black", fontWeight: "bold", ...style }}
            {...props}
        >
            {children}
        </Button>
    );
};

export default PrimaryButton;