import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Place as PlaceIcon,
  Person as PersonIcon,
  Star as StarIcon,
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

interface SlotRecommendationsProps {
  slots: Slot[];
  onBookSlot: (slot: Slot) => void;
}

export const SlotRecommendations: React.FC<SlotRecommendationsProps> = ({ slots, onBookSlot }) => {
  const formatDateTime = (datetimeStr: string) => {
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
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '📅';
    }
  };

  const handleBookSlot = (slot: Slot) => {
    onBookSlot(slot);
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

  return (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        📅 Available Appointment Slots
      </Typography>

      <Stack spacing={2} mt={1}>
        {slots.map((slot, index) => {
          const { dateStr, timeStr } = formatDateTime(slot.slot_datetime);
          const matchPercent = Math.round(slot.match_score * 100);

          return (
            <Card
              key={`${slot.provider.provider_id}-${slot.slot_datetime}`}
              variant="outlined"
              sx={{
                borderColor: index === 0 ? 'primary.main' : 'divider',
                borderWidth: index === 0 ? 2 : 1,
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2,
                },
                transition: 'all 0.2s',
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  {/* Header with Rank and Match Score */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getRankEmoji(index)}</span>
                      {slot.provider.name}
                    </Typography>
                    <Chip
                      icon={<StarIcon />}
                      label={`${matchPercent}% Match`}
                      size="small"
                      color={index === 0 ? 'primary' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* Provider Details */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {slot.provider.credentials} • {slot.provider.years_experience} years experience
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {slot.provider.specialty}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Appointment Details */}
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">{dateStr}</Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {timeStr} ({slot.duration_minutes} min)
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <PlaceIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2">{slot.facility.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {slot.facility.city}, {slot.facility.region}
                          {slot.distance_miles && slot.distance_miles > 0 && ` • ${slot.distance_miles} mi`}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  {/* Reasoning */}
                  {slot.reasoning && (
                    <Box
                      p={1.5}
                      bgcolor="action.hover"
                      borderRadius={1}
                      borderLeft={3}
                      borderColor={index === 0 ? 'primary.main' : 'divider'}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Why recommended:
                      </Typography>
                      <Typography variant="caption" display="block" mt={0.5}>
                        {slot.reasoning}
                      </Typography>
                    </Box>
                  )}

                  {/* Book Button */}
                  <Button
                    variant={index === 0 ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleBookSlot(slot)}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {index === 0 ? 'Book Best Match' : 'Book This Slot'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Box mt={2} p={1.5} bgcolor="info.lighter" borderRadius={1}>
        <Typography variant="caption" color="info.dark">
          💡 Tip: You can also request specific dates or times, e.g., "Find morning slots" or "Show next
          week"
        </Typography>
      </Box>
    </Box>
  );
};
