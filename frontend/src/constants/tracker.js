export const TRACKER_TYPE_OPTIONS = [
  { value: 'quit', label: 'Quit' },
  { value: 'build', label: 'Build' },
  { value: 'boolean', label: 'Yes/No (Boolean)' }
];

export const DEFAULT_TRACKER_FORM = {
  id: null,
  name: '',
  category: 'General',
  type: 'quit',
  unit: '',
  impact_amount: 0.0,
  impact_unit: '$',
  impact_per: 'day',
  units_per_amount: 0.0,
  units_per: 'day',
  units_per_interval: 1,
  is_active: true
};

export const DEFAULT_JOURNAL_FORM = { id: null, content: '', mood: 3 };

export const DEFAULT_LOG_FORM = {
  amount: 1.0,
  timestamp: new Date().toISOString()
};
