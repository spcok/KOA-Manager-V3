
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  features: string[];
  type: 'major' | 'minor' | 'patch';
}

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-02-11',
    title: 'Data Migration & Portability',
    type: 'minor',
    features: [
      'Full Database Export: Backup the entire collection in JSON format.',
      'Database Restoration: Import system backups to recover or migrate data.',
      'Extended Export Formats: Added JSON support alongside CSV for structured data handling.',
      'Safety Guardrails: Added confirmation protocols for destructive data imports.'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-02-10',
    title: 'System Launch',
    type: 'major',
    features: [
      'Initial release of the Kent Owl Academy Management System.',
      'Comprehensive tracking for animals, weights, and dietary management.',
      'Statutory Compliance Suite: Section 9 Movement Logs and MAR Charts.',
      'Staff Attendance Registry and Emergency Roll-Call integration.',
      'AI Veterinary Diagnostic Engine and GPS Flight Analysis.',
      'Digital Medical Records and Quarantine Station management.'
    ]
  }
];
