"use client";

import { ChevronRight, ChevronDown, Check } from "lucide-react";
import type { MarketConfig } from "@/lib/samsara/config";

interface FlowDiagramProps {
  market: MarketConfig;
  activeStep: 0 | 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const NAV_TOKEN_PROPERTIES = [
  "Has a minimum floor price",
  "Floor price keeps rising over time",
  "Market price can't go below floor",
  "Better to buy when market is close to floor",
];

const BORROW_PROPERTIES = [
  "Zero interest",
  "Zero liquidation risk",
  "Zero repayment pressure",
  "Repay whenever — or never",
  "Borrow more over time as floor rises",
];

function StepCard({
  stepNumber,
  label,
  from,
  to,
  active,
  completed,
  properties,
  onClick,
}: {
  stepNumber: number;
  label: string;
  from: string;
  to: string;
  active: boolean;
  completed: boolean;
  properties?: string[];
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <button
        onClick={onClick}
        className={`flex flex-col gap-1.5 p-3 rounded-lg border transition-all text-left cursor-pointer h-full ${
          active
            ? "border-accent shadow-[0_0_12px_rgba(249,115,22,0.25)] bg-surface"
            : completed
              ? "border-accent/30 bg-surface"
              : "border-border bg-surface hover:border-secondary"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
              completed
                ? "bg-accent/20 text-accent"
                : active
                  ? "bg-accent text-bg"
                  : "bg-border text-secondary"
            }`}
          >
            {completed ? <Check size={10} /> : stepNumber}
          </span>
          <span className={`text-xs font-medium ${active ? "text-accent" : "text-secondary"}`}>
            Step {stepNumber}
          </span>
        </div>
        <span className={`text-sm font-semibold ${active ? "text-primary" : "text-secondary"}`}>
          {label}
        </span>
        <span className="text-xs text-tertiary">
          {from} → {to}
        </span>
      </button>

      {properties && properties.length > 0 && (
        <ul
          className={`flex flex-col gap-1 pl-3 transition-all overflow-hidden ${
            active ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ transitionDuration: "300ms" }}
        >
          {properties.map((prop) => (
            <li key={prop} className="text-xs text-secondary flex items-start gap-1.5">
              <span className="text-accent mt-0.5">•</span>
              {prop}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Connector({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex items-center justify-center py-1">
        <ChevronDown size={14} className="text-tertiary" />
      </div>
    );
  }
  return (
    <div className="hidden md:flex items-center px-1 shrink-0 self-start mt-7">
      <ChevronRight size={14} className="text-tertiary" />
    </div>
  );
}

export function FlowDiagram({ market, activeStep, onStepClick }: FlowDiagramProps) {
  const isCompleted = (step: number) => activeStep > step;
  const isActive = (step: number) => activeStep === step;

  const steps = [
    {
      stepNumber: 1 as const,
      label: `Buy ${market.name}`,
      from: market.baseName,
      to: market.name,
      properties: NAV_TOKEN_PROPERTIES,
    },
    {
      stepNumber: 2 as const,
      label: `Borrow ${market.baseName}`,
      from: market.name,
      to: market.baseName,
      properties: BORROW_PROPERTIES,
    },
    {
      stepNumber: 3 as const,
      label: "Sell for USDC",
      from: `Borrowed ${market.baseName}`,
      to: "USDC",
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-tertiary mb-1">How it works</span>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={step.stepNumber} className="contents">
            <StepCard
              {...step}
              active={isActive(step.stepNumber)}
              completed={isCompleted(step.stepNumber)}
              onClick={() => onStepClick?.(step.stepNumber)}
            />
            {i < steps.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="flex md:hidden flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.stepNumber}>
            <StepCard
              {...step}
              active={isActive(step.stepNumber)}
              completed={isCompleted(step.stepNumber)}
              onClick={() => onStepClick?.(step.stepNumber)}
            />
            {i < steps.length - 1 && <Connector vertical />}
          </div>
        ))}
      </div>
    </div>
  );
}
