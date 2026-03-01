import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../Button';
import './Dialog.css'; // Optional CSS import

export const DialogComponent = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Title</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            This is a dialog description.
          </Dialog.Description>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DialogComponent;
