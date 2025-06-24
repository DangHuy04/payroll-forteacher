import React, { useEffect, useState } from 'react';
import { Dialog, DialogProps } from '@mui/material';

interface SafeDialogProps extends DialogProps {
  children: React.ReactNode;
}

const SafeDialog: React.FC<SafeDialogProps> = ({ children, open, ...props }) => {
  const [isClient, setIsClient] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);

  useEffect(() => {
    // Check if we're on client side
    setIsClient(true);
    
    // Check if document is ready
    const checkDocument = () => {
      if (typeof window !== 'undefined' && 
          window.document && 
          window.document.documentElement) {
        setDocumentReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkDocument, 10);
      }
    };
    
    checkDocument();
  }, []);

  // Only render Dialog when we're on client and document is ready
  if (!isClient || !documentReady || !open) {
    return null;
  }

  try {
    return (
      <Dialog
        {...props}
        open={open}
        disablePortal={true}
        // Additional safety props
        disableScrollLock={true}
        disableEscapeKeyDown={false}
        keepMounted={false}
      >
        {children}
      </Dialog>
    );
  } catch (error) {
    console.error('Dialog render error:', error);
    return null;
  }
};

export default SafeDialog; 