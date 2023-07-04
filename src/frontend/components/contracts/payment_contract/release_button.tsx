import * as React from "react";
import {Button, DialogActions, DialogContent, DialogTitle, Paper} from "@mui/material";
import DialogOver from "../../genral/daiolog_over";


function ReleaseButton({released, onClick}: { released: boolean, onClick: () => void }) {
    const [is_released, setReleased] = React.useState(released);

    const handleConfirm = () => {
        setReleased(true)
        onClick();
    };

    let Dialog = (props: any) => {
        return <Paper>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogContent>
                Are you sure you want to release?
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleCancel} color="primary">
                    No
                </Button>
                <Button onClick={() => {
                    handleConfirm()
                    props.handleClick()
                }} color="primary" autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Paper>
    }


    return (
        <DialogOver
            color={"success"}
            disabled={is_released}
            variant="text"
            DialogContent={Dialog}>
            {released ? 'Released' : 'Release'}
        </DialogOver>
    );
}

export default ReleaseButton