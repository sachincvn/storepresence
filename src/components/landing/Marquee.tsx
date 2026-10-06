import { container, Icon, type IconName } from "./Section";

const items: { icon: IconName; label: string }[] = [
  { icon: "phone", label: "Phone screenshots" },
  { icon: "tablet", label: "iPad screenshots" },
  { icon: "banner", label: "Feature graphic" },
  { icon: "type", label: "Headlines" },
  { icon: "palette", label: "Theme colors" },
  { icon: "frame", label: "Device frames" },
  { icon: "image", label: "Backgrounds" },
  { icon: "zip", label: "ZIP export" },
];

export function Marquee() {
  return (
    <section aria-label="What you can make" className="reveal pt-12 pb-4 sm:pt-16">
      <div className={`${container} flex flex-col gap-6 md:flex-row md:items-center md:gap-10`}>
        <p className="shrink-0 text-[15px] leading-6 font-medium">
          One editor.
          <br />
          <span className="text-muted">Every store asset.</span>
        </p>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <ul className="marquee flex w-max">
            {[0, 1].map((copy) =>
              items.map((item) => (
                <li
                  key={`${copy}-${item.label}`}
                  aria-hidden={copy === 1 || undefined}
                  className="flex items-center gap-2.5 px-6 text-lg whitespace-nowrap text-ink/45"
                >
                  <Icon name={item.icon} className="size-5" />
                  {item.label}
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
