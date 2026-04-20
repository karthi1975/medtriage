/**
 * Internal design-system preview.
 *
 * Visualizes every M3 token landed in this codebase so a designer/engineer
 * can inspect legacy vs m3 output side by side. Route: `/design-system`.
 */
import React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  PrioritySurface,
  OutlinedCard,
  FilledTonalCard,
  ElevatedCard,
  AssistChip,
  FilterChip,
  InputChip,
  SuggestionChip,
  PriorityChip,
  TopAppBarSmall,
  TopAppBarMedium,
  SideSheet,
} from '../components/md3';
import { useBreakpoint } from '../hooks/useBreakpoint';

const FilterDemo: React.FC = () => {
  const [selected, setSelected] = React.useState<string[]>(['today']);
  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const items: Array<{ key: string; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This week' },
    { key: 'urgent', label: 'Urgent only' },
    { key: 'mine', label: 'My patients' },
  ];
  return (
    <>
      {items.map(({ key, label }) => (
        <FilterChip
          key={key}
          label={label}
          selected={selected.includes(key)}
          onClick={() => toggle(key)}
        />
      ))}
    </>
  );
};

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
  const bp = useBreakpoint();
  const [sheetOpen, setSheetOpen] = React.useState(true);
  const [filterSelected, setFilterSelected] = React.useState<string[]>(['today']);
  const toggleFilter = (key: string) =>
    setFilterSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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

        <Divider sx={{ my: 4 }} />
        <Typography variant="headlineSmall" gutterBottom>
          Primitives (md3 library)
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" sx={{ mb: 4 }}>
          Phase 2 components under <code>src/components/md3/</code>. These are
          theme-aware and intended for reuse across every clinical surface.
          Phase 4 will swap production flows over to these primitives.
        </Typography>

        <Section title="PrioritySurface — the clinical priority pattern">
          <Stack spacing={2}>
            {(['emergency', 'urgent', 'semiUrgent', 'nonUrgent'] as const).map((lvl) => (
              <PrioritySurface key={lvl} priority={lvl} interactive>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Box>
                      <Typography variant="titleMedium">Robert Williams · 73M</Typography>
                      <Typography variant="bodySmall" color="text.secondary">
                        Chest pain · SOB · Hx CHF
                      </Typography>
                    </Box>
                    <PriorityChip level={lvl} label={lvl === 'semiUrgent' ? 'Semi-urgent' : lvl === 'nonUrgent' ? 'Routine' : lvl} />
                  </Stack>
                </CardContent>
              </PrioritySurface>
            ))}
          </Stack>
        </Section>

        <Section title="Card variants — Outlined · Filled tonal · Elevated">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <OutlinedCard sx={{ width: 260 }}>
              <CardContent>
                <Typography variant="titleMedium">Outlined</Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  Default. 1px outline, no shadow. Most clinical surfaces.
                </Typography>
              </CardContent>
            </OutlinedCard>
            <FilledTonalCard sx={{ width: 260 }}>
              <CardContent>
                <Typography variant="titleMedium">Filled tonal</Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  surfaceContainer. Low-emphasis groupings, side notes.
                </Typography>
              </CardContent>
            </FilledTonalCard>
            <ElevatedCard interactive sx={{ width: 260 }}>
              <CardContent>
                <Typography variant="titleMedium">Elevated · interactive</Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  Hover to lift. Reserve for protocol activation and best-match slots.
                </Typography>
              </CardContent>
            </ElevatedCard>
          </Stack>
        </Section>

        <Section title="Chip family — Assist · Filter · Input · Suggestion">
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="labelLarge" sx={{ minWidth: 120, color: 'text.secondary' }}>Assist</Typography>
              <AssistChip icon={<PersonIcon />} label="Add patient" onClick={() => {}} />
              <AssistChip icon={<EventIcon />} label="Request slot" onClick={() => {}} />
              <AssistChip icon={<SendIcon />} label="Send SMS" onClick={() => {}} />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="labelLarge" sx={{ minWidth: 120, color: 'text.secondary' }}>Filter</Typography>
              <FilterDemo />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="labelLarge" sx={{ minWidth: 120, color: 'text.secondary' }}>Input</Typography>
              <InputChip
                label="Dr. Smith"
                avatar={<Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>DS</Avatar>}
                onDelete={() => {}}
              />
              <InputChip label="Cardiology" onDelete={() => {}} />
              <InputChip label="2026-04-22" onDelete={() => {}} />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="labelLarge" sx={{ minWidth: 120, color: 'text.secondary' }}>Suggestion</Typography>
              <SuggestionChip label="Book next available" onClick={() => {}} />
              <SuggestionChip label="Send to pulmonology" onClick={() => {}} />
              <SuggestionChip label="Order CBC" onClick={() => {}} />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="labelLarge" sx={{ minWidth: 120, color: 'text.secondary' }}>Priority</Typography>
              <PriorityChip level="emergency" label="Emergency" />
              <PriorityChip level="urgent" label="Urgent" />
              <PriorityChip level="semiUrgent" label="Semi-urgent" />
              <PriorityChip level="nonUrgent" label="Routine" />
            </Stack>
          </Stack>
        </Section>

        <Section title="Buttons — tonal &amp; elevated (new variants)">
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<SendIcon />}>Filled primary</Button>
            <Button variant="tonal" startIcon={<EventIcon />}>Filled tonal</Button>
            <Button variant="elevated">Elevated</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
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

        <Divider sx={{ my: 4 }} />
        <Typography variant="headlineSmall" gutterBottom>
          Navigation &amp; structure (Phase 3)
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary" sx={{ mb: 4 }}>
          Shell primitives: M3 Small + Medium top app bars, responsive SideSheet,
          and the <code>useBreakpoint</code> hook for M3 window-size classes.
          Resize the browser to watch the SideSheet flip between docked and
          modal, and watch the window-class pill update.
        </Typography>

        <Section title="Current window class (live)">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`windowClass: ${bp.windowClass}`}
              color="primary"
              sx={{ fontFamily: 'monospace' }}
            />
            {bp.isMobileLayout && (
              <Chip label="isMobileLayout" size="small" color="warning" />
            )}
            <Typography variant="bodySmall" color="text.secondary">
              Compact &lt; 600 · Medium 600–839 · Expanded 840–1199 · Large 1200–1599 · ExtraLarge ≥ 1600
            </Typography>
          </Stack>
        </Section>

        <Section title="TopAppBarSmall — 64dp, task-focused surfaces">
          <Paper
            variant="outlined"
            sx={{ overflow: 'hidden', borderRadius: 2, p: 0 }}
          >
            <TopAppBarSmall
              leading={
                <Box
                  component="img"
                  src="/synaptix-mark.svg"
                  alt=""
                  sx={{ width: 32, height: 32, borderRadius: 1 }}
                />
              }
              title={
                <Typography variant="titleLarge" sx={{ letterSpacing: 0.5 }}>
                  <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>Synaptix</Box>
                  <Box component="span" sx={{ fontWeight: 400 }}>Scheduling</Box>
                </Typography>
              }
              trailing={
                <>
                  <IconButton size="small"><SearchIcon /></IconButton>
                  <IconButton size="small"><LogoutIcon /></IconButton>
                </>
              }
            />
            <Box sx={{ p: 3, bgcolor: theme.palette.background.default }}>
              <Typography variant="bodyMedium" color="text.secondary">
                Main content area. The app bar above is 64dp with a 1px bottom border.
              </Typography>
            </Box>
          </Paper>
        </Section>

        <Section title="TopAppBarMedium — 112dp+, landing pages with docked filters">
          <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, p: 0 }}>
            <TopAppBarMedium
              leading={<IconButton size="small"><MenuIcon /></IconButton>}
              trailing={
                <>
                  <IconButton size="small"><SearchIcon /></IconButton>
                  <IconButton size="small"><FilterListIcon /></IconButton>
                  <Button variant="tonal" size="small" startIcon={<AddIcon />}>New</Button>
                </>
              }
              title="Appointments"
              supportingText="Sarah Johnson · West Valley City CHC · Today, April 20"
              dockedBelow={
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <FilterChip
                    label="Today"
                    selected={filterSelected.includes('today')}
                    onClick={() => toggleFilter('today')}
                  />
                  <FilterChip
                    label="This week"
                    selected={filterSelected.includes('week')}
                    onClick={() => toggleFilter('week')}
                  />
                  <FilterChip
                    label="Urgent only"
                    selected={filterSelected.includes('urgent')}
                    onClick={() => toggleFilter('urgent')}
                  />
                  <FilterChip
                    label="My patients"
                    selected={filterSelected.includes('mine')}
                    onClick={() => toggleFilter('mine')}
                  />
                </Stack>
              }
            />
            <Box sx={{ p: 3, bgcolor: theme.palette.background.default }}>
              <Typography variant="bodyMedium" color="text.secondary">
                List content area. Filter chips above are part of the app bar surface,
                separated by a 1px top divider.
              </Typography>
            </Box>
          </Paper>
        </Section>

        <Section title="SideSheet — responsive panel (docked ≥840px, modal below)">
          <Paper
            variant="outlined"
            sx={{
              overflow: 'hidden',
              borderRadius: 2,
              height: 340,
              display: 'flex',
            }}
          >
            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="titleMedium">Main content</Typography>
              <Typography variant="bodyMedium" color="text.secondary">
                The side sheet behavior depends on the current window class. On Expanded+ widths
                the panel is inline-docked; on Medium and Compact it flips to a modal drawer so
                the main area keeps its full width.
              </Typography>
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="tonal"
                  onClick={() => setSheetOpen((v) => !v)}
                >
                  {sheetOpen ? 'Close panel' : 'Open panel'}
                </Button>
              </Box>
            </Box>
            <SideSheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              title="Patient details"
              width={320}
            >
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="labelSmall" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Patient
                  </Typography>
                  <Typography variant="titleMedium">Robert Williams · 73M</Typography>
                </Box>
                <Box>
                  <Typography variant="labelSmall" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Chief complaint
                  </Typography>
                  <Typography variant="bodyMedium">Chest pain · SOB · Hx CHF</Typography>
                </Box>
                <Divider />
                <PriorityChip level="emergency" label="Emergency" />
              </Stack>
            </SideSheet>
          </Paper>
        </Section>
      </Container>
    </Box>
  );
};

export default DesignSystemPreview;
