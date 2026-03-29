import { T } from '../../constants/tokens';

export default function Avatar({ name, size = 40, bg = T.navy600, color = '#c8d8f4' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 font-display tracking-[0.5px]"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.32, color }}
    >
      {initials}
    </div>
  );
}
