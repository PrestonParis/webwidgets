'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei';
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import type { FinanceAccount } from '@/features/finance/types/finance';
import type { WatchlistItemWithLatest } from '@/features/finance/types/watchlist';

const ASSET_COLORS: Record<string, string> = {
    cash: '#10b981',
    checking: '#34d399',
    savings: '#6ee7b7',
    investment: '#3b82f6',
    credit: '#ef4444',
    loan: '#f97316',
    other: '#8b5cf6',
    stock: '#60a5fa',
    etf: '#93c5fd',
    crypto: '#f59e0b',
    real_estate: '#84cc16',
    index: '#a78bfa',
};

interface Node {
    id: string;
    label: string;
    value: number;
    color: string;
    type: string;
    position: [number, number, number];
}

function buildNodes(
    accounts: FinanceAccount[],
    watchlist: WatchlistItemWithLatest[],
): Node[] {
    const nodes: Node[] = [];
    const maxVal = Math.max(
        ...accounts.map((a) => Math.abs(a.balance)),
        ...watchlist.map((w) => w.latest?.value ?? 0),
        1,
    );

    accounts.forEach((acc, i) => {
        const theta = (i / accounts.length) * Math.PI * 2;
        const r = 3 + Math.random() * 1.5;
        nodes.push({
            id: acc.id,
            label: acc.name,
            value: Math.abs(acc.balance),
            color: ASSET_COLORS[acc.type] ?? '#71717a',
            type: acc.type,
            position: [
                r * Math.cos(theta),
                (Math.random() - 0.5) * 2,
                r * Math.sin(theta),
            ],
        });
    });

    watchlist.forEach((item, i) => {
        const theta = (i / watchlist.length) * Math.PI * 2 + Math.PI;
        const r = 5 + Math.random() * 2;
        const val = item.latest?.value ?? 0;
        nodes.push({
            id: item.id,
            label: item.displayName,
            value: val,
            color: ASSET_COLORS[item.assetType] ?? '#60a5fa',
            type: item.assetType,
            position: [
                r * Math.cos(theta),
                (Math.random() - 0.5) * 3,
                r * Math.sin(theta),
            ],
        });
    });

    return nodes.map((n) => ({
        ...n,
        value: Math.max(0.15, (n.value / maxVal) * 1.5),
    }));
}

function GlowSphere({
    node,
    onClick,
}: {
    node: Node;
    onClick: (n: Node) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += delta * 0.3;
        const target = hovered ? node.value * 1.25 : node.value;
        meshRef.current.scale.lerp(
            new THREE.Vector3(target, target, target),
            0.12,
        );
    });

    const color = new THREE.Color(node.color);

    return (
        <group position={node.position}>
            <mesh
                ref={meshRef}
                scale={node.value}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onClick={() => onClick(node)}
            >
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 1.0 : 0.35}
                    roughness={0.1}
                    metalness={0.6}
                    transparent
                    opacity={hovered ? 0.95 : 0.75}
                />
            </mesh>
            {hovered && (
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <Text
                        position={[0, node.value + 0.4, 0]}
                        fontSize={0.22}
                        color="white"
                        anchorX="center"
                        anchorY="bottom"
                        maxWidth={3}
                    >
                        {node.label}
                    </Text>
                </Billboard>
            )}
            {/* Glow ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={node.value * 1.35}>
                <torusGeometry args={[1, 0.04, 8, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.6 : 0.15}
                />
            </mesh>
        </group>
    );
}

function OrbitingRing() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.z += delta * 0.08;
    });
    return (
        <mesh ref={ref} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[6.5, 0.015, 4, 128]} />
            <meshBasicMaterial color="#3f3f46" transparent opacity={0.4} />
        </mesh>
    );
}

function CameraAutoRotate() {
    useFrame(({ camera, clock }) => {
        const t = clock.getElapsedTime() * 0.04;
        camera.position.x = Math.sin(t) * 11;
        camera.position.z = Math.cos(t) * 11;
        camera.lookAt(0, 0, 0);
    });
    return null;
}

interface PortfolioGalaxyProps {
    accounts: FinanceAccount[];
    watchlist?: WatchlistItemWithLatest[];
    height?: number;
    autoRotate?: boolean;
    formatAmount?: (n: number) => string;
}

export function PortfolioGalaxy({
    accounts,
    watchlist = [],
    height = 440,
    autoRotate = true,
    formatAmount,
}: PortfolioGalaxyProps) {
    const nodes = useMemo(
        () => buildNodes(accounts, watchlist),
        [accounts, watchlist],
    );
    const [selected, setSelected] = useState<Node | null>(null);
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));

    if (nodes.length === 0) {
        return (
            <div
                className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950"
                style={{ height }}
            >
                <div className="text-center">
                    <p className="text-zinc-400 text-sm">
                        Add accounts or watchlist items to populate the galaxy
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"
            style={{ height }}
        >
            <Canvas
                camera={{ position: [0, 3, 11], fov: 55 }}
                gl={{ antialias: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.15} />
                    <pointLight position={[10, 10, 10]} intensity={0.8} />
                    <pointLight
                        position={[-10, -5, -10]}
                        intensity={0.4}
                        color="#3b82f6"
                    />
                    <Stars
                        radius={60}
                        depth={30}
                        count={1200}
                        factor={4}
                        fade
                        speed={0.5}
                    />
                    {autoRotate ? (
                        <CameraAutoRotate />
                    ) : (
                        <OrbitControls
                            enablePan={false}
                            minDistance={5}
                            maxDistance={20}
                        />
                    )}
                    {nodes.map((node) => (
                        <GlowSphere
                            key={node.id}
                            node={node}
                            onClick={setSelected}
                        />
                    ))}
                    <OrbitingRing />
                </Suspense>
            </Canvas>

            {/* Label overlay */}
            <div className="absolute top-3 left-3 pointer-events-none">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Portfolio Galaxy
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">
                    {nodes.length} assets · hover to inspect
                </p>
            </div>

            {selected && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 text-xs backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: selected.color }}
                        />
                        <div>
                            <p className="font-semibold text-zinc-100">
                                {selected.label}
                            </p>
                            <p className="text-zinc-400">
                                {selected.type} · {fmt(selected.value)}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className="ml-4 text-zinc-600 hover:text-zinc-400"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
