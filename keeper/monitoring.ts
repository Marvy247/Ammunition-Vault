import * as winston from 'winston';
import config from './config.js';

export interface KeeperMetrics {
  totalStrategies: number;
  successfulStrategies: number;
  failedStrategies: number;
  totalProfit: string;
  totalGasUsed: string;
  averageExecutionTime: number;
  lastExecutionTime: number;
  circuitBreakerActive: boolean;
  consecutiveFailures: number;
  successRate: number;
}

class KeeperMonitor {
  private logger!: winston.Logger;
  private metrics!: KeeperMetrics;
  private startTime: number;

  constructor() {
    this.setupLogger();
    this.initializeMetrics();
    this.startTime = Date.now();
  }

  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: config.monitoring.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'keeper' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ],
    });
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalStrategies: 0,
      successfulStrategies: 0,
      failedStrategies: 0,
      totalProfit: '0',
      totalGasUsed: '0',
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      circuitBreakerActive: false,
      consecutiveFailures: 0,
      successRate: 100
    };
  }

  logInfo(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  logError(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
  }

  logWarn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  logDebug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  recordStrategyStart(strategyId: string): void {
    this.logInfo(`Strategy started: ${strategyId}`);
    this.metrics.totalStrategies++;
  }

  recordStrategySuccess(strategyId: string, profit: string, gasUsed: string, executionTime: number): void {
    this.metrics.successfulStrategies++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.totalProfit = (BigInt(this.metrics.totalProfit) + BigInt(profit)).toString();
    this.metrics.totalGasUsed = (BigInt(this.metrics.totalGasUsed) + BigInt(gasUsed)).toString();
    this.metrics.lastExecutionTime = executionTime;

    // Update average execution time
    this.metrics.averageExecutionTime =
      (this.metrics.averageExecutionTime * (this.metrics.successfulStrategies - 1) + executionTime) /
      this.metrics.successfulStrategies;

    this.logInfo(`Strategy successful: ${strategyId}`, {
      profit,
      gasUsed,
      executionTime,
      successRate: `${this.metrics.successfulStrategies}/${this.metrics.totalStrategies}`
    });
  }

  recordStrategyFailure(strategyId: string, error: string, executionTime: number): void {
    this.metrics.failedStrategies++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastExecutionTime = executionTime;

    this.logError(`Strategy failed: ${strategyId}`, new Error(error), {
      executionTime,
      consecutiveFailures: this.metrics.consecutiveFailures
    });

    // Activate circuit breaker if too many consecutive failures
    if (this.metrics.consecutiveFailures >= config.risk.circuitBreakerThreshold) {
      this.activateCircuitBreaker();
    }
  }

  private activateCircuitBreaker(): void {
    this.metrics.circuitBreakerActive = true;
    this.logWarn(`Circuit breaker activated after ${this.metrics.consecutiveFailures} consecutive failures`);
  }

  deactivateCircuitBreaker(): void {
    this.metrics.circuitBreakerActive = false;
    this.logInfo('Circuit breaker deactivated');
  }

  getMetrics(): KeeperMetrics & { successRate: number } {
    const successRate = this.metrics.totalStrategies > 0
      ? (this.metrics.successfulStrategies / this.metrics.totalStrategies) * 100
      : 100;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 10) / 10 // Round to 1 decimal place
    };
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    details: string[];
  } {
    const uptime = Date.now() - this.startTime;
    const successRate = this.metrics.totalStrategies > 0
      ? (this.metrics.successfulStrategies / this.metrics.totalStrategies) * 100
      : 100;

    const issues: string[] = [];

    if (this.metrics.circuitBreakerActive) {
      issues.push('Circuit breaker is active');
    }

    if (this.metrics.consecutiveFailures > 0) {
      issues.push(`${this.metrics.consecutiveFailures} consecutive failures`);
    }

    if (successRate < 50) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.length <= 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime,
      details: issues
    };
  }

  printSummary(): void {
    const health = this.getHealthStatus();
    const uptimeHours = Math.floor(health.uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((health.uptime % (1000 * 60 * 60)) / (1000 * 60));

    console.log('\n=== Keeper Status Summary ===');
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Uptime: ${uptimeHours}h ${uptimeMinutes}m`);
    console.log(`Total Strategies: ${this.metrics.totalStrategies}`);
    console.log(`Success Rate: ${this.metrics.totalStrategies > 0 ? ((this.metrics.successfulStrategies / this.metrics.totalStrategies) * 100).toFixed(1) : 0}%`);
    console.log(`Total Profit: ${this.metrics.totalProfit} USDC`);
    console.log(`Total Gas Used: ${this.metrics.totalGasUsed}`);
    console.log(`Average Execution Time: ${this.metrics.averageExecutionTime.toFixed(2)}ms`);
    console.log(`Circuit Breaker: ${this.metrics.circuitBreakerActive ? 'ACTIVE' : 'Inactive'}`);

    if (health.details.length > 0) {
      console.log('\nIssues:');
      health.details.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('=============================\n');
  }
}

export const monitor = new KeeperMonitor();
export default monitor;
