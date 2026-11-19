import React from 'react';

interface LimsWorkspaceProps {
  /** Page title block (use LimsPageHeader with variant="embedded"). */
  header?: React.ReactNode;
  /** Optional strip under the header (search, filters, stepper). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Single main white panel — matches Home “Laboratory requests” container. */
export const LimsWorkspace: React.FC<LimsWorkspaceProps> = ({
  header,
  toolbar,
  children,
  className = '',
}) => (
  <section className={`lims-card overflow-hidden shadow-sm ${className}`.trim()}>
    {header}
    {toolbar}
    {children}
  </section>
);
