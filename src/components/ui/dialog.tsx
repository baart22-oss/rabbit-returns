import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'some-dialog-library';

const MyDialog = () => {
    return (
        <Dialog>
            <DialogHeader>
                <DialogTitle>My Dialog Title</DialogTitle>
            </DialogHeader>
            <DialogContent>
                {/* Your content goes here */}
            </DialogContent>
        </Dialog>
    );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle };