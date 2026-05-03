/**
 * Details Panel Component
 * Displays structured metadata from chat responses
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  EventAvailable as EventIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import type { ChatMessage } from '../../types';
import { SlotRecommendations } from '../SlotRecommendations';

interface DetailsPanelProps {
  metadata: ChatMessage['metadata'] | null;
}

interface TestRequirement {
  name: string;
  description: string;
  urgent: boolean;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ metadata }) => {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [requiredTests, setRequiredTests] = useState<TestRequirement[]>([]);

  // Parse testing requirements when metadata changes
  useEffect(() => {
    if (metadata?.testingStatus?.formatted_message) {
      const tests = parseTestRequirements(metadata.testingStatus.formatted_message);
      setRequiredTests(tests);
      // Reset completed tests when new requirements arrive
      setCompletedTests(new Set());
    }
  }, [metadata?.testingStatus?.formatted_message]);

  // Parse formatted test message into structured data
  const parseTestRequirements = (message: string): TestRequirement[] => {
    const tests: TestRequirement[] = [];
    const lines = message.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('- ')) {
        const match = line.match(/- ([^:]+): (.+?) \((URGENT|RECOMMENDED)\)/);
        if (match) {
          tests.push({
            name: match[1].trim(),
            description: match[2].trim(),
            urgent: match[3] === 'URGENT'
          });
        }
      }
    }

    return tests;
  };

  const handleTestToggle = (testName: string) => {
    setCompletedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName);
      } else {
        newSet.add(testName);
      }
      return newSet;
    });
  };

  const allTestsCompleted = requiredTests.length > 0 &&
    requiredTests.filter(t => t.urgent).every(t => completedTests.has(t.name));

  // Color scheme for different order types
  const getOrderColor = (orderName: string) => {
    const name = orderName.toLowerCase();
    if (name.includes('ecg') || name.includes('ekg')) return '#e74c3c'; // Red
    if (name.includes('troponin')) return '#9b59b6'; // Purple
    if (name.includes('bnp') || name.includes('natriuretic')) return '#3498db'; // Blue
    if (name.includes('x-ray') || name.includes('xray')) return '#f39c12'; // Orange
    if (name.includes('chest')) return '#16a085'; // Teal
    if (name.includes('lipid') || name.includes('cholesterol')) return '#27ae60'; // Green
    if (name.includes('glucose') || name.includes('a1c')) return '#e67e22'; // Dark orange
    if (name.includes('vitals') || name.includes('blood pressure')) return '#34495e'; // Dark gray
    return '#95a5a6'; // Default gray
  };
  if (!metadata) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="body2" color="text.secondary">
          No additional details available
        </Typography>
      </Box>
    );
  }

  // Check what types of data we have
  const hasPatient = metadata.patient?.patient;
  const hasTriage = metadata.triage;
  const hasTests = metadata.testingStatus;
  const hasSlots = metadata.availableSlots && metadata.availableSlots.length > 0;
  const hasAppointment = metadata.appointmentConfirmation;

  return (
    <Stack spacing={3}>
      {/* Quick Summary - Show what data is available */}
      {(hasPatient || hasTriage || hasTests || hasSlots || hasAppointment) && (
        <Alert severity="info" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Information:
          </Typography>
          <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
            {hasPatient && <li>Patient Demographics & History</li>}
            {hasTriage && <li>Triage Assessment & Priority</li>}
            {hasTests && <li>Testing Requirements</li>}
            {hasSlots && <li>Available Appointment Slots</li>}
            {hasAppointment && <li>Confirmed Appointment</li>}
          </Box>
        </Alert>
      )}

      {/* Patient Information */}
      {metadata.patient && metadata.patient.patient && (
        <Card>
          <CardHeader
            avatar={<PersonIcon color="primary" />}
            title="Patient Information"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
          />
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {metadata.patient.patient.name ?? 'Unknown Patient'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {metadata.patient.patient.age ?? 'Unknown'}y • {metadata.patient.patient.gender ?? 'Unknown'} • ID: {metadata.patient.patient.id}
            </Typography>

            {/* Conditions */}
            {(metadata.patient as any).conditions && (metadata.patient as any).conditions.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Active Conditions
                </Typography>
                <List dense disablePadding>
                  {(metadata.patient as any).conditions.map((condition: any, index: number) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText
                        primary={condition.code || condition}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Medications */}
            {(metadata.patient as any).medications && (metadata.patient as any).medications.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Current Medications
                </Typography>
                <List dense disablePadding>
                  {(metadata.patient as any).medications.map((med: any, index: number) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText
                        primary={med.medication}
                        secondary={med.dosage}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Appointment Slots — promoted above Triage so the MA can
          act on the recommendation while the assessment provides context. */}
      {metadata.availableSlots && metadata.availableSlots.length > 0 && (
        <SlotRecommendations
          slots={metadata.availableSlots}
          urgency={metadata.triage?.urgency ?? metadata.triage?.priority}
          onBookSlot={(slot) => {
            console.log('Booking slot:', slot);
            // TODO: Implement actual booking logic
          }}
        />
      )}

      {/* Triage Details */}
      {metadata.triage && (
        <Card>
          <CardHeader
            avatar={<HospitalIcon color={(metadata.triage as any).priority === 'CRITICAL' || metadata.triage.priority === 'emergency' ? 'error' : 'warning'} />}
            title="Triage Assessment"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
          />
          <CardContent>
            {/* Priority Alert */}
            <Alert
              severity={
                (metadata.triage as any).priority === 'CRITICAL' || metadata.triage.priority === 'emergency'
                  ? 'error'
                  : (metadata.triage as any).priority === 'HIGH' || metadata.triage.priority === 'urgent'
                  ? 'warning'
                  : 'info'
              }
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {(metadata.triage as any).priority || metadata.triage.priority} PRIORITY
              </Typography>
              {(metadata.triage as any).risk_level && (
                <Typography variant="caption">
                  Risk Level: {(metadata.triage as any).risk_level}
                </Typography>
              )}
            </Alert>

            {/* Protocol */}
            {(metadata.triage as any).protocol && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Activated Protocol
                </Typography>
                <Chip
                  label={(metadata.triage as any).protocol}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {/* Risk Factors */}
            {(metadata.triage as any).risk_factors && (metadata.triage as any).risk_factors.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Risk Factors
                </Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                  {(metadata.triage as any).risk_factors.map((factor: string, index: number) => (
                    <ListItem key={index} disablePadding>
                      <WarningIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                      <ListItemText
                        primary={factor}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Red Flags */}
            {metadata.triage.red_flags && metadata.triage.red_flags.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Red Flags
                </Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                  {metadata.triage.red_flags.map((flag, index) => (
                    <ListItem key={index} disablePadding>
                      <WarningIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                      <ListItemText
                        primary={flag}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Immediate Actions (handle both array and object types) */}
            {(metadata.triage as any).recommendations && Array.isArray((metadata.triage as any).recommendations) && (metadata.triage as any).recommendations.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Immediate Actions Required
                </Typography>
                <List dense disablePadding>
                  {(metadata.triage as any).recommendations.map((rec: string, index: number) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText
                        primary={`• ${rec}`}
                        primaryTypographyProps={{ variant: 'body2', color: 'error' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Handle recommendations as object */}
            {metadata.triage.recommendations && typeof metadata.triage.recommendations === 'object' && !Array.isArray(metadata.triage.recommendations) && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Immediate Action:</strong> {metadata.triage.recommendations.immediate_action}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Care Level:</strong> {metadata.triage.recommendations.care_level}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timeframe:</strong> {metadata.triage.recommendations.timeframe}
                  </Typography>
                </Box>
              </>
            )}

            {/* Reasoning */}
            {metadata.triage.reasoning && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  {metadata.triage.reasoning}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Requirements */}
      {metadata.testingStatus && (
        <Card>
          <CardHeader
            avatar={<ScienceIcon color="primary" />}
            title="Order Requirements"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
          />
          <CardContent>
            {requiredTests.length > 0 ? (
              <Stack spacing={1.5}>
                {requiredTests.map((test, index) => {
                  const orderColor = getOrderColor(test.name);
                  return (
                    <Box
                      key={index}
                      sx={{
                        borderLeft: 4,
                        borderColor: orderColor,
                        bgcolor: completedTests.has(test.name) ? `${orderColor}15` : 'background.paper',
                        p: 1.5,
                        borderRadius: 1,
                        boxShadow: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={completedTests.has(test.name)}
                            onChange={() => handleTestToggle(test.name)}
                            sx={{
                              color: orderColor,
                              '&.Mui-checked': {
                                color: orderColor,
                              }
                            }}
                          />
                        }
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                sx={{ color: orderColor }}
                              >
                                {test.name}
                              </Typography>
                              {test.urgent && (
                                <Chip
                                  label="URGENT"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    bgcolor: orderColor,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {test.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              metadata.testingStatus.formatted_message && (
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {metadata.testingStatus.formatted_message}
                </Typography>
              )
            )}
          </CardContent>
        </Card>
      )}


      {/* Confirmed Appointment */}
      {metadata.appointmentConfirmation && (
        <Card>
          <CardHeader
            avatar={<EventIcon color="success" />}
            title="Appointment Confirmed"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
          />
          <CardContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                Confirmation #{metadata.appointmentConfirmation.confirmation_number}
              </Typography>
            </Alert>

            <Typography variant="body2" gutterBottom>
              <strong>Patient ID:</strong> {metadata.appointmentConfirmation.patient_id}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Provider:</strong> {metadata.appointmentConfirmation.provider_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Facility:</strong> {metadata.appointmentConfirmation.facility_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Date/Time:</strong> {metadata.appointmentConfirmation.date} {metadata.appointmentConfirmation.time}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};
