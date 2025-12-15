import React from 'react';

/**
 * Reusable CRON field builder component
 * Displays a dropdown to select field type and conditional inputs
 */
const CronFieldBuilder = ({
  fieldName,
  field,
  onChange,
  label,
  min = 0,
  max = 59,
  options = [] // For dropdowns (e.g., month names, day names)
}) => {
  const handleTypeChange = (newType) => {
    const newField = {
      ...field,
      type: newType,
      value: newType === 'every' ? '*' : ''
    };
    onChange(fieldName, newField);
  };

  const handleValueChange = (key, value) => {
    const newField = { ...field, [key]: value };

    // Regenerate the CRON value based on type
    switch (field.type) {
      case 'specific':
        newField.value = value;
        break;
      case 'everyN':
        newField.value = `*/${value}`;
        break;
      case 'range':
        newField.value = `${newField.from || min}-${newField.to || max}`;
        if (newField.step) newField.value += `/${newField.step}`;
        break;
      case 'list':
        newField.value = value;
        break;
      default:
        break;
    }

    onChange(fieldName, newField);
  };

  return (
    <div className="cron-field-builder">
      <label className="cron-field-label">{label}</label>

      <div className="cron-field-controls">
        {/* Type Selector Dropdown */}
        <select
          className="cron-field-type-select"
          value={field.type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <option value="every">Every (*)</option>
          <option value="specific">Specific value</option>
          <option value="everyN">Every N (*/n)</option>
          <option value="range">Range (from-to)</option>
          <option value="list">List (1,2,3)</option>
        </select>

        {/* Conditional Inputs Based on Type */}
        {field.type === 'specific' &&
          (options.length > 0 ? (
            <select
              className="cron-field-input"
              value={field.value}
              onChange={(e) => handleValueChange('value', e.target.value)}
            >
              <option value="">-- Select --</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              className="cron-field-input"
              min={min}
              max={max}
              value={field.value}
              onChange={(e) => handleValueChange('value', e.target.value)}
              placeholder={`${min}-${max}`}
            />
          ))}

        {field.type === 'everyN' && (
          <div className="cron-field-input-group">
            <span>Every</span>
            <input
              type="number"
              className="cron-field-input"
              min="1"
              max={max}
              value={field.step}
              onChange={(e) => handleValueChange('step', e.target.value)}
              placeholder="N"
            />
          </div>
        )}

        {field.type === 'range' && (
          <div className="cron-field-input-group">
            <input
              type="number"
              className="cron-field-input-small"
              min={min}
              max={max}
              value={field.from}
              onChange={(e) => handleValueChange('from', e.target.value)}
              placeholder="From"
            />
            <span>to</span>
            <input
              type="number"
              className="cron-field-input-small"
              min={min}
              max={max}
              value={field.to}
              onChange={(e) => handleValueChange('to', e.target.value)}
              placeholder="To"
            />
            <span className="optional">(step:</span>
            <input
              type="number"
              className="cron-field-input-small"
              min="1"
              value={field.step}
              onChange={(e) => handleValueChange('step', e.target.value)}
              placeholder="1"
            />
            <span className="optional">)</span>
          </div>
        )}

        {field.type === 'list' && (
          <input
            type="text"
            className="cron-field-input"
            value={field.list}
            onChange={(e) => handleValueChange('list', e.target.value)}
            placeholder="1,2,3,4,5"
          />
        )}
      </div>

      {/* Current Value Display */}
      <div className="cron-field-value">
        <span className="cron-value-badge">{field.value || '*'}</span>
      </div>
    </div>
  );
};

export default CronFieldBuilder;
