'use client';

const PRESET_COLORS = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Gray', value: '#f3f4f6' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Red', value: '#fee2e2' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Yellow', value: '#fef9c3' },
];

interface BackgroundColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function BackgroundColorPicker({ value, onChange }: BackgroundColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 mr-1">Background:</span>
      {PRESET_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          title={c.label}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
            ${value === c.value ? 'border-purple-500 scale-110' : 'border-gray-200'}
          `}
          style={
            c.value === 'transparent'
              ? {
                  backgroundImage: `
                    linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }
              : { backgroundColor: c.value }
          }
        />
      ))}

      {/* Custom color picker */}
      <label className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-400 overflow-hidden" title="Custom color">
        <input
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-bold">+</span>
      </label>
    </div>
  );
}
