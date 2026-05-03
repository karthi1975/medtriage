/**
 * SlotRecommendations — clinical slot picker for a triaged patient.
 *
 * Layout pattern: a single rich "best match" card up top, then any
 * remaining slots as compact stacked rows the MA can scan and book in
 * one tap. Each compact row toggles inline detail on click so the MA
 * can verify provider/location/reasoning before committing.
 *
 * Used by both the legacy and m3 paths via DetailsPanel +
 * AppointmentSchedulingPanel — props are unchanged.
 *
 * Color logic:
 *   - Match-score ladder: ≥90 primary, ≥80 success, <80 priority.urgent.
 *   - Priority left-border encodes the ACTIVE TRIAGE urgency, not the
 *     slot's own match score.
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Star as StarIcon,
  Lightbulb as LightbulbIcon,
  ExpandMoreRounded as ExpandIcon,
} from '@mui/icons-material';

interface Provider {
  provider_id: number;
  npi: string;
  name: string;
  credentials: string;
  specialty: string;
  years_experience: number;
  languages?: string[];
}

interface Facility {
  facility_id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  phone?: string;
}

interface Slot {
  provider: Provider;
  facility: Facility;
  slot_datetime: string;
  duration_minutes: number;
  reasoning: string;
  match_score: number;
  distance_miles?: number;
}

type UrgencyLevel = 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';

interface SlotRecommendationsProps {
  slots: Slot[];
  onBookSlot: (slot: Slot) => void;
  /** Optional clinical urgency from the active triage — drives priority left-border color. */
  urgency?: UrgencyLevel | string;
}

function formatDateTime(datetimeStr: string) {
  const date = new Date(datetimeStr);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { dateStr, timeStr };
}

function rankBadge(index: number) {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return `#${index + 1}`;
  }
}

export const SlotRecommendations: React.FC<SlotRecommendationsProps> = ({
  slots,
  onBookSlot,
  urgency,
}) => {
  const theme = useTheme();
  const reasoningBg = theme.palette.m3?.surfaceContainerLowest ?? theme.palette.action.hover;
  const tipBg = theme.palette.m3?.primaryContainer ?? theme.palette.info.lighter;
  const tipFg = theme.palette.m3?.onPrimaryContainer ?? theme.palette.info.dark;

  // Map urgency → clinical priority ladder color (drives the left border).
  const priorityColor = (() => {
    const p = theme.palette.priority;
    if (!p) return undefined;
    const u = (urgency || '').toString().toLowerCase().replace('_', '-');
    if (u === 'emergency' || u === 'critical') return p.emergency;
    if (u === 'urgent' || u === 'high') return p.urgent;
    if (u === 'semi-urgent' || u === 'medium' || u === 'moderate') return p.semiUrgent;
    if (u === 'non-urgent' || u === 'routine' || u === 'low') return p.nonUrgent;
    return undefined;
  })();

  const matchColor = (pct: number) => {
    if (pct >= 90) return theme.palette.primary.main;
    if (pct >= 80) return theme.palette.success.main;
    return theme.palette.priority?.urgent ?? theme.palette.warning.main;
  };

  if (!slots || slots.length === 0) {
    return (
      <Box mt={2} p={2} bgcolor="background.paper" borderRadius={2}>
        <Typography variant="body2" color="text.secondary">
          No available appointment slots found. Please try different criteria.
        </Typography>
      </Box>
    );
  }

  const [best, ...alternatives] = slots;

  return (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        📅 Available Appointment Slots
      </Typography>

      <Stack spacing={1.5} mt={1}>
        <BestMatchCard
          slot={best}
          matchColor={matchColor(Math.round(best.match_score * 100))}
          leftBorderColor={priorityColor ?? matchColor(Math.round(best.match_score * 100))}
          reasoningBg={reasoningBg}
          onBook={onBookSlot}
        />

        {alternatives.length > 0 && (
          <>
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'text.secondary',
                fontWeight: 600,
                pl: 0.5,
                mt: 0.5,
              }}
            >
              {alternatives.length} other option{alternatives.length === 1 ? '' : 's'}
            </Typography>
            <Stack spacing={0.75}>
              {alternatives.map((slot, i) => (
                <CompactSlotRow
                  key={`${slot.provider.provider_id}-${slot.slot_datetime}`}
                  slot={slot}
                  index={i + 1}
                  matchColor={matchColor(Math.round(slot.match_score * 100))}
                  leftBorderColor={
                    priorityColor ?? theme.palette.divider
                  }
                  reasoningBg={reasoningBg}
                  onBook={onBookSlot}
                />
              ))}
            </Stack>
          </>
        )}
      </Stack>

      <Box
        mt={2}
        p={1.5}
        bgcolor={tipBg}
        color={tipFg}
        borderRadius={`${theme.corner.small}px`}
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
      >
        <LightbulbIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
        <Typography variant="caption">
          Tip: You can request specific dates or times — e.g., "Find morning slots" or "Show next week"
        </Typography>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Best-match card — promoted, full detail, big primary CTA
// ─────────────────────────────────────────────────────────────────────────────
interface BestMatchCardProps {
  slot: Slot;
  matchColor: string;
  leftBorderColor: string;
  reasoningBg: string;
  onBook: (slot: Slot) => void;
}

const BestMatchCard: React.FC<BestMatchCardProps> = ({
  slot,
  matchColor,
  leftBorderColor,
  reasoningBg,
  onBook,
}) => {
  const { dateStr, timeStr } = formatDateTime(slot.slot_datetime);
  const matchPercent = Math.round(slot.match_score * 100);

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        borderColor: matchColor,
        borderWidth: 1,
        borderLeft: '4px solid',
        borderLeftColor: leftBorderColor,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s',
      }}
    >
      <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
              <Chip
                label="BEST MATCH"
                size="small"
                sx={{
                  bgcolor: `${matchColor}1A`,
                  color: matchColor,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  fontSize: 10.5,
                  height: 22,
                }}
              />
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {slot.provider.name}
              </Typography>
            </Stack>
            <Chip
              icon={<StarIcon />}
              label={`${matchPercent}%`}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: `${matchColor}1A`,
                color: matchColor,
                flexShrink: 0,
                '& .MuiChip-icon': { color: matchColor },
              }}
            />
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
            {slot.provider.credentials} • {slot.provider.years_experience} yrs • {slot.provider.specialty}
          </Typography>

          <Divider />

          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2">{dateStr}</Typography>
              <Box sx={{ flex: 1 }} />
              <TimeIcon fontSize="small" color="action" />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Roboto Mono", monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                }}
              >
                {timeStr}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({slot.duration_minutes} min)
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <PlaceIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {slot.facility.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {slot.facility.city}, {slot.facility.region}
                  {slot.distance_miles && slot.distance_miles > 0 && ` • ${slot.distance_miles} mi`}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {slot.reasoning && (
            <Box
              p={1.25}
              bgcolor={reasoningBg}
              borderRadius={1}
              borderLeft={3}
              sx={{ borderLeftColor: matchColor }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Why recommended
              </Typography>
              <Typography variant="caption" display="block" mt={0.25}>
                {slot.reasoning}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={() => onBook(slot)}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            Book best match
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Compact alternative row — single-line by default, expands inline on click
// ─────────────────────────────────────────────────────────────────────────────
interface CompactSlotRowProps {
  slot: Slot;
  index: number;
  matchColor: string;
  leftBorderColor: string;
  reasoningBg: string;
  onBook: (slot: Slot) => void;
}

const CompactSlotRow: React.FC<CompactSlotRowProps> = ({
  slot,
  index,
  matchColor,
  leftBorderColor,
  reasoningBg,
  onBook,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { dateStr, timeStr } = formatDateTime(slot.slot_datetime);
  const matchPercent = Math.round(slot.match_score * 100);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: leftBorderColor,
        borderRadius: 1.5,
        overflow: 'hidden',
        transition: 'all 0.18s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      {/* Compact summary row */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          px: 1.25,
          py: 1,
          cursor: 'pointer',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
          },
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Alternative ${index}: ${slot.provider.name}, ${matchPercent}% match, ${dateStr} ${timeStr}`}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <Box
          sx={{
            width: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}
          aria-hidden
        >
          {rankBadge(index)}
        </Box>
        <Box
          sx={{
            px: 0.75,
            py: 0.15,
            borderRadius: '999px',
            fontSize: 10.5,
            fontWeight: 700,
            bgcolor: `${matchColor}1A`,
            color: matchColor,
            flexShrink: 0,
          }}
        >
          {matchPercent}%
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {slot.provider.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: 'text.secondary',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {dateStr} ·{' '}
            <Box
              component="span"
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}
            >
              {timeStr}
            </Box>
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            onBook(slot);
          }}
          sx={{
            borderRadius: 999,
            px: 1.5,
            py: 0.25,
            minWidth: 0,
            fontSize: 11.5,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Book
        </Button>
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse details' : 'Show details'}
          sx={{ p: 0.25, flexShrink: 0 }}
          tabIndex={-1}
        >
          <ExpandIcon
            fontSize="small"
            sx={{
              transition: 'transform .15s',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          />
        </IconButton>
      </Stack>

      {/* Inline detail */}
      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.m3?.surfaceContainerLowest ?? 'background.default',
          }}
        >
          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary">
              {slot.provider.credentials} • {slot.provider.years_experience} yrs •{' '}
              {slot.provider.specialty}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <PlaceIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2">{slot.facility.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {slot.facility.city}, {slot.facility.region}
                  {slot.distance_miles && slot.distance_miles > 0 && ` • ${slot.distance_miles} mi`}
                </Typography>
              </Box>
            </Stack>
            {slot.reasoning && (
              <Box
                p={1}
                bgcolor={reasoningBg}
                borderRadius={1}
                borderLeft={2}
                sx={{ borderLeftColor: matchColor }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Why recommended
                </Typography>
                <Typography variant="caption" display="block" mt={0.25}>
                  {slot.reasoning}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
