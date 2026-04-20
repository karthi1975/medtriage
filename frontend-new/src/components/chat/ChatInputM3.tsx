/**
 * M3 chat composer — opt-in variant used when themeMode === 'm3'.
 *
 * Pill-rounded outlined text field on a surfaceContainerLow tray with a
 * 1px top divider. Trailing Send IconButton flips to a filled primary
 * circle when the input has content.
 */
import React, { useState } from 'react';
import { Box, TextField, IconButton, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../../context/ChatContext';

export const ChatInputM3: React.FC = () => {
  const { sendMessage, isLoading } = useChat();
  const [input, setInput] = useState('');
  const theme = useTheme();

  const canSend = !!input.trim() && !isLoading;

  const handleSend = () => {
    if (!canSend) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.m3?.surface ?? 'background.paper',
        boxShadow: '0 -4px 16px rgba(60,64,67,0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          placeholder="Type patient info, symptoms, or scheduling requests…   (Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: `${theme.corner.extraLarge}px`,
              backgroundColor: theme.palette.m3?.surface ?? 'background.paper',
              paddingX: 2,
              paddingY: 1,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          sx={{
            width: 48,
            height: 48,
            bgcolor: canSend ? 'primary.main' : theme.palette.m3?.surfaceContainer,
            color: canSend
              ? 'primary.contrastText'
              : theme.palette.text.disabled,
            '&:hover': {
              bgcolor: canSend ? 'primary.dark' : theme.palette.m3?.surfaceContainerHigh,
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.m3?.surfaceContainer,
              color: theme.palette.text.disabled,
            },
            transition: `background-color ${theme.motion.duration.short4}ms ${theme.motion.easing.standard}`,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
