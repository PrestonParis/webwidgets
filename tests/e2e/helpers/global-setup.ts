import { FullConfig } from '@playwright/test';
import { RuntimeManager, type StartupMode } from './runtime-manager';
import * as fs from 'fs';
import * as path from 'path';

function requestedStartupMode(): StartupMode | undefined {
    const mode = process.env.E2E_MODE;
    return mode === 'attached' || mode === 'managed' || mode === 'ci'
        ? mode
        : undefined;
}

async function probeRemoteTarget(baseURL: string) {
    const target = new URL(baseURL);
    if (['localhost', '127.0.0.1'].includes(target.hostname)) return false;
    const response = await fetch(target, {
        signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
        throw new Error(`Remote E2E target returned HTTP ${response.status}`);
    console.log('✅ Remote E2E target is reachable. Proceeding with tests.');
    return true;
}

/**
 * Global setup for Playwright tests
 *
 * This runs before all tests and:
 * - Performs runtime readiness diagnostics
 * - Verifies server availability
 * - Checks optional services
 * - Generates startup diagnostics report
 * - Fails fast if infrastructure is unavailable
 */
async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting Playwright test suite...');

    // Log environment info
    const baseURL =
        config.projects?.[0]?.use?.baseURL || 'http://localhost:3000';
    console.log(`📍 Base URL: ${baseURL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏗️  Workers: ${config.workers}`);
    console.log(`📦 E2E Mode: ${process.env.E2E_MODE || 'attached'}`);
    console.log('');

    if (await probeRemoteTarget(baseURL)) return;
    const mode = requestedStartupMode();

    // Create runtime manager
    const runtimeManager = new RuntimeManager({
        ...(mode && { mode }),
        port: parseInt(process.env.PORT || '3000', 10),
        startupTimeout: 120000, // 2 minutes
        readinessTimeout: 30000, // 30 seconds
    });

    // Perform startup diagnostics
    const diagnostics = await runtimeManager.performStartupDiagnostics();

    // Save diagnostics to file for later reference
    const diagnosticsPath = path.join(
        __dirname,
        '../reports/startup-diagnostics.json',
    );
    const reportsDir = path.dirname(diagnosticsPath);

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
    console.log(`📝 Startup diagnostics saved to: ${diagnosticsPath}`);

    // Fail if diagnostics failed
    if (!diagnostics.success) {
        console.error('');
        console.error(
            '❌ Runtime diagnostics failed. Cannot proceed with tests.',
        );
        console.error('');
        console.error('Errors:');
        for (const error of diagnostics.errors) {
            console.error(`  - ${error}`);
        }
        console.error('');
        console.error('Please ensure:');
        console.error('  1. Next.js server is running on the expected port');
        console.error('  2. Required services are available');
        console.error('  3. Environment variables are configured correctly');
        console.error('');
        console.error('For local development, run:');
        console.error('  npm run dev');
        console.error('  npm run test:e2e:attached');
        console.error('');
        console.error('For managed mode, run:');
        console.error('  npm run test:e2e:managed');
        console.error('');

        throw new Error('Runtime diagnostics failed. See errors above.');
    }

    console.log('');
    console.log('✅ Runtime diagnostics passed. Proceeding with tests.');
    console.log('');

    // Store runtime manager for cleanup
    const runtimeGlobal = globalThis as typeof globalThis & {
        __runtimeManager?: RuntimeManager;
    };
    runtimeGlobal.__runtimeManager = runtimeManager;
}

export default globalSetup;
