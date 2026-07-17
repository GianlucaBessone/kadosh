import React, { ProfilerOnRenderCallback, useEffect, useRef } from 'react';
import { PerformanceReporter } from './PerformanceReporter';

export const onRenderCallback: ProfilerOnRenderCallback = (...args: any[]) => {
  const [id, phase, actualDuration, baseDuration, startTime, commitTime, interactions] = args;
  PerformanceReporter.record({
    name: `ReactRender_${id}_${phase}`,
    category: 'react',
    duration: actualDuration,
    details: { baseDuration, interactions }
  });
};

export function useRenderTracker(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    PerformanceReporter.record({
      name: `ReactRenderCount_${componentName}`,
      category: 'react',
      duration: 0,
      details: { renders: renderCount.current }
    });
  });
  
  return renderCount.current;
}
