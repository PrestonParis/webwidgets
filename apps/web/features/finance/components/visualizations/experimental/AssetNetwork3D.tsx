'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei';
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import type { FinanceAccount } from '@/features/finance/types/finance';

const TYPE_COLORS: Record<string, string> = {
    cash: '#10b981',
    checking: '#34d399',
    savings: '#6ee7b7',
    investment: '#3b82f6',
    credit: '#ef4444',
    loan: '#f97316',
    other: '#8b5cf6',
};

interface NetworkData {
    hubs: Array<{ type: string; color: string; pos: THREE.Vector3 }>;
    nodes: Array<{
        id: string;
        label: string;
        value: number;
        color: string;
        pos: THREE.Vector3;
        hubIdx: number;
    }>;
}

function buildNetwork(accounts: FinanceAccount[]): NetworkData {
    const types = [...new Set(accounts.map((a) => a.type))];
    const hubs = types.map((type, i) => {
        const angle = (i / types.length) * Math.PI * 2;
        return {
            type,
            color: TYPE_COLORS[type] ?? '#71717a',
            pos: new THREE.Vector3(
                Math.cos(angle) * 3.5,
                0,
                Math.sin(angle) * 3.5,
            ),
        };
    });

    const maxBal = Math.max(...accounts.map((a) => Math.abs(a.balance)), 1);
    const nodes = accounts.flatMap((acc) => {
        const hubIdx = hubs.findIndex((h) => h.type === acc.type);
        const hub = hubs[hubIdx];
        if (!hub) return [];
        const jitter = () => (Math.random() - 0.5) * 1.8;
        return [
            {
                id: acc.id,
                label: acc.name,
                value: 0.1 + (Math.abs(acc.balance) / maxBal) * 0.6,
                color: TYPE_COLORS[acc.type] ?? '#71717a',
                pos: hub.pos
                    .clone()
                    .add(new THREE.Vector3(jitter(), jitter(), jitter())),
                hubIdx,
            },
        ];
    });
    return { hubs, nodes };
}

function NetworkNode({
    label,
    value,
    color,
    position,
    isHub,
}: {
    label: string;
    value: number;
    color: string;
    position: THREE.Vector3;
    isHub: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const col = new THREE.Color(color);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        const target = hovered ? value * 1.3 : value;
        meshRef.current.scale.lerp(
            new THREE.Vector3(target, target, target),
            0.15,
        );
        if (isHub) meshRef.current.rotation.y += delta * 0.4;
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                scale={value}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <sphereGeometry args={[1, isHub ? 20 : 14, isHub ? 20 : 14]} />
                <meshStandardMaterial
                    color={col}
                    emissive={col}
                    emissiveIntensity={hovered ? 1.1 : isHub ? 0.55 : 0.3}
                    roughness={0.1}
                    metalness={0.55}
                    transparent
                    opacity={isHub ? 0.9 : 0.75}
                />
            </mesh>
            {(hovered || isHub) && (
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <Text
                        position={[0, value + 0.3, 0]}
                        fontSize={isHub ? 0.22 : 0.16}
                        color="white"
                        anchorX="center"
                        anchorY="bottom"
                        maxWidth={3}
                    >
                        {label}
                    </Text>
                </Billboard>
            )}
        </group>
    );
}

function NetworkEdges({
    nodes,
    hubs,
}: {
    nodes: NetworkData['nodes'];
    hubs: NetworkData['hubs'];
}) {
    const geometry = useMemo(() => {
        const positions: number[] = [];
        for (const node of nodes) {
            const hub = hubs[node.hubIdx];
            if (!hub) continue;
            positions.push(
                node.pos.x,
                node.pos.y,
                node.pos.z,
                hub.pos.x,
                hub.pos.y,
                hub.pos.z,
            );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3),
        );
        return geo;
    }, [nodes, hubs]);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#3f3f46" transparent opacity={0.3} />
        </lineSegments>
    );
}

interface AssetNetwork3DProps {
    accounts: FinanceAccount[];
    height?: number;
}

export function AssetNetwork3D({
    accounts,
    height = 400,
}: AssetNetwork3DProps) {
    const [, setSelected] = useState<string | null>(null);
    const network = useMemo(() => buildNetwork(accounts), [accounts]);

    if (accounts.length === 0) {
        return (
            <div
                className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950"
                style={{ height }}
            >
                <p className="text-zinc-500 text-sm">
                    Add accounts to render the asset network
                </p>
            </div>
        );
    }

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"
            style={{ height }}
        >
            <Canvas
                camera={{ position: [0, 4, 10], fov: 52 }}
                gl={{ antialias: true }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.15} />
                    <pointLight position={[8, 8, 8]} intensity={0.85} />
                    <pointLight
                        position={[-6, -4, -6]}
                        intensity={0.4}
                        color="#3b82f6"
                    />
                    <Stars
                        radius={55}
                        depth={28}
                        count={1000}
                        factor={3.5}
                        fade
                        speed={0.4}
                    />
                    <OrbitControls
                        enablePan={false}
                        minDistance={5}
                        maxDistance={22}
                    />
                    {network.hubs.map((hub) => (
                        <NetworkNode
                            key={`hub-${hub.type}`}
                            label={hub.type}
                            value={0.55}
                            color={hub.color}
                            position={hub.pos}
                            isHub
                        />
                    ))}
                    {network.nodes.map((node) => (
                        <NetworkNode
                            key={node.id}
                            label={node.label}
                            value={node.value}
                            color={node.color}
                            position={node.pos}
                            isHub={false}
                        />
                    ))}
                    <NetworkEdges nodes={network.nodes} hubs={network.hubs} />
                </Suspense>
            </Canvas>
            <div className="absolute top-3 left-3 pointer-events-none">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Asset Network · 3D
                </p>
                <p className="text-[9px] text-zinc-600 mt-0.5">
                    {accounts.length} accounts · {network.hubs.length} types ·
                    drag to rotate
                </p>
            </div>
        </div>
    );
}
