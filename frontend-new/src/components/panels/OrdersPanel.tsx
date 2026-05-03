/**
 * OrdersPanel — EPIC-style order requirements surface.
 *
 * Reads `metadata.testingStatus.formatted_message`, parses it into structured
 * test rows, renders each with a color-coded left edge, urgent flag, and a
 * compact checkbox. Local completion state is in-memory only (matches the
 * existing DetailsPanel behavior — orders are informational, not blocking).
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { PanelShell } from './PanelShell';
import { parseTestRequirements, getOrderColor, type TestRequirement } from '../../utils/clinicalParsers';
import type { ChatMessage } from '../../types';

type TestingStatus = NonNullable<ChatMessage['metadata']>['testingStatus'];

interface OrdersPanelProps {
  testingStatus: TestingStatus | undefined;
  height?: number | string;
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ testingStatus, height }) => {
  const theme = useTheme();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [tests, setTests] = useState<TestRequirement[]>([]);

  useEffect(() => {
    if (testingStatus?.formatted_message) {
      setTests(parseTestRequirements(testingStatus.formatted_message));
      setCompleted(new Set()); // reset on new requirements
    } else {
      setTests([]);
    }
  }, [testingStatus?.formatted_message]);

  const total = tests.length;
  const done = tests.filter((t) => completed.has(t.name)).length;
  const urgent = tests.filter((t) => t.urgent).length;

  const toggle = (name: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const subtitle = total > 0 ? `· ${done}/${total} done` : undefined;

  // Empty state
  if (!testingStatus || total === 0) {
    return (
      <PanelShell
        title="Order Requirements"
        height={height}
        actions={
          <Tooltip title="Refresh from chat">
            <span>
              <IconButton size="small" disabled sx={{ p: 0.25 }}>
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center',
            py: 2,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>No order requirements</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5, maxWidth: 240 }}>
            {testingStatus?.formatted_message
              ? testingStatus.formatted_message.slice(0, 140)
              : 'Triage will surface required tests here when applicable.'}
          </Typography>
        </Box>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Order Requirements"
      severityColor={
        urgent > 0 ? theme.palette.priority?.urgent ?? theme.palette.warning.main : undefined
      }
      subtitle={subtitle}
    >
      <Stack spacing={0.5}>
        {tests.map((test) => {
          const c = getOrderColor(test.name);
          const isDone = completed.has(test.name);
          return (
            <Box
              key={test.name}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.75,
                px: 0.75,
                py: 0.6,
                borderLeft: '3px solid',
                borderLeftColor: c,
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: isDone ? `${c}10` : 'background.paper',
                borderRadius: '4px',
                transition: 'background 0.15s',
              }}
            >
              <Checkbox
                size="small"
                checked={isDone}
                onChange={() => toggle(test.name)}
                sx={{
                  p: 0.25,
                  color: c,
                  '&.Mui-checked': { color: c },
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: c,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                    noWrap
                  >
                    {test.name}
                  </Typography>
                  {test.urgent && (
                    <Box
                      sx={{
                        px: 0.6,
                        py: 0.05,
                        bgcolor: c,
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        borderRadius: '3px',
                      }}
                    >
                      URGENT
                    </Box>
                  )}
                </Stack>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    color: 'text.secondary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {test.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </PanelShell>
  );
};

export default OrdersPanel;
