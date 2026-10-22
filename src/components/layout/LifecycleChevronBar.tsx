import React from 'react';

export interface LifecycleChevronBarProps {
  currentStage?: string;
  onCompleteStage?: () => void;
  entityType?: 'Sample' | 'Batch';
}

/**
 * LifecycleChevronBar removed per user request.
 */
export const LifecycleChevronBar: React.FC<LifecycleChevronBarProps> = () => {
  return null;
};

