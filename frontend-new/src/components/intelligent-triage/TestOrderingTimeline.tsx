/**
 * Test Ordering Timeline Component
 * Shows intelligent test ordering plan with multi-day timeline
 * Displays STAT tests, labs, imaging with scheduling options
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  List,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  LocalHospital as HospitalIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Email as EmailIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import type { TriageResult } from '../../context/WorkflowContext';

interface TestOrderingTimelineProps {
  triageResult: TriageResult;
  onScheduleTest?: (test: any, date: string, time: string) => void;
  onMarkTestComplete?: (test: any) => void;
  onEmailInstructions?: () => void;
  scheduledTests?: any[];
  completedTests?: any[];
}

const TestOrderingTimeline: React.FC<TestOrderingTimelineProps> = ({
  triageResult,
  onScheduleTest,
  onMarkTestComplete,
  onEmailInstructions,
  scheduledTests = [],
  completedTests = []
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('labs');

  // Helper to check if a test is already scheduled
  const isTestScheduled = (testName: string) => {
    return scheduledTests.some(st => st.test_name === testName);
  };

  // Helper to check if a test is completed
  const isTestComplete = (testName: string) => {
    return completedTests.some(ct => ct.test_name === testName);
  };

  // Helper to get scheduled test details
  const getScheduledTest = (testName: string) => {
    return scheduledTests.find(st => st.test_name === testName);
  };

  const testPlan = triageResult.test_ordering_plan;

  if (!testPlan) {
    return null;
  }

  const { ordering_plan, timeline, patient_instructions } = testPlan;

  // Calculate progress
  const totalDays = Object.keys(timeline).length;
  const currentDay = 1; // Would be calculated based on actual dates
  const progress = (currentDay / totalDays) * 100;

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Card sx={{ mb: 3, boxShadow: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ScheduleIcon sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              📋 Pre-Appointment Testing Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All tests must be completed before appointment
            </Typography>
          </Box>
        </Box>

        {/* Timeline Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              Timeline Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Day {currentDay} of {totalDays}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* STAT Tests (Completed Today) */}
        {ordering_plan.immediate_tests && ordering_plan.immediate_tests.length > 0 && (
          <Accordion
            expanded={expandedSection === 'stat'}
            onChange={handleAccordionChange('stat')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <CheckIcon color="success" sx={{ mr: 2 }} />
                <Typography fontWeight="bold">
                  ✅ STAT Tests (Complete Today)
                </Typography>
                <Chip
                  label={`${ordering_plan.immediate_tests.length} tests`}
                  size="small"
                  color="success"
                  sx={{ ml: 'auto', mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {ordering_plan.immediate_tests.map((test, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {test.test}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {test.reason}
                    </Typography>
                    <Chip
                      label="Completed"
                      color="success"
                      size="small"
                      icon={<CheckIcon />}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Fasting Labs */}
        {ordering_plan.pre_appointment_labs && ordering_plan.pre_appointment_labs.length > 0 && (
          <Accordion
            expanded={expandedSection === 'labs'}
            onChange={handleAccordionChange('labs')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ScienceIcon color="primary" sx={{ mr: 2 }} />
                <Typography fontWeight="bold">
                  🔬 Fasting Labs (Schedule for Tomorrow)
                </Typography>
                <Chip
                  label={`${ordering_plan.pre_appointment_labs.length} tests`}
                  size="small"
                  color="primary"
                  sx={{ ml: 'auto', mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {ordering_plan.pre_appointment_labs.map((lab, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {lab.test}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {lab.reason}
                  </Typography>

                  {lab.fasting && (
                    <Alert severity="warning" sx={{ my: 1 }}>
                      <Typography variant="caption">
                        ⚠️ Fasting required: No food or drink after midnight (water OK)
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                      ⏰ Status:
                    </Typography>
                    {isTestComplete(lab.test) ? (
                      <Chip
                        label="✓ Completed"
                        color="success"
                        icon={<CheckIcon />}
                        sx={{ mb: 1, fontWeight: 600 }}
                      />
                    ) : isTestScheduled(lab.test) ? (
                      <Stack spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          label={`✓ Scheduled - ${getScheduledTest(lab.test)?.scheduled_date} ${getScheduledTest(lab.test)?.scheduled_time}`}
                          color="primary"
                          icon={<CheckIcon />}
                          sx={{ fontWeight: 500 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => onMarkTestComplete && onMarkTestComplete({
                            test_name: lab.test,
                            test_type: 'laboratory',
                            scheduled_date: getScheduledTest(lab.test)?.scheduled_date,
                            scheduled_time: getScheduledTest(lab.test)?.scheduled_time
                          })}
                          sx={{ maxWidth: 200 }}
                        >
                          Mark as Complete
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onScheduleTest && onScheduleTest(lab, 'tomorrow', '7:00 AM')}
                        >
                          Tomorrow 7:00 AM
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onScheduleTest && onScheduleTest(lab, 'tomorrow', '7:30 AM')}
                        >
                          Tomorrow 7:30 AM ⭐
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onScheduleTest && onScheduleTest(lab, 'tomorrow', '8:00 AM')}
                        >
                          Tomorrow 8:00 AM
                        </Button>
                      </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" display="block">
                      📍 Location: Main Lab - 1st Floor
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      label={lab.required ? 'Required' : 'Recommended'}
                      color={lab.required ? 'error' : 'info'}
                      size="small"
                    />
                    <Chip
                      label={lab.insurance_coverage || 'Covered'}
                      color="success"
                      size="small"
                    />
                  </Box>
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Imaging Studies */}
        {ordering_plan.imaging_studies && ordering_plan.imaging_studies.length > 0 && (
          <Accordion
            expanded={expandedSection === 'imaging'}
            onChange={handleAccordionChange('imaging')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <HospitalIcon color="secondary" sx={{ mr: 2 }} />
                <Typography fontWeight="bold">
                  🏥 Imaging (Requires Insurance Auth)
                </Typography>
                <Chip
                  label={`${ordering_plan.imaging_studies.length} studies`}
                  size="small"
                  color="secondary"
                  sx={{ ml: 'auto', mr: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {ordering_plan.imaging_studies.map((imaging, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {imaging.test}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {imaging.reason}
                  </Typography>

                  <Alert severity="info" sx={{ my: 1 }}>
                    <Typography variant="caption">
                      Insurance Auth: ⏳ Pending (typically 2-3 business days)
                    </Typography>
                  </Alert>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Earliest Date: Monday, Dec 16 @ 9:00 AM
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                    >
                      Request Insurance Auth
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                    >
                      View Details
                    </Button>
                  </Box>
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Patient Instructions */}
        {patient_instructions && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" icon={<TimeIcon />}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                ℹ️ Appointment Scheduling
              </Typography>
              <Typography variant="body2">
                {patient_instructions.next_steps ||
                  'Appointment can be scheduled after all test results are available'}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={onEmailInstructions}
              >
                Email Instructions to Patient
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
              >
                Print
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TestOrderingTimeline;
