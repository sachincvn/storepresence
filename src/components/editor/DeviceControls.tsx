"use client";

import type { Dispatch } from "react";
import type { Project } from "@/types/project";
import type { EditorAction } from "./editorState";

type Model = NonNullable<Project["deviceModel"]>;

const MODELS: { id: Model | "template" | "none"; label: string }[] = [
  { id: "template", label: "Template" },
  { id: "phone", label: "Punch-hole" },
  { id: "phone-island", label: "Island" },
  { id: "flat", label: "Flat" },
  { id: "none", label: "None" },
];

const ANGLES: { id: NonNullable<Project["deviceAngle"]> | "template"; label: string }[] = [
  { id: "template", label: "Template" },
  { id: "straight", label: "Straight" },
  { id: "left", label: "Turn left" },
  { id: "right", label: "Turn right" },
  { id: "flat", label: "Lay flat" },
  { id: "iso", label: "Isometric" },
];

const COLORS = [
  { value: "#16131F", label: "Black" },
  { value: "#E3E5EA", label: "Silver" },
  { value: "#FFFFFF", label: "White" },
  { value: "#3D3A4B", label: "Graphite" },
  { value: "#E9D5C3", label: "Sand" },
];

/** Device model and frame color, applied to every slide that shows a device. */
export function DeviceControls({ project, dispatch }: { project: Project; dispatch: Dispatch<EditorAction> }) {
  const selected = !project.deviceFrame ? "none" : (project.deviceModel ?? "template");
  const showColors = project.deviceFrame && project.deviceModel !== "flat";

  const pick = (id: (typeof MODELS)[number]["id"]) => {
    if (id === "none") return dispatch({ type: "deviceFrame", on: false });
    if (!project.deviceFrame) dispatch({ type: "deviceFrame", on: true });
    dispatch({ type: "device", model: id === "template" ? undefined : id });
  };

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="sr-only">Device model</legend>
        <div className="flex flex-wrap gap-1.5">
          {MODELS.map((m) => (
            <label
              key={m.id}
              className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${
                selected === m.id ? "border-blue bg-white ring-1 ring-blue" : "border-line bg-white hover:border-ink/30"
              }`}
            >
              <input type="radio" name="device-model" checked={selected === m.id} onChange={() => pick(m.id)} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Angle</legend>
        <div className="flex flex-wrap gap-1.5">
          {ANGLES.map((a) => {
            const checked = (project.deviceAngle ?? "template") === a.id;
            return (
              <label
                key={a.id}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${
                  checked ? "border-blue bg-white ring-1 ring-blue" : "border-line bg-white hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="device-angle"
                  checked={checked}
                  onChange={() => dispatch({ type: "deviceAngle", angle: a.id === "template" ? undefined : a.id })}
                  className="sr-only"
                />
                {a.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {showColors && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Frame color</legend>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={!project.deviceColor}
              onClick={() => dispatch({ type: "device", color: null })}
              className={`h-8 rounded-full border px-3 text-xs font-bold ${!project.deviceColor ? "border-blue ring-1 ring-blue" : "border-line"} bg-white`}
            >
              Template
            </button>
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={`${c.label} frame`}
                aria-pressed={project.deviceColor === c.value}
                onClick={() => dispatch({ type: "device", color: c.value })}
                className={`size-8 rounded-full ring-offset-2 ${project.deviceColor === c.value ? "ring-2 ring-blue" : "ring-1 ring-ink/15"}`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
