/**
 * Workflow Context - Manages intelligent MA workflow state
 * Tracks triage, test ordering, prep tracking, and appointment scheduling
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Types
export interface PatientInfo {
  fhir_id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
}

export interface ProtocolInfo {
  name: string;
  priority: string;
  key: string;
}

export interface RiskAssessment {
  risk_level: 'HIGH' | 'MODERATE' | 'LOW';
  risk_score: number;
  risk_factors: string[];
}

export interface Action {
  action: string;
  urgency: 'immediate' | 'urgent' | 'routine' | 'conditional';
  status: 'pending' | 'in_progress' | 'completed';
  details?: string;
}

export interface TestOrder {
  test: string;
  order_type: 'laboratory' | 'imaging' | 'procedure';
  required: boolean;
  urgency: string;
  max_age_days?: number;
  reason: string;
  fasting?: boolean;
  insurance_coverage?: string;
}

export interface TestPlan {
  immediate_tests: TestOrder[];
  pre_appointment_labs: TestOrder[];
  imaging_studies: TestOrder[];
  optional_tests: TestOrder[];
}

export interface Timeline {
  [key: string]: {
    date: string;
    tasks: Array<{
      time: string;
      task: string;
      status: string;
      urgency?: string;
      fasting_required?: boolean;
    }>;
  };
}

export interface Checkpoint {
  checkpoint: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending_external' | 'failed';
  details?: string;
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  completed_at?: string;
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  message: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  created_at: string;
  acknowledged: boolean;
}

export interface Workflow {
  workflow_id: string;
  patient_fhir_id: string;
  patient_name: string;
  protocol_name: string;
  provider_name: string;
  specialty: string;
  urgency: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  created_at: string;
  updated_at: string;
  current_step: string;
  checkpoints: Checkpoint[];
  alerts: Alert[];
  test_orders: any[];
  appointment_scheduled: boolean;
}

export interface TriageResult {
  patient: PatientInfo;
  protocol_activated: boolean;
  protocol: ProtocolInfo | null;
  risk_assessment: RiskAssessment | null;
  immediate_actions: Action[];
  provider_preferences: any;
  test_ordering_plan: {
    ordering_plan: TestPlan;
    timeline: Timeline;
    patient_instructions: any;
    earliest_appointment_date: string;
  } | null;
  workflow: Workflow | null;
  alerts: Alert[];
  urgency: string;
  ma_summary: string;
}

export interface WorkflowState {
  // Active workflow data
  activeWorkflow: TriageResult | null;

  // Current step in the workflow
  currentStep: 'triage' | 'test-ordering' | 'prep-tracking' | 'scheduling' | 'confirmation';

  // UI state
  completedActions: string[];
  scheduledTests: any[];
  completedTests: any[];
  selectedAppointment: any | null;
  showProtocolCard: boolean;
  showTestOrdering: boolean;
  showPrepTracker: boolean;
  showAppointmentScheduling: boolean;
  allRequiredTestsComplete: boolean;
}

interface WorkflowContextType {
  state: WorkflowState;
  setActiveWorkflow: (workflow: TriageResult | null) => void;
  setCurrentStep: (step: WorkflowState['currentStep']) => void;
  markActionComplete: (action: string) => void;
  addScheduledTest: (test: any) => void;
  markTestComplete: (test: any) => void;
  setSelectedAppointment: (appointment: any) => void;
  toggleProtocolCard: () => void;
  toggleTestOrdering: () => void;
  togglePrepTracker: () => void;
  resetWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [state, setState] = useState<WorkflowState>({
    activeWorkflow: null,
    currentStep: 'triage',
    completedActions: [],
    scheduledTests: [],
    completedTests: [],
    selectedAppointment: null,
    showProtocolCard: false,
    showTestOrdering: false,
    showPrepTracker: false,
    showAppointmentScheduling: false,
    allRequiredTestsComplete: false,
  });

  const setActiveWorkflow = (workflow: TriageResult | null) => {
    if (!workflow) {
      setState(prev => ({
        ...prev,
        activeWorkflow: null,
        completedTests: [],
        showProtocolCard: false,
        showTestOrdering: false,
        showAppointmentScheduling: false,
        allRequiredTestsComplete: false,
        currentStep: 'triage'
      }));
      return;
    }

    // Initialize completedTests with any STAT/immediate tests that are already complete
    const initialCompletedTests: any[] = [];

    if (workflow.test_ordering_plan?.ordering_plan?.immediate_tests) {
      workflow.test_ordering_plan.ordering_plan.immediate_tests.forEach((test: any) => {
        initialCompletedTests.push({
          test_name: test.test,
          test_type: 'immediate',
          status: 'completed',
          completed_at: new Date().toISOString(),
          reason: test.reason
        });
      });
    }

    // Check if all required tests are already complete (unlikely but possible)
    let allComplete = false;
    if (workflow.test_ordering_plan) {
      const orderingPlan = workflow.test_ordering_plan.ordering_plan;
      const requiredTests = [
        ...(orderingPlan.immediate_tests || []),
        ...(orderingPlan.pre_appointment_labs?.filter((t: any) => t.required) || [])
      ];

      allComplete = requiredTests.every((requiredTest: any) =>
        initialCompletedTests.some((completedTest: any) =>
          completedTest.test_name === requiredTest.test
        )
      );

      console.log('📋 Workflow activated:');
      console.log('  Required Tests:', requiredTests.map((t: any) => t.test));
      console.log('  Initially Complete:', initialCompletedTests.map((t: any) => t.test_name));
      console.log('  All Complete:', allComplete);
    }

    setState(prev => ({
      ...prev,
      activeWorkflow: workflow,
      completedTests: initialCompletedTests,
      showProtocolCard: workflow.protocol_activated || false,
      showTestOrdering: workflow.test_ordering_plan != null && !allComplete,
      showAppointmentScheduling: allComplete,
      allRequiredTestsComplete: allComplete,
      currentStep: allComplete ? 'scheduling' : 'test-ordering'
    }));
  };

  const setCurrentStep = (step: WorkflowState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const markActionComplete = (action: string) => {
    setState(prev => ({
      ...prev,
      completedActions: [...prev.completedActions, action]
    }));
  };

  const addScheduledTest = (test: any) => {
    setState(prev => ({
      ...prev,
      scheduledTests: [...prev.scheduledTests, test]
    }));
  };

  const markTestComplete = (test: any) => {
    setState(prev => {
      const newCompletedTests = [...prev.completedTests, {
        ...test,
        completed_at: new Date().toISOString(),
        status: 'completed'
      }];

      // Check if all required tests are complete
      const activeWorkflow = prev.activeWorkflow;
      if (activeWorkflow?.test_ordering_plan) {
        const orderingPlan = activeWorkflow.test_ordering_plan.ordering_plan;

        // Required tests to check:
        // - Immediate tests (STAT) - already in completedTests from initialization
        // - Pre-appointment labs where required = true
        // - Imaging studies are NOT required for appointment scheduling (they require auth and can happen after)
        const requiredTests = [
          ...(orderingPlan.immediate_tests || []),
          ...(orderingPlan.pre_appointment_labs?.filter((t: any) => t.required) || [])
        ];

        const allComplete = requiredTests.every((requiredTest: any) =>
          newCompletedTests.some((completedTest: any) =>
            completedTest.test_name === requiredTest.test
          )
        );

        console.log('🔍 Checking test completion:');
        console.log('  Required Test Count:', requiredTests.length);
        console.log('  Required Tests:', requiredTests.map((t: any) => t.test));
        console.log('  Completed Test Count:', newCompletedTests.length);
        console.log('  Completed Tests:', newCompletedTests.map((t: any) => t.test_name));
        console.log('  All Complete:', allComplete);

        // Detailed matching check
        requiredTests.forEach((requiredTest: any) => {
          const isMatched = newCompletedTests.some((completedTest: any) =>
            completedTest.test_name === requiredTest.test
          );
          console.log(`  ✓ ${requiredTest.test}: ${isMatched ? 'MATCHED' : 'NOT MATCHED'}`);
        });

        return {
          ...prev,
          completedTests: newCompletedTests,
          allRequiredTestsComplete: allComplete,
          showAppointmentScheduling: allComplete,
          currentStep: allComplete ? 'scheduling' : prev.currentStep
        };
      }

      return {
        ...prev,
        completedTests: newCompletedTests
      };
    });
  };

  const setSelectedAppointment = (appointment: any) => {
    setState(prev => ({
      ...prev,
      selectedAppointment: appointment,
      currentStep: 'confirmation'
    }));
  };

  const toggleProtocolCard = () => {
    setState(prev => ({
      ...prev,
      showProtocolCard: !prev.showProtocolCard
    }));
  };

  const toggleTestOrdering = () => {
    setState(prev => ({
      ...prev,
      showTestOrdering: !prev.showTestOrdering
    }));
  };

  const togglePrepTracker = () => {
    setState(prev => ({
      ...prev,
      showPrepTracker: !prev.showPrepTracker
    }));
  };

  const resetWorkflow = () => {
    setState({
      activeWorkflow: null,
      currentStep: 'triage',
      completedActions: [],
      scheduledTests: [],
      completedTests: [],
      selectedAppointment: null,
      showProtocolCard: false,
      showTestOrdering: false,
      showPrepTracker: false,
      showAppointmentScheduling: false,
      allRequiredTestsComplete: false,
    });
  };

  const value: WorkflowContextType = {
    state,
    setActiveWorkflow,
    setCurrentStep,
    markActionComplete,
    addScheduledTest,
    markTestComplete,
    setSelectedAppointment,
    toggleProtocolCard,
    toggleTestOrdering,
    togglePrepTracker,
    resetWorkflow,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
