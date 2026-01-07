import React, { useState, useEffect, useMemo } from 'react';
import CronFieldBuilder from './CronFieldBuilder';
import {
  generateCronExpression,
  parseCronExpression,
  getHumanReadable
} from '../utils/cronUtils';
import '../styles/CronBuilder.css';

const CronBuilder = ({ value, onChange, disabled = false }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [fields, setFields] = useState({
    second: { type: 'every', value: '*', from: '', to: '', step: '', list: '' },
    minute: { type: 'every', value: '*', from: '', to: '', step: '', list: '' },
    hour: { type: 'every', value: '*', from: '', to: '', step: '', list: '' },
    day: { type: 'every', value: '*', from: '', to: '', step: '', list: '' },
    month: { type: 'every', value: '*', from: '', to: '', step: '', list: '' },
    dayOfWeek: { type: 'every', value: '*', from: '', to: '', step: '', list: '' }
  });
  const [rawCron, setRawCron] = useState('');
  const [parseError, setParseError] = useState('');

  // Generate CRON expression from fields
  const cronExpression = useMemo(
    () => generateCronExpression(fields),
    [fields]
  );

  // Generate human-readable description
  const humanReadable = useMemo(
    () => getHumanReadable(fields),
    [fields]
  );

  // Initialize from prop
  useEffect(() => {
    if (value) {
      const parsed = parseCronExpression(value);
      if (parsed) {
        setFields(parsed);
        setRawCron(value);
        setParseError('');
      } else {
        setRawCron(value);
        setParseError('Unable to parse CRON expression');
      }
    }
  }, []);

  // Sync changes to parent
  useEffect(() => {
    if (onChange) {
      onChange(isAdvancedMode ? rawCron : cronExpression);
    }
  }, [cronExpression, rawCron, isAdvancedMode, onChange]);

  // Handle field change
  const handleFieldChange = (fieldName, newFieldState) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: newFieldState
    }));
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    if (!isAdvancedMode) {
      // Switching to advanced mode
      setRawCron(cronExpression);
    } else {
      // Switching to visual mode - parse raw input
      const parsed = parseCronExpression(rawCron);
      if (parsed) {
        setFields(parsed);
        setParseError('');
      } else {
        setParseError('Cannot parse CRON expression. Please fix the format.');
        // Don't switch mode if invalid
        return;
      }
    }
    setIsAdvancedMode(!isAdvancedMode);
  };

  // Handle raw CRON input
  const handleRawCronChange = (e) => {
    const newValue = e.target.value;
    setRawCron(newValue);

    // Try to parse for validation
    const parsed = parseCronExpression(newValue);
    if (parsed) {
      setParseError('');
    } else {
      setParseError('Invalid CRON format (expected 5 or 6 fields separated by spaces)');
    }
  };

  // Quick presets
  const presets = [
    { label: 'Every 30 seconds', value: '*/30 * * * * *' },
    { label: 'Every minute', value: '0 * * * * *' },
    { label: 'Every 5 minutes', value: '0 */5 * * * *' },
    { label: 'Every hour', value: '0 0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 0 * * *' },
    { label: 'Weekday at 9 AM', value: '0 0 9 * * 1-5' },
    { label: 'Monthly (1st)', value: '0 0 0 1 * *' }
  ];

  const handlePresetClick = (presetValue) => {
    const parsed = parseCronExpression(presetValue);
    if (parsed) {
      setFields(parsed);
      setRawCron(presetValue);
      setParseError('');
      if (isAdvancedMode) {
        setIsAdvancedMode(false);
      }
    }
  };

  // Month and day of week options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const dayOfWeekOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];

  return (
    <div className="cron-builder">
      {/* Header */}
      <div className="cron-builder-header">
        <h3>CRON Schedule Builder</h3>

        {/* Mode Toggle */}
        <button
          type="button"
          className="mode-toggle-btn"
          onClick={handleModeToggle}
          disabled={disabled}
        >
          {isAdvancedMode ? '✓ Visual Builder' : '✎ Advanced Mode'}
        </button>
      </div>

      {/* Quick Presets */}
      <div className="cron-presets">
        <p className="presets-label">Quick Presets:</p>
        <div className="preset-buttons-grid">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className="preset-btn"
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              title={preset.value}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Builder Content */}
      <div className="cron-builder-content">
        {!isAdvancedMode ? (
          // Visual Builder Mode
          <div className="visual-builder">
            <p className="builder-hint">
              Configure each field. Format: second minute hour day-of-month month day-of-week
            </p>

            <div className="cron-fields-grid">
              <CronFieldBuilder
                fieldName="second"
                label="Second"
                field={fields.second}
                onChange={handleFieldChange}
                min={0}
                max={59}
              />

              <CronFieldBuilder
                fieldName="minute"
                label="Minute"
                field={fields.minute}
                onChange={handleFieldChange}
                min={0}
                max={59}
              />

              <CronFieldBuilder
                fieldName="hour"
                label="Hour"
                field={fields.hour}
                onChange={handleFieldChange}
                min={0}
                max={23}
              />

              <CronFieldBuilder
                fieldName="day"
                label="Day of Month"
                field={fields.day}
                onChange={handleFieldChange}
                min={1}
                max={31}
              />

              <CronFieldBuilder
                fieldName="month"
                label="Month"
                field={fields.month}
                onChange={handleFieldChange}
                min={1}
                max={12}
                options={monthOptions}
              />

              <CronFieldBuilder
                fieldName="dayOfWeek"
                label="Day of Week"
                field={fields.dayOfWeek}
                onChange={handleFieldChange}
                min={0}
                max={6}
                options={dayOfWeekOptions}
              />
            </div>
          </div>
        ) : (
          // Advanced Text Mode
          <div className="advanced-builder">
            <label htmlFor="raw-cron" className="advanced-label">
              CRON Expression (6-field or 5-field format)
            </label>
            <input
              type="text"
              id="raw-cron"
              className="raw-cron-input"
              value={rawCron}
              onChange={handleRawCronChange}
              placeholder="0 0 0 * * *"
              disabled={disabled}
            />
            <small className="field-hint">
              6-field: second minute hour day-of-month month day-of-week
              <br />
              5-field: minute hour day-of-month month day-of-week (second defaults to 0)
            </small>
            {parseError && <div className="parse-error">{parseError}</div>}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="cron-preview">
        <div className="preview-section">
          <label>Generated Expression:</label>
          <div className="preview-value cron-expression">
            {isAdvancedMode ? rawCron || '(invalid)' : cronExpression}
          </div>
        </div>

        <div className="preview-section">
          <label>In Plain English:</label>
          <div className="preview-value human-readable">
            {humanReadable}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronBuilder;
