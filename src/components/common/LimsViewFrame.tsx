import React from 'react';
import { DashboardPageBackdrop } from './LimsDashboardArtwork';

interface LimsViewFrameProps {
  children: React.ReactNode;
}

/** Shared max-width column + light page accents for every authenticated route. */
export const LimsViewFrame: React.FC<LimsViewFrameProps> = ({ children }) => (
  <div className="lims-view-frame relative z-[2] isolate min-h-full w-full">
    <DashboardPageBackdrop />
    <div className="relative z-[1] min-h-full w-full">{children}</div>
  </div>
);
