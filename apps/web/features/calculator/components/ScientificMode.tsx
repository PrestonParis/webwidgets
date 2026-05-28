'use client';

import { useState } from 'react';
import { CalcButton, BasicMode } from './BasicMode';
import type { CalcControls } from '../hooks/useCalculator';

interface ScientificModeProps {
    calc: CalcControls;
    compact?: boolean;
}

export function ScientificMode({ calc, compact = false }: ScientificModeProps) {
    const [secondMode, setSecondMode] = useState(false);
    const { appendToExpression, pushExpr, expression } = calc;

    function fn(f: string) {
        appendToExpression(`${f}(`);
    }
    function wrapExpr(f: string) {
        if (expression) pushExpr(`${f}(${expression})`);
        else appendToExpression(`${f}(`);
    }

    // Primary buttons (top panel)
    const primary = secondMode
        ? [
              {
                  label: 'x²',
                  action: () => pushExpr(`(${expression})^2`),
                  title: 'Square',
              },
              {
                  label: 'x³',
                  action: () => pushExpr(`(${expression})^3`),
                  title: 'Cube',
              },
              {
                  label: 'xʸ',
                  action: () => appendToExpression('^'),
                  title: 'Power',
              },
              { label: 'eˣ', action: () => fn('exp'), title: 'e^x' },
              {
                  label: '10ˣ',
                  action: () => pushExpr(`10^(${expression})`),
                  title: '10^x',
              },
              {
                  label: '2ⁿᵈ',
                  action: () => setSecondMode(false),
                  variant: 'op' as const,
                  title: 'Primary functions',
              },
              {
                  label: '1/x',
                  action: () => pushExpr(`1/(${expression})`),
                  title: 'Reciprocal',
              },
              {
                  label: '√x',
                  action: () => wrapExpr('sqrt'),
                  title: 'Square root',
              },
              {
                  label: '∛x',
                  action: () => wrapExpr('cbrt'),
                  title: 'Cube root',
              },
              {
                  label: 'ʸ√x',
                  action: () => appendToExpression('nrt('),
                  title: 'y-th root: nrt(y, x)',
              },
          ]
        : [
              { label: 'sin', action: () => fn('sin'), title: 'Sine' },
              { label: 'cos', action: () => fn('cos'), title: 'Cosine' },
              { label: 'tan', action: () => fn('tan'), title: 'Tangent' },
              { label: 'ln', action: () => fn('ln'), title: 'Natural log' },
              { label: 'log', action: () => fn('log'), title: 'Log base 10' },
              {
                  label: '2ⁿᵈ',
                  action: () => setSecondMode(true),
                  variant: 'op' as const,
                  title: 'Secondary functions',
              },
              { label: 'asin', action: () => fn('asin'), title: 'Arc sine' },
              { label: 'acos', action: () => fn('acos'), title: 'Arc cosine' },
              { label: 'atan', action: () => fn('atan'), title: 'Arc tangent' },
              { label: 'log₂', action: () => fn('log2'), title: 'Log base 2' },
          ];

    const misc = [
        {
            label: '(',
            action: () => appendToExpression('('),
            title: 'Open parenthesis',
        },
        {
            label: ')',
            action: () => appendToExpression(')'),
            title: 'Close parenthesis',
        },
        {
            label: 'π',
            action: () => appendToExpression('pi'),
            title: 'Pi constant',
        },
        {
            label: 'e',
            action: () => appendToExpression('e'),
            title: "Euler's number",
        },
        {
            label: 'x!',
            action: () => appendToExpression('!'),
            title: 'Factorial',
        },
        {
            label:
                calc.settings.angleUnit === 'deg'
                    ? 'DEG'
                    : calc.settings.angleUnit === 'rad'
                      ? 'RAD'
                      : 'GRAD',
            action: () => {
                const next =
                    calc.settings.angleUnit === 'deg'
                        ? 'rad'
                        : calc.settings.angleUnit === 'rad'
                          ? 'grad'
                          : 'deg';
                calc.setAngleUnit(next);
            },
            variant: 'fn' as const,
            title: 'Toggle angle unit',
        },
        {
            label: 'EE',
            action: () => appendToExpression('e'),
            title: 'Scientific notation exponent',
        },
        { label: 'abs', action: () => fn('abs'), title: 'Absolute value' },
        { label: 'mod', action: () => fn('mod'), title: 'Modulo: mod(a, b)' },
        {
            label: 'φ',
            action: () => appendToExpression('phi'),
            title: 'Golden ratio',
        },
    ];

    return (
        <div className="space-y-1.5">
            {/* Scientific panel */}
            <div className="grid grid-cols-5 gap-1.5">
                {primary.map((btn, i) => (
                    <CalcButton key={i} btn={btn} compact />
                ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
                {misc.map((btn, i) => (
                    <CalcButton key={i} btn={btn} compact />
                ))}
            </div>

            {/* Base keypad */}
            <BasicMode calc={calc} compact={compact} />
        </div>
    );
}
