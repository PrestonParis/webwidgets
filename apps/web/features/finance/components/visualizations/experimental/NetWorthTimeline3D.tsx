'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei';
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import type { NetWorthSnapshot } from '@/features/finance/components/charts/FinanceLineChart';

interface RibbonProps {
    snapshots: NetWorthSnapshot[];
    minVal: number;
    maxVal: number;
    onHover: (idx: number | null) => void;
}

function NetWorthRibbon({ snapshots, minVal, maxVal, onHover }: RibbonProps) {
    const groupRef = useRef<THREE.Group>(null);
    const range = maxVal - minVal || 1;
    const spanX = 10;

    const { tubes, points } = useMemo(() => {
        const pts = snapshots.map((s, i) => {
            const x = (i / (snapshots.length - 1)) * spanX - spanX / 2;
            const y = ((s.netWorth - minVal) / range) * 4 - 1;
            return new THREE.Vector3(x, y, 0);
        });

        const segments: Array<{
            curve: THREE.CatmullRomCurve3;
            color: string;
        }> = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const s0 = snapshots[i];
            const s1 = snapshots[i + 1];
            if (!p0 || !p1 || !s0 || !s1) continue;
            const mid = (s0.netWorth + s1.netWorth) / 2;
            const normalized = (mid - minVal) / range;
            const color =
                normalized > 0.5
                    ? '#10b981'
                    : normalized > 0.25
                      ? '#f59e0b'
                      : '#ef4444';
            segments.push({
                curve: new THREE.CatmullRomCurve3([p0, p1]),
                color,
            });
        }
        return { tubes: segments, points: pts };
    }, [snapshots, minVal, range, spanX]);

    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.012;
    });

    return (
        <group ref={groupRef}>
            {tubes.map(({ curve, color }, i) => (
                <mesh
                    key={i}
                    onPointerEnter={() => onHover(i)}
                    onPointerLeave={() => onHover(null)}
                >
                    <tubeGeometry args={[curve, 4, 0.055, 8, false]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.4}
                        roughness={0.2}
                        metalness={0.5}
                    />
                </mesh>
            ))}
            {points.map((pt, i) => {
                const snap = snapshots[i];
                if (!snap) return null;
                const normalized = (snap.netWorth - minVal) / range;
                const color =
                    normalized > 0.5
                        ? '#10b981'
                        : normalized > 0.25
                          ? '#f59e0b'
                          : '#ef4444';
                return (
                    <mesh key={`pt-${i}`} position={pt}>
                        <sphereGeometry args={[0.12, 12, 12]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                );
            })}
            {points.map((pt, i) => {
                const snap = snapshots[i];
                if (!snap) return null;
                return (
                    <Billboard
                        key={`lbl-${i}`}
                        follow
                        position={[pt.x, pt.y + 0.35, pt.z]}
                    >
                        <Text
                            fontSize={0.18}
                            color="#a1a1aa"
                            anchorX="center"
                            anchorY="bottom"
                        >
                            {snap.date.slice(0, 7)}
                        </Text>
                    </Billboard>
                );
            })}
        </group>
    );
}

interface NetWorthTimeline3DProps {
    snapshots: NetWorthSnapshot[];
    height?: number;
    formatAmount?: ((n: number) => string) | undefined;
}

export function NetWorthTimeline3D({
    snapshots,
    height = 380,
    formatAmount,
}: NetWorthTimeline3DProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));

    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const allVals = sorted.flatMap((s) => [
        s.netWorth,
        s.assets,
        s.liabilities,
    ]);
    const minVal = Math.min(...allVals, 0);
    const maxVal = Math.max(...allVals, 1);

    if (sorted.length < 2) {
        return (
            <div
                className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950"
                style={{ height }}
            >
                <p className="text-zinc-500 text-sm">
                    Need at least 2 snapshots to render timeline
                </p>
            </div>
        );
    }

    const hovered =
        hoveredIdx !== null && hoveredIdx < sorted.length
            ? (sorted[hoveredIdx] ?? null)
            : null;

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"
            style={{ height }}
        >
            <Canvas
                camera={{ position: [0, 2, 9], fov: 50 }}
                gl={{ antialias: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.2} />
                    <pointLight position={[5, 8, 5]} intensity={0.9} />
                    <pointLight
                        position={[-5, -4, -5]}
                        intensity={0.4}
                        color="#3b82f6"
                    />
                    <Stars
                        radius={50}
                        depth={25}
                        count={800}
                        factor={3}
                        fade
                        speed={0.4}
                    />
                    <NetWorthRibbon
                        snapshots={sorted}
                        minVal={minVal}
                        maxVal={maxVal}
                        onHover={setHoveredIdx}
                    />
                    <OrbitControls
                        enablePan={false}
                        minDistance={4}
                        maxDistance={18}
                    />
                </Suspense>
            </Canvas>
            <div className="absolute top-3 left-3 pointer-events-none">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Net Worth Timeline · 3D
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">
                    {sorted.length} snapshots · drag to rotate
                </p>
            </div>
            {hovered && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-xs backdrop-blur-sm">
                    <p className="text-zinc-400 mb-1">{hovered.date}</p>
                    <div className="flex gap-4">
                        <div>
                            <p className="text-zinc-500 text-[10px]">
                                Net worth
                            </p>
                            <p className="text-sky-300 font-semibold">
                                {fmt(hovered.netWorth)}
                            </p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px]">Assets</p>
                            <p className="text-emerald-400 font-semibold">
                                {fmt(hovered.assets)}
                            </p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px]">
                                Liabilities
                            </p>
                            <p className="text-red-400 font-semibold">
                                {fmt(hovered.liabilities)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
