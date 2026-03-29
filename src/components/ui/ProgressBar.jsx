import { barHue } from '../../utils/colorHelpers';

export default function ProgressBar({ pct, height = 5 }) {
  return (
    <div
      className="rounded-full bg-gray-200 overflow-hidden relative"
      style={{ height }}
    >
      <div
        className="absolute inset-0 rounded-full transition-[right] duration-500 ease-in-out"
        style={{ right: `${100 - Math.min(pct, 100)}%`, background: barHue(pct) }}
      />
    </div>
  );
}
