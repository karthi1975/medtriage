/**
 * Internal design-system preview.
 *
 * Visualizes every M3 token landed in this codebase so a designer/engineer
 * can inspect legacy vs m3 output side by side. Route: `/design-system`.
 */
import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useThemeMode } from '../theme/ThemeModeProvider';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box mb={5}>
    <Typography
      variant="labelLarge"
      sx={{
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

const Swatch: React.FC<{ name: string; value: string; fg?: string }> = ({ name, value, fg }) => (
  <Box
    sx={{
      minWidth: 200,
      p: 1.5,
      borderRadius: 1,
      bgcolor: value,
      color: fg ?? 'inherit',
      border: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Typography variant="labelLarge" sx={{ display: 'block', color: fg ?? 'inherit' }}>
      {name}
    </Typography>
    <Typography variant="bodySmall" sx={{ fontFamily: 'monospace', color: fg ?? 'inherit', opacity: 0.8 }}>
      {value}
    </Typography>
  </Box>
);

export const DesignSystemPreview: React.FC = () => {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const m3 = theme.palette.m3;
  const priority = theme.palette.priority;
  const chat = theme.palette.chat;
  const corner = theme.corner;
  const motion = theme.motion;

  const typeScale = [
    'displayLarge', 'displayMedium', 'displaySmall',
    'headlineLarge', 'headlineMedium', 'headlineSmall',
    'titleLarge', 'titleMedium', 'titleSmall',
    'bodyLarge', 'bodyMedium', 'bodySmall',
    'labelLarge', 'labelMedium', 'labelSmall',
  ] as const;

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="titleLarge" sx={{ flexGrow: 1 }}>
            Design System · {mode === 'm3' ? 'Material 3' : 'Legacy'}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`theme: ${mode}`}
              color={mode === 'm3' ? 'primary' : 'default'}
              size="small"
            />
            <Button
              onClick={() => setMode(mode === 'm3' ? 'legacy' : 'm3')}
              startIcon={<AutoFixHighIcon />}
              variant="outlined"
              size="small"
            >
              Switch to {mode === 'm3' ? 'Legacy' : 'M3'}
            </Button>
            <Tooltip title="No-op — preview page">
              <IconButton><LogoutIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="headlineSmall" gutterBottom>
          SynaptixScheduling design tokens
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" sx={{ mb: 4 }}>
          Visual reference for every color role, type step, shape, elevation, and motion token in
          the theme. Toggle the mode above to compare the legacy MUI theme against the Material 3
          theme. Legacy mode does not expose `m3` / `priority` / `chat` namespaces — those sections
          show fallback values and are informational.
        </Typography>

        <Section title="Brand primary / secondary / error / warning">
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Swatch name="primary" value={theme.palette.primary.main} fg={theme.palette.primary.contrastText} />
            <Swatch name="secondary" value={theme.palette.secondary.main} fg={theme.palette.secondary.contrastText} />
            <Swatch name="error" value={theme.palette.error.main} fg="#fff" />
            <Swatch name="warning" value={theme.palette.warning.main} fg="#202124" />
          </Stack>
        </Section>

        {m3 && (
          <Section title="Material 3 color roles">
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Swatch name="primary" value={m3.primary} fg={m3.onPrimary} />
              <Swatch name="primaryContainer" value={m3.primaryContainer} fg={m3.onPrimaryContainer} />
              <Swatch name="secondary" value={m3.secondary} fg={m3.onSecondary} />
              <Swatch name="secondaryContainer" value={m3.secondaryContainer} fg={m3.onSecondaryContainer} />
              <Swatch name="tertiary" value={m3.tertiary} fg={m3.onTertiary} />
              <Swatch name="tertiaryContainer" value={m3.tertiaryContainer} fg={m3.onTertiaryContainer} />
              <Swatch name="error" value={m3.error} fg={m3.onError} />
              <Swatch name="errorContainer" value={m3.errorContainer} fg={m3.onErrorContainer} />
              <Swatch name="warning" value={m3.warning} fg={m3.onWarning} />
              <Swatch name="warningContainer" value={m3.warningContainer} fg={m3.onWarningContainer} />
            </Stack>
          </Section>
        )}

        {m3 && (
          <Section title="Surfaces &amp; outlines">
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Swatch name="background" value={m3.background} />
              <Swatch name="surface" value={m3.surface} />
              <Swatch name="surfaceContainerLowest" value={m3.surfaceContainerLowest} />
              <Swatch name="surfaceContainerLow" value={m3.surfaceContainerLow} />
              <Swatch name="surfaceContainer" value={m3.surfaceContainer} />
              <Swatch name="surfaceContainerHigh" value={m3.surfaceContainerHigh} />
              <Swatch name="surfaceContainerHighest" value={m3.surfaceContainerHighest} />
              <Swatch name="outline" value={m3.outline} fg="#fff" />
              <Swatch name="outlineVariant" value="rgba(60,64,67,0.12)" />
            </Stack>
          </Section>
        )}

        {priority && (
          <Section title="Clinical priority ladder (overlay, not M3 role)">
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Swatch name="emergency" value={priority.emergency} fg={priority.onEmergency} />
              <Swatch name="urgent" value={priority.urgent} fg={priority.onUrgent} />
              <Swatch name="semiUrgent" value={priority.semiUrgent} fg={priority.onSemiUrgent} />
              <Swatch name="nonUrgent" value={priority.nonUrgent} fg={priority.onNonUrgent} />
            </Stack>
          </Section>
        )}

        {chat && (
          <Section title="Chat bubble surfaces">
            <Stack direction="row" spacing={1.5}>
              <Swatch name="assistant" value={chat.assistant} />
              <Swatch name="user" value={chat.user} />
            </Stack>
          </Section>
        )}

        <Section title="Typography scale">
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              {typeScale.map((v) => (
                <Box key={v} sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <Typography
                    variant="labelSmall"
                    sx={{ minWidth: 140, color: 'text.secondary', fontFamily: 'monospace' }}
                  >
                    {v}
                  </Typography>
                  <Typography variant={v}>The quick brown fox</Typography>
                </Box>
              ))}
              <Divider />
              <Typography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                Legacy variants below — still available on m3 theme for compatibility.
              </Typography>
              <Typography variant="h4">h4 — legacy heading 4</Typography>
              <Typography variant="h5">h5 — legacy heading 5</Typography>
              <Typography variant="h6">h6 — legacy heading 6</Typography>
              <Typography variant="subtitle1">subtitle1</Typography>
              <Typography variant="body1">body1 — quick brown fox</Typography>
              <Typography variant="body2">body2 — quick brown fox</Typography>
              <Typography variant="caption">caption</Typography>
            </Stack>
          </Paper>
        </Section>

        {corner && (
          <Section title="Shape scale (corner radii)">
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {Object.entries(corner).map(([name, px]) => (
                <Box
                  key={name}
                  sx={{
                    width: 120,
                    height: 80,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: `${Math.min(px, 40)}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                  }}
                >
                  <Typography variant="labelLarge">{name}</Typography>
                  <Typography variant="bodySmall" sx={{ opacity: 0.85 }}>{px}px</Typography>
                </Box>
              ))}
            </Stack>
          </Section>
        )}

        <Section title="Elevation (M3 tonal surfaces)">
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <Paper
                key={lvl}
                elevation={lvl}
                sx={{
                  width: 150,
                  height: 90,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="labelLarge">level {lvl}</Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  {mode === 'm3' ? 'tonal surface' : 'shadow'}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Section>

        <Section title="Buttons">
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button variant="contained" color="primary">Filled</Button>
            <Button variant="tonal">Filled tonal</Button>
            <Button variant="elevated">Elevated</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
            <Button variant="contained" color="error">Destructive</Button>
            <Button variant="contained" disabled>Disabled</Button>
          </Stack>
        </Section>

        <Section title="Chips">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Filter" onClick={() => {}} />
            <Chip label="Selected" color="primary" onClick={() => {}} />
            <Chip label="EMERGENCY" sx={{ bgcolor: priority?.emergency, color: priority?.onEmergency, fontWeight: 600 }} />
            <Chip label="URGENT" sx={{ bgcolor: priority?.urgent, color: priority?.onUrgent, fontWeight: 600 }} />
            <Chip label="SEMI-URGENT" sx={{ bgcolor: priority?.semiUrgent, color: priority?.onSemiUrgent, fontWeight: 600 }} />
            <Chip label="ROUTINE" sx={{ bgcolor: priority?.nonUrgent, color: priority?.onNonUrgent, fontWeight: 600 }} />
          </Stack>
        </Section>

        <Section title="Cards">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Card sx={{ width: 260, p: 2 }}>
              <Typography variant="titleMedium">Outlined card</Typography>
              <Typography variant="bodySmall" color="text.secondary">
                Default — 1px border, no shadow.
              </Typography>
            </Card>
            <Card sx={{ width: 260, p: 2, bgcolor: m3?.surfaceContainer, border: 'none' }}>
              <Typography variant="titleMedium">Filled tonal card</Typography>
              <Typography variant="bodySmall" color="text.secondary">
                surfaceContainer — for low-emphasis groupings.
              </Typography>
            </Card>
            <Card
              sx={{
                width: 260,
                p: 2,
                borderLeft: `4px solid ${priority?.emergency}`,
              }}
            >
              <Typography variant="titleMedium">Priority card</Typography>
              <Typography variant="bodySmall" color="text.secondary">
                4px left border — clinical priority overlay.
              </Typography>
            </Card>
          </Stack>
        </Section>

        <Section title="Inputs">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <TextField label="Patient name" defaultValue="Robert Williams" sx={{ minWidth: 240 }} />
            <TextField label="With helper" helperText="Required" sx={{ minWidth: 240 }} />
            <TextField label="Error" error helperText="Invalid MRN" sx={{ minWidth: 240 }} />
          </Stack>
        </Section>

        {motion && (
          <Section title="Motion tokens">
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="titleSmall" gutterBottom>Durations (ms)</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {Object.entries(motion.duration).map(([k, v]) => (
                  <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
                ))}
              </Stack>
              <Typography variant="titleSmall" gutterBottom>Easing</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {Object.entries(motion.easing).map(([k, v]) => (
                  <Chip key={k} label={k} size="small" variant="outlined" title={v} />
                ))}
              </Stack>
            </Paper>
          </Section>
        )}
      </Container>
    </Box>
  );
};

export default DesignSystemPreview;
