import { spawn, ChildProcess } from 'child_process';
import * as net from 'net';
import fetch from 'node-fetch';

export type StartupMode = 'attached' | 'managed' | 'ci';

export interface ServiceStatus {
  name: string;
  required: boolean;
  reachable: boolean;
  port?: number;
  host?: string;
  error?: string;
  responseTime?: number;
}

export interface ReadinessCheck {
  name: string;
  url: string;
  required: boolean;
  status: 'pending' | 'pass' | 'fail';
  error?: string;
  responseTime?: number;
}

export interface StartupDiagnostics {
  mode: StartupMode;
  startTime: number;
  endTime: number;
  duration: number;
  serverStarted: boolean;
  serverPort: number;
  serverUrl: string;
  services: ServiceStatus[];
  readinessChecks: ReadinessCheck[];
  errors: string[];
  warnings: string[];
  success: boolean;
}

export class RuntimeManager {
  private serverProcess: ChildProcess | null = null;
  private startupMode: StartupMode;
  private serverPort: number;
  private serverHost: string;
  private startupTimeout: number;
  private readinessTimeout: number;
  private pollInterval: number;

  constructor(options: {
    mode?: StartupMode;
    port?: number;
    host?: string;
    startupTimeout?: number;
    readinessTimeout?: number;
    pollInterval?: number;
  } = {}) {
    this.startupMode = options.mode || this.detectMode();
    this.serverPort = options.port || 3000;
    this.serverHost = options.host || 'localhost';
    this.startupTimeout = options.startupTimeout || 60000; // 60 seconds
    this.readinessTimeout = options.readinessTimeout || 30000; // 30 seconds
    this.pollInterval = options.pollInterval || 500; // 500ms
  }

  /**
   * Detect startup mode from environment
   */
  private detectMode(): StartupMode {
    if (process.env.CI) return 'ci';
    if (process.env.E2E_MODE === 'managed') return 'managed';
    return 'attached'; // Default to attached for local development
  }

  /**
   * Check if port is already in use
   */
  private async isPortInUse(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.once('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  /**
   * Check if server is reachable
   */
  private async isServerReachable(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check service status
   */
  private async checkService(name: string, host: string, port: number, required: boolean): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const reachable = await this.isPortInUse(port, host);
      const responseTime = Date.now() - startTime;
      
      return {
        name,
        required,
        reachable,
        port,
        host,
        responseTime,
      };
    } catch (error) {
      return {
        name,
        required,
        reachable: false,
        port,
        host,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform readiness check
   */
  private async performReadinessCheck(name: string, url: string, required: boolean): Promise<ReadinessCheck> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.readinessTimeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        name,
        url,
        required,
        status: response.ok ? 'pass' : 'fail',
        responseTime,
      };
    } catch (error) {
      return {
        name,
        url,
        required,
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Start the Next.js server
   */
  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Starting Next.js server on port ${this.serverPort}...`);
      
      this.serverProcess = spawn('npm', ['run', 'dev:frontend'], {
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: this.serverPort.toString(),
        },
      });

      let output = '';
      
      this.serverProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
        
        // Check for ready signal
        if (text.includes('Ready') || text.includes('started') || text.includes('listening')) {
          console.log('✅ Server appears ready');
        }
      });

      this.serverProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.error(text);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.serverProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      // Wait for server to be ready
      const startTime = Date.now();
      const checkInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > this.startupTimeout) {
          clearInterval(checkInterval);
          reject(new Error(`Server startup timeout after ${this.startupTimeout}ms`));
          return;
        }

        const reachable = await this.isServerReachable(`http://${this.serverHost}:${this.serverPort}`, 2000);
        if (reachable) {
          clearInterval(checkInterval);
          console.log('✅ Server is reachable');
          resolve();
        }
      }, this.pollInterval);
    });
  }

  /**
   * Stop the server
   */
  private async stopServer(): Promise<void> {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (this.serverProcess.pid) {
        this.serverProcess.kill('SIGKILL');
      }
      
      this.serverProcess = null;
      console.log('✅ Server stopped');
    }
  }

  /**
   * Perform startup diagnostics
   */
  async performStartupDiagnostics(): Promise<StartupDiagnostics> {
    const startTime = Date.now();
    const diagnostics: StartupDiagnostics = {
      mode: this.startupMode,
      startTime,
      endTime: 0,
      duration: 0,
      serverStarted: false,
      serverPort: this.serverPort,
      serverUrl: `http://${this.serverHost}:${this.serverPort}`,
      services: [],
      readinessChecks: [],
      errors: [],
      warnings: [],
      success: false,
    };

    console.log(`\n🔍 Runtime Diagnostics (${this.startupMode} mode)`);
    console.log('=' .repeat(60));

    // Check if port is already in use
    const portInUse = await this.isPortInUse(this.serverPort, this.serverHost);
    
    if (portInUse) {
      console.log(`✅ Port ${this.serverPort} is already in use`);
      diagnostics.warnings.push(`Port ${this.serverPort} already in use - assuming server is running`);
    } else {
      console.log(`ℹ️  Port ${this.serverPort} is available`);
    }

    // Start server if in managed mode and port not in use
    if (this.startupMode === 'managed' && !portInUse) {
      try {
        await this.startServer();
        diagnostics.serverStarted = true;
      } catch (error) {
        diagnostics.errors.push(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        diagnostics.endTime = Date.now();
        diagnostics.duration = diagnostics.endTime - startTime;
        return diagnostics;
      }
    } else if (this.startupMode === 'attached' && !portInUse) {
      diagnostics.errors.push(`Attached mode requires server to be running on port ${this.serverPort}, but port is not in use`);
      diagnostics.endTime = Date.now();
      diagnostics.duration = diagnostics.endTime - startTime;
      return diagnostics;
    } else if (portInUse) {
      diagnostics.serverStarted = true; // Server already running
    }

    // Check optional services
    const services = [
      { name: 'Supabase', host: 'localhost', port: 54321, required: false },
      { name: 'Redis', host: 'localhost', port: 6379, required: false },
      { name: 'Go Worker', host: 'localhost', port: 8000, required: false },
      { name: 'ML Service', host: 'localhost', port: 8000, required: false },
    ];

    for (const service of services) {
      const status = await this.checkService(service.name, service.host, service.port, service.required);
      diagnostics.services.push(status);
      
      if (status.reachable) {
        console.log(`✅ ${service.name} reachable on ${service.host}:${service.port}`);
      } else {
        const msg = service.required 
          ? `❌ ${service.name} not reachable on ${service.host}:${service.port} (required)`
          : `⚠️  ${service.name} not reachable on ${service.host}:${service.port} (optional)`;
        console.log(msg);
        
        if (service.required) {
          diagnostics.errors.push(msg);
        } else {
          diagnostics.warnings.push(msg);
        }
      }
    }

    // Perform readiness checks
    const readinessChecks = [
      { name: 'Dashboard', url: `http://${this.serverHost}:${this.serverPort}/dashboard`, required: true },
      { name: 'Health', url: `http://${this.serverHost}:${this.serverPort}/api/health`, required: false },
      { name: 'Ready', url: `http://${this.serverHost}:${this.serverPort}/api/ready`, required: false },
    ];

    for (const check of readinessChecks) {
      const result = await this.performReadinessCheck(check.name, check.url, check.required);
      diagnostics.readinessChecks.push(result);
      
      if (result.status === 'pass') {
        console.log(`✅ ${check.name} check passed (${result.responseTime}ms)`);
      } else {
        const msg = check.required
          ? `❌ ${check.name} check failed: ${result.error || 'Unknown error'}`
          : `⚠️  ${check.name} check failed: ${result.error || 'Unknown error'} (optional)`;
        console.log(msg);
        
        if (check.required) {
          diagnostics.errors.push(msg);
        } else {
          diagnostics.warnings.push(msg);
        }
      }
    }

    diagnostics.endTime = Date.now();
    diagnostics.duration = diagnostics.endTime - startTime;
    diagnostics.success = diagnostics.errors.length === 0;

    console.log('=' .repeat(60));
    console.log(`📊 Diagnostics complete in ${diagnostics.duration}ms`);
    console.log(`✅ Success: ${diagnostics.success}`);
    console.log(`❌ Errors: ${diagnostics.errors.length}`);
    console.log(`⚠️  Warnings: ${diagnostics.warnings.length}`);
    console.log('');

    return diagnostics;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.startupMode === 'managed' && this.serverProcess) {
      await this.stopServer();
    }
  }

  /**
   * Get current mode
   */
  getMode(): StartupMode {
    return this.startupMode;
  }

  /**
   * Get server URL
   */
  getServerUrl(): string {
    return `http://${this.serverHost}:${this.serverPort}`;
  }
}
