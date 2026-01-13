/**
 * Chat Input Component
 * Text field for MA to send messages
 */
import React, { useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../../context/ChatContext';

export const ChatInput: React.FC = () => {
  const { sendMessage, isLoading } = useChat();
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      sendMessage(trimmed);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box p={2} borderTop="1px solid" borderColor="divider" bgcolor="background.paper">
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type patient info, symptoms, or scheduling requests... (Shift+Enter for new line)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};
