/**
 * Dashboard request orchestration to prevent fetch storms
 * Prevents all widgets from fetching simultaneously, loads critical data first,
 * staggers non-critical widgets, and limits concurrency
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface RequestTask<T> {
    id: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    fn: () => Promise<T>;
    signal?: AbortSignal | undefined;
}

interface QueuedRequest {
    task: RequestTask<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
}

class RequestOrchestrator {
    private queue: QueuedRequest[] = [];
    private activeCount = 0;
    private maxConcurrency = 4;
    private processing = false;

    constructor(maxConcurrency?: number) {
        if (maxConcurrency) {
            this.maxConcurrency = maxConcurrency;
        }
        if (isDevelopment) {
            console.log(
                '[RequestOrchestrator] Initialized with maxConcurrency:',
                this.maxConcurrency,
            );
        }
    }

    /**
     * Execute a request with orchestration
     */
    async execute<T>(task: RequestTask<T>): Promise<T> {
        if (isDevelopment) {
            console.log(
                '[RequestOrchestrator] Queuing request:',
                task.id,
                'priority:',
                task.priority,
                'queue size:',
                this.queue.length,
                'active:',
                this.activeCount,
            );
        }

        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                task: task as RequestTask<unknown>,
                resolve: (value: unknown) => {
                    // Type assertion is safe here because we're passing through the exact same type
                    resolve(value as T);
                },
                reject,
            });
            this.processQueue();
        });
    }

    /**
     * Process the request queue with priority ordering
     */
    private processQueue(): void {
        if (this.processing || this.activeCount >= this.maxConcurrency) {
            return;
        }

        this.processing = true;

        // Sort queue by priority
        const priorityOrder: Record<string, number> = {
            critical: 0,
            high: 1,
            normal: 2,
            low: 3,
        };
        this.queue.sort((a, b) => {
            const aPriority = priorityOrder[a.task.priority] ?? 999;
            const bPriority = priorityOrder[b.task.priority] ?? 999;
            return aPriority - bPriority;
        });

        while (
            this.queue.length > 0 &&
            this.activeCount < this.maxConcurrency
        ) {
            const { task, resolve, reject } = this.queue.shift()!;
            this.activeCount++;

            if (isDevelopment) {
                console.log(
                    '[RequestOrchestrator] Executing request:',
                    task.id,
                    'priority:',
                    task.priority,
                    'active count:',
                    this.activeCount,
                );
            }

            // Execute the request
            task.fn()
                .then((result) => {
                    if (isDevelopment) {
                        console.log(
                            '[RequestOrchestrator] Request completed:',
                            task.id,
                        );
                    }
                    resolve(result);
                })
                .catch((error) => {
                    if (isDevelopment) {
                        console.error(
                            '[RequestOrchestrator] Request failed:',
                            task.id,
                            error,
                        );
                    }
                    reject(error as Error);
                })
                .finally(() => {
                    this.activeCount--;
                    // Continue processing queue after a small delay to stagger requests
                    setTimeout(() => {
                        this.processing = false;
                        this.processQueue();
                    }, 50);
                });
        }
    }

    /**
     * Clear all pending requests
     */
    clear(): void {
        if (isDevelopment) {
            console.log(
                '[RequestOrchestrator] Clearing queue, size:',
                this.queue.length,
            );
        }
        this.queue.forEach(({ reject }) => {
            reject(new Error('Request cancelled'));
        });
        this.queue = [];
    }

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Get active request count
     */
    getActiveCount(): number {
        return this.activeCount;
    }
}

// Global orchestrator instance
let globalOrchestrator: RequestOrchestrator | null = null;

/**
 * Get or create the global request orchestrator
 */
export function getRequestOrchestrator(
    maxConcurrency?: number,
): RequestOrchestrator {
    if (!globalOrchestrator) {
        globalOrchestrator = new RequestOrchestrator(maxConcurrency);
    }
    return globalOrchestrator;
}

/**
 * Execute a dashboard widget fetch with orchestration
 */
export async function withOrchestration<T>(
    id: string,
    priority: RequestTask<T>['priority'],
    fn: () => Promise<T>,
    signal?: AbortSignal,
): Promise<T> {
    const orchestrator = getRequestOrchestrator();
    return orchestrator.execute({ id, priority, fn, signal });
}

/**
 * Reset the global orchestrator (useful for testing)
 */
export function resetOrchestrator(): void {
    if (globalOrchestrator) {
        globalOrchestrator.clear();
    }
    globalOrchestrator = null;
}
