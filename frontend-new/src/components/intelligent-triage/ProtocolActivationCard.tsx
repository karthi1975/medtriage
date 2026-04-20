/**
 * Protocol Activation Card
 * Displays when a clinical protocol is activated (e.g., Chest Pain Protocol)
 * Shows risk assessment, immediate actions, and provider preferences
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import type { TriageResult } from '../../context/WorkflowContext';

interface ProtocolActivationCardProps {
  triageResult: TriageResult;
  onActionComplete?: (action: string) => void;
  completedActions?: string[];
}

const ProtocolActivationCard: React.FC<ProtocolActivationCardProps> = ({
  triageResult,
  onActionComplete,
  completedActions = []
}) => {
  const theme = useTheme();
  const { protocol, risk_assessment, patient, provider_preferences } = triageResult;

  if (!protocol) {
    return null;
  }

  const tonalBg = theme.palette.m3?.surfaceContainerLowest ?? theme.palette.grey[50];

  // Get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'error';
      case 'MODERATE':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'error';
      case 'routine':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderLeft: '4px solid',
        borderLeftColor: getPriorityColor(protocol.priority) + '.main',
        border: `1px solid ${theme.palette.m3?.outlineVariant ?? theme.palette.divider}`,
        borderLeftWidth: 4,
        boxShadow: '0 1px 2px rgba(60,64,67,0.08), 0 4px 12px rgba(60,64,67,0.05)',
        borderRadius: `${theme.corner.medium}px`,
      }}
    >
      <CardContent>
        {/* Protocol Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HospitalIcon
            sx={{
              fontSize: 40,
              color: getPriorityColor(protocol.priority) + '.main',
              mr: 2
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold" color={getPriorityColor(protocol.priority) + '.main'}>
              🚨 {protocol.name.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activated for {patient.name}, {patient.age}yo {patient.gender}
            </Typography>
          </Box>
          <Chip
            label={protocol.priority.toUpperCase()}
            color={getPriorityColor(protocol.priority) as any}
            size="medium"
            sx={{ fontWeight: 'bold', fontSize: '1rem', py: 1 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Risk Assessment */}
        {risk_assessment && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon sx={{ mr: 1, color: getRiskColor(risk_assessment.risk_level) + '.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Risk Level:
                <Chip
                  label={risk_assessment.risk_level}
                  color={getRiskColor(risk_assessment.risk_level) as any}
                  size="small"
                  sx={{ ml: 1, fontWeight: 'bold' }}
                />
              </Typography>
            </Box>

            {risk_assessment.risk_factors && risk_assessment.risk_factors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: tonalBg, borderColor: theme.palette.m3?.outlineVariant ?? theme.palette.divider }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Risk Factors:
                </Typography>
                <List dense>
                  {risk_assessment.risk_factors.map((factor, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={factor}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Immediate Actions */}
        {triageResult.immediate_actions && triageResult.immediate_actions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight="bold">
                ⚡ IMMEDIATE ACTIONS REQUIRED
              </Typography>
            </Alert>

            <List>
              {triageResult.immediate_actions
                .filter(action => action.urgency === 'immediate' || action.urgency === 'urgent')
                .map((action, index) => {
                  const isCompleted = completedActions.includes(action.action);

                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 1,
                        bgcolor: isCompleted ? 'success.lighter' : 'background.paper',
                        border: isCompleted ? '2px solid' : '1px solid',
                        borderColor: isCompleted ? 'success.main' : 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            mr: 2,
                            mt: 0.5,
                            cursor: onActionComplete ? 'pointer' : 'default'
                          }}
                          onClick={() => !isCompleted && onActionComplete && onActionComplete(action.action)}
                        >
                          {isCompleted ? (
                            <CheckIcon color="success" fontSize="large" />
                          ) : (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                border: '2px solid',
                                borderColor: 'grey.400',
                                borderRadius: 1
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              color: isCompleted ? 'text.secondary' : 'text.primary'
                            }}
                          >
                            {action.action}
                          </Typography>
                          {action.details && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {action.details}
                            </Typography>
                          )}
                          <Chip
                            label={action.urgency.toUpperCase()}
                            color={action.urgency === 'immediate' ? 'error' : 'warning'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
            </List>
          </Box>
        )}

        {/* Provider Preferences */}
        {provider_preferences && provider_preferences.notes && (
          <Alert
            severity="info"
            icon={<LightbulbIcon />}
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              💡 Provider Preference
            </Typography>
            <Typography variant="body2">
              {provider_preferences.notes}
            </Typography>
          </Alert>
        )}

        {/* Workflow Info */}
        {triageResult.workflow && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Workflow created: {triageResult.workflow.workflow_id}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProtocolActivationCard;
