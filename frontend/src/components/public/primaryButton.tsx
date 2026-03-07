import {Button, type ButtonProps} from "antd";

const PrimaryButton = ({children, style, disabled, ...props}: ButtonProps) => {
    const baseStyle = {fontWeight: "bold", color: "#000", background: "#bad609", borderColor: "#bad609"};
    const disabledStyle = disabled ? {color: "#000", background: "#dbe76c", borderColor: "#dbe76c"} : {};

    return (
        <Button
            type="primary"
            style={{...baseStyle, ...disabledStyle, ...style}}
            disabled={disabled}
            {...props}
        >
            {children}
        </Button>
    );
};

export default PrimaryButton;